import json
from models.v1_3 import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed

import time
from tqdm import tqdm

if __name__ == "__main__":

    model = 'v1.3'

    input_data = convert_json_to_dict("./data/inputs/mock_input.json")

    try:
        start_time = time.time()
        for i in tqdm(range(1000)):
            output_data = run_model(input_data)
        print("--- %s seconds ---" % (time.time() - start_time))

        write_data_to_json(
        f"./data/outputs/json/{model}_output.json",
        num_trips=input_data["num_trips"],
        num_stops=input_data["num_stops"],
        original_dispatch_list=input_data["original_dispatch_list"],
        coordinates_list=input_data["coordinates_list"],
        dwell_matrix=output_data["dwell_dict"],
        busload_matrix=output_data["busload_dict"],
        arrival_matrix=output_data["arrival_dict"],
        dispatch_list=output_data["dispatch_dict"],
        )

        json_to_feed(
            f"./data/outputs/json/{model}_output.json",
            f"./data/outputs/csv/{model}_output.csv",
        )

    except Exception as e:
        print(e)