import os
import json

from ..mm.model import run_model
from ..mm.utils.transformation import compress_dicts, json_to_feed

def get_mm_result_matrices():
  '''
    Transform result to json and return result.
  '''
  return get_mm_raw_result() # TODO: PF-190 - retrieve this data from cache 

def get_mm_result_feed():
  '''
    Transform result to feed and return result.
  '''
  polling_rate = 15
  output_data = get_mm_raw_result() # TODO: PF-190 - retrieve this data from cache 
  result = json_to_feed(
    polling_rate=polling_rate,
    data=output_data
  )

  return result

def get_mm_raw_result():
  '''
    Coordinates running of model and returning of raw result.
    Checks if data has been cached. Unless there is cached data, run the model.
  '''
  silent = False
  input_data = get_mm_input_data()
  output_data = run_model(data=input_data,silent=silent) # TODO: PF-190 - check cached data before running here

  # TODO: PF-190 - save output to cache if model is ran

  result = compress_dicts(
    num_trips=input_data["num_trips"],
    num_stops=input_data["num_stops"],
    bus_capacity=input_data["bus_capacity"],
    original_dispatch_list=input_data["original_dispatch_list"],
    coordinates_list=input_data["coordinates_list"],
    stop_ids_list=input_data["stop_ids_list"],
    stop_names_list=input_data["stop_names_list"],
    dwell_matrix=output_data["dwell_dict"],
    busload_matrix=output_data["busload_dict"],
    arrival_matrix=output_data["arrival_dict"],
    headway_matrix=output_data["headway_dict"],
    stranded_matrix=output_data["stranded_dict"],
    dispatch_list=output_data["dispatch_dict"],
    objective_value=output_data["objective_value"],
  )

  return result

def get_mm_input_data():
  '''
    Coordinates data retrieval and transformation.
  '''
  input_data = None
  mock_data_path = os.path.join(os.path.dirname(__file__), "../static/mock_input.json")

  with open(mock_data_path, 'r') as file:
    input_data = json.load(file)

  return input_data