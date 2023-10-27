import json
import re
import plotly.express as px
import pandas as pd
from models.v1_0CVXPY import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed

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

    try:
        output_data = run_model(data=input_data, silent=SILENT, unoptimised=UNOPTIMISED)
    except Exception as e:
        print("run_model failed")
        print(e)

    try:
        write_data_to_json(
            output_file_path=f"./data/outputs/json/{MODEL_NAME}/{MODEL_NAME}_{string_prefix}optimised_output.json",
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
            stranded_matrix=output_data["stranded_dict"],
            dispatch_list=output_data["dispatch_dict"],
            objective_value=output_data["objective_value"],
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