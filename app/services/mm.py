import os
import json
from http import HTTPStatus

from ..cache.mm import mm_cache_key_gen, set_mm_result_cache, get_mm_result_cache
from ..cache.uploaded_data import uploaded_data_cache_key_gen, get_uploaded_data_cache
from ..mm.model import run_model
from ..mm.utils.transformation import compress_dicts, json_to_feed
from ..mm.utils.coordinates import calculate_haversine_distance
from ..mm.exceptions.invalid_input import InvalidInput

from ..response.standard import APIResponse
from ..response.error import APIException

async def get_mm_result_matrices(
  deviated_dispatch_dict: dict[str, any],
  unoptimised: bool,
  regenerate_results: bool,
  uploaded_file: bool = False
):
  '''
    Transform result to json and return result.
  '''
  return await get_mm_raw_result(
    deviated_dispatch_dict=deviated_dispatch_dict,
    unoptimised=unoptimised,
    regenerate_results=regenerate_results,
    uploaded_file=uploaded_file
  )

async def get_mm_result_feed(
  polling_rate: int,
  deviated_dispatch_dict: dict[str, any],
  unoptimised: bool,
  regenerate_results: bool,
  uploaded_file: bool = False
):
  '''
    Transform result to feed and return result.
  '''
  output_data = await get_mm_raw_result(
    deviated_dispatch_dict=deviated_dispatch_dict,
    unoptimised=unoptimised,
    regenerate_results=regenerate_results,
    uploaded_file=uploaded_file
  )

  result = json_to_feed(
    polling_rate=polling_rate,
    data=output_data
  )

  return result

async def get_mm_result_feed_stream(
  polling_rate: int,
  deviated_dispatch_dict: dict[str, any],
  unoptimised: bool,
  regenerate_results: bool,
  uploaded_file: bool = False
):
  output_data = await get_mm_raw_result(
    deviated_dispatch_dict=deviated_dispatch_dict,
    unoptimised=unoptimised,
    regenerate_results=regenerate_results,
    uploaded_file=uploaded_file
  )

  result = json_to_feed(
    polling_rate=polling_rate,
    data=output_data,
    return_df=True
  )

  for _, row in result.iterrows():
    yield json.dumps(row.to_dict()) + '\n'

async def get_mm_raw_result(
  deviated_dispatch_dict: dict[str, any],
  unoptimised: bool,
  regenerate_results: bool,
  uploaded_file: bool = False
):
  '''
    Coordinates running of model and returning of raw result.
    Checks if data has been cached. Unless there is cached data, run the model.
  '''
  cache_key = mm_cache_key_gen(deviated_dispatch_dict, unoptimised, uploaded_file)
  result = await get_mm_result_cache(cache_key)

  if result != None and not regenerate_results:
    return result

  silent = False
  input_data = await get_mm_input_data(uploaded_file)

  try:
    output_data = run_model(
      data=input_data,
      deviated_dispatch_dict=deviated_dispatch_dict,
      silent=silent,
      unoptimised=unoptimised,
      retry=True
    )
  except InvalidInput as e:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.BAD_REQUEST,
        status_text=HTTPStatus.BAD_REQUEST.phrase,
        data=f"{str(e)}",
        message="Failed to generate results, please examine feasibility of inputs."
      )
    )
  except Exception as e:
    raise APIException(
      response=APIResponse(
        status=HTTPStatus.INTERNAL_SERVER_ERROR,
        status_text=HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
        data=f"{str(e)}",
        message="Exception occured during result computation, please check validity of inputs provided."
      )
    )

  # pre-calculating haversine distances for performance reasons
  cumulative_distances = [0.0]
  current_distance = 0
  current_coordinate = input_data['coordinates_list'][0]

  for coordinate in input_data['coordinates_list'][1:]:
      current_distance += calculate_haversine_distance(coord1=current_coordinate, coord2=coordinate)
      cumulative_distances.append(current_distance)
      current_coordinate = coordinate

  result = compress_dicts(
    num_trips=input_data["num_trips"],
    num_stops=input_data["num_stops"],
    bus_capacity=input_data["bus_capacity"],
    original_dispatch_list=input_data["original_dispatch_list"],
    coordinates_list=input_data["coordinates_list"],
    distances_list=cumulative_distances,
    stop_ids_list=input_data["stop_ids_list"],
    stop_names_list=input_data["stop_names_list"],
    weights_list=input_data["weights_list"],
    max_allowed_deviation=input_data["max_allowed_deviation"],
    penalty_coefficient=input_data["penalty_coefficient"],
    dwell_matrix=output_data["dwell_dict"],
    busload_matrix=output_data["busload_dict"],
    arrival_matrix=output_data["arrival_dict"],
    headway_matrix=output_data["headway_dict"],
    obj_fn_matrix=output_data["obj_fn_dict"],
    stranded_matrix=output_data["stranded_dict"],
    dispatch_list=output_data["dispatch_dict"],
    objective_value=output_data["objective_value"],
    slack_penalty=output_data["slack_penalty"],
    ewt_value=output_data["ewt_value"]
  )

  await set_mm_result_cache(cache_key, result)
  return result

async def get_mm_input_data(
  uploaded_file: bool
):
  '''
    Coordinates data retrieval and transformation.
  '''
  input_data = None

  if uploaded_file:
    uploaded_data_cache_key = uploaded_data_cache_key_gen()
    input_data = await get_uploaded_data_cache(uploaded_data_cache_key)

    if input_data is None:
      raise APIException(
        response=APIResponse(
          status=HTTPStatus.BAD_REQUEST,
          status_text=HTTPStatus.BAD_REQUEST.phrase,
          message="No uploaded input data found."
        )
      )

    return input_data

  # local_data_path = os.path.join(os.path.dirname(__file__), "../static/mock_input.json")
  local_data_path = os.path.join(os.path.dirname(__file__), "../static/actual_input.json")

  with open(local_data_path, 'r') as file:
    input_data = json.load(file)

  return input_data