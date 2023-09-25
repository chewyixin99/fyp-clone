import json
import re
from models.v2_0 import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed

if __name__ == "__main__":

    model = "v2.0" # NOTE: to change to other models (not frequent)
    polling_rate = 30
    is_first_trip = True

    input_data = convert_json_to_dict("./data/inputs/mock/mock_input.json")

    try:
        if bool(re.match(r'v([3-9]|\d{2,})\.\d+|v2\.[0-9]+', model)): # check for models versions v2.0 and above
            output_data = run_model(data=input_data, is_first_trip=is_first_trip)
        else:
            output_data = run_model(data=input_data)

        write_data_to_json(
        output_file_path=f"./data/outputs/json/{model}/{model}_output.json",
        num_trips=input_data["num_trips"],
        num_stops=input_data["num_stops"],
        bus_capacity=input_data["bus_capacity"],
        original_dispatch_list=input_data["original_dispatch_list"],
        coordinates_list=input_data["coordinates_list"],
        dwell_matrix=output_data["dwell_dict"],
        busload_matrix=output_data["busload_dict"],
        arrival_matrix=output_data["arrival_dict"],
        headway_matrix=output_data["headway_dict"],
        dispatch_list=output_data["dispatch_dict"],
        )

        json_to_feed(
            f"./data/outputs/json/{model}/{model}_output.json",
            f"./data/outputs/csv/{model}/{model}_poll{polling_rate}_feed.csv",
            polling_rate=polling_rate
        )

    except Exception as e:
        print(e)