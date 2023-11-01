import os
import json
from http import HTTPStatus

from ..services.mm_cache import mm_cache_key_gen, set_mm_result_cache, get_mm_result_cache
from ..services.uploaded_data_cache import uploaded_data_cache_key_gen, get_uploaded_data_cache
from ..mm.model import run_model
from ..mm.utils.transformation import compress_dicts, json_to_feed

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

  output_data = run_model(
    data=input_data,
    deviated_dispatch_dict=deviated_dispatch_dict,
    silent=silent,
    unoptimised=unoptimised
  )

  result = compress_dicts(
    num_trips=input_data["num_trips"],
    num_stops=input_data["num_stops"],
    bus_capacity=input_data["bus_capacity"],
    original_dispatch_list=input_data["original_dispatch_list"],
    coordinates_list=input_data["coordinates_list"],
    stop_ids_list=input_data["stop_ids_list"],
    stop_names_list=input_data["stop_names_list"],
    weights_list=input_data["weights_list"],
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
          data="no uploaded file found"
        )
      )

    return input_data

  # local_data_path = os.path.join(os.path.dirname(__file__), "../static/mock_input.json")
  local_data_path = os.path.join(os.path.dirname(__file__), "../static/actual_input.json")

  with open(local_data_path, 'r') as file:
    input_data = json.load(file)

  return input_data