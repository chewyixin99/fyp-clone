import json
import re
import plotly.express as px
import pandas as pd
from models.v1_0CVXPY import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed
from utils.validate_data import validate_data
from utils.coordinates import calculate_haversine_distance

def main():
    MODEL_NAME = "v1_0CVXPY" # NOTE: to change to other models (not frequent)
    POLLING_RATE = 1
    UNOPTIMISED = False
    SILENT = False
    
    if UNOPTIMISED:
        string_prefix = 'un'
    else:
        string_prefix = ''

    input_data = convert_json_to_dict("./data/inputs/actual/actual_input_2710.json")

    is_data_valid = validate_data(input_data)

    if not is_data_valid:
        print("Data is not valid")
        return
    
    else:
        print(f"Data is valid, running model {MODEL_NAME} now.")

    try:
        output_data = run_model(data=input_data, silent=SILENT, unoptimised=UNOPTIMISED, retry=True)
    except Exception as e:
        print("run_model failed")
        print(e)

    # pre-calculating haversine distances for performance reasons
    cumulative_distances = [0.0]
    current_distance = 0
    current_coordinate = input_data['coordinates_list'][0]

    for coordinate in input_data['coordinates_list'][1:]:
        current_distance += calculate_haversine_distance(coord1=current_coordinate, coord2=coordinate)
        cumulative_distances.append(current_distance)
        current_coordinate = coordinate

    try:
        write_data_to_json(
            output_file_path=f"./data/outputs/json/{MODEL_NAME}/{MODEL_NAME}_{string_prefix}optimised_output.json",
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
    except Exception as e:
        print("write_data_to_json failed")
        print(e)

    try:
        json_to_feed(
            f"./data/outputs/json/{MODEL_NAME}/{MODEL_NAME}_{string_prefix}optimised_output.json",
            f"./data/outputs/csv/{MODEL_NAME}/{MODEL_NAME}_poll{POLLING_RATE}_{string_prefix}optimised_feed.csv",
            polling_rate=POLLING_RATE
        )
    except Exception as e:
        print('json_to_feed failed')
        print(e)

if __name__ == "__main__":
    main()