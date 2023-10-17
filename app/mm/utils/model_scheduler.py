# TODO refactor

from models.v1_0 import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed
from copy import deepcopy
import json

def split_into_horizons(input_data, horizon_length, recalculation_interval):

    horizons = []
    i = 0

    while i < input_data['num_trips']:
        horizon_data = deepcopy(input_data)

        j = i + horizon_length
        j = min(j, input_data['num_trips'])

        # only these variables can be added prior to any model runs, prev_arrival, prev_dwell and initial_passengers
        # are to be dynamically added by another function
        horizon_data['num_trips'] = j - i
        horizon_data['original_dispatch_list'] = input_data['original_dispatch_list'][i:j]
        horizon_data['bus_availability_list'] = input_data['bus_availability_list'][i:j]
        horizon_data['target_headway_2dlist'] = input_data['target_headway_2dlist'][i:j]
        horizon_data['interstation_travel_2dlist'] = input_data['interstation_travel_2dlist'][i:j]

        horizons.append(horizon_data)
        i += recalculation_interval

    return horizons

def extract_updated_data(horizon_output, recalculation_interval, num_stops):

    dynamic_prev_arrival_list = []
    dynamic_prev_dwell_list = []
    dynamic_initial_passengers_list = []

    for s in range(1, num_stops+1):
        if s != 1:
            dynamic_prev_arrival_list.append(horizon_output["arrival_dict"][f"{recalculation_interval},{s}"])
        else:
            dynamic_prev_arrival_list.append(horizon_output["dispatch_dict"][f"{recalculation_interval}"])            
        dynamic_prev_dwell_list.append(horizon_output["dwell_dict"][f"{recalculation_interval},{s}"])
        dynamic_initial_passengers_list.append(horizon_output["stranded_dict"][f"{recalculation_interval},{s}"])
    
    return dynamic_prev_arrival_list, dynamic_prev_dwell_list, dynamic_initial_passengers_list

def glue_dispatch_timings(horizon_outputs, recalculation_interval, horizon_length):

    glued_dispatch_dict = {}

    for i in range(len(horizon_outputs)):
        for trip in range(1, horizon_length+1):
            if f"{trip}" in horizon_outputs[i]["dispatch_dict"]:
                glued_dispatch_dict[f"{trip+ i*recalculation_interval}"] = horizon_outputs[i]["dispatch_dict"][f"{trip}"]

    return glued_dispatch_dict

if __name__ == "__main__":
    model = "v1_0" # NOTE: to change to other models (not frequent)
    type_of_data = "mock" # actual or mock
    data_date = "2908"
    polling_rate = 30
    is_first_trip = True
    horizon_length = 3
    recalculation_interval = 2

    input_data = convert_json_to_dict(f"./data/inputs/{type_of_data}/{type_of_data}_input_{data_date}.json")
    # print(input_data)

    # cutting up into rolling horizons
    horizon_inputs = split_into_horizons(input_data, horizon_length, recalculation_interval)
    horizon_outputs = []
    num_stops = input_data["num_stops"]

    # run trips
    trip_no = 1
    for i in range(len(horizon_inputs)):
        if i != 0:
            horizon_inputs[i]["prev_arrival_list"], \
            horizon_inputs[i]["prev_dwell_list"], \
            horizon_inputs[i]["initial_passengers_list"] = extract_updated_data(horizon_output, recalculation_interval, num_stops)
            # print(json.dumps(horizon_inputs[i], indent=4))
        horizon_output = run_model(horizon_inputs[i])
        horizon_outputs.append(horizon_output)
        trip_no += 1

    # piecing back horizon_outputs

    print('outputs')
    # print(horizon_outputs)
    formatted_output = json.dumps(horizon_outputs, indent=4)
    print(formatted_output)

    glued_dispatch_dict = glue_dispatch_timings(horizon_outputs, recalculation_interval, horizon_length)
    print(glued_dispatch_dict)

    # re-evaluate the efficacy of these dispatch timings, similar if not the same since there is no 'uncertainty' imbued
    final_outputs = run_model(input_data, glued_dispatch_dict=glued_dispatch_dict)

    #TODO interactive bus dispatch with 'real-time' input from user

