import json
import re
from models.v1_4 import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed

if __name__ == "__main__":

    model = "v1_4" # NOTE: to change to other models (not frequent)
    polling_rate = 30
    is_first_trip = False
    silent = False

    input_data = convert_json_to_dict("./data/inputs/actual/actual.json")
    # input_data = convert_json_to_dict("./data/inputs/mock/mock_input_2908.json")

    try:
        if bool(re.match(r'v([3-9]|\d{2,})\_\d+|v2\_[0-9]+', model)): # check for models versions v2.0 and above
            output_data = run_model(data=input_data, is_first_trip=is_first_trip, silent=silent)
        else:
            output_data = run_model(data=input_data, silent=silent)
    except Exception as e:
        print("run_model failed")
        print(e)

    try:
        write_data_to_json(
        output_file_path=f"./data/outputs/json/{model}/{model}_output.json",
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
        )
    except Exception as e:
        print("write_data_to_json failed")
        print(e)

    try:
        json_to_feed(
            f"./data/outputs/json/{model}/{model}_output.json",
            f"./data/outputs/csv/{model}/{model}_poll{polling_rate}_feed.csv",
            polling_rate=polling_rate
        )
    except Exception as e:
        print('json_to_feed failed')
        print(e)