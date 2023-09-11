import json

from models.v1_1 import run_model # NOTE: to change to other models (not frequent)
from data.transformation import convert_json_to_dict, write_data_to_json

if __name__ == "__main__":
    input_data = convert_json_to_dict("./data/inputs/mock_input.json")

    try:
        output_data = run_model(input_data)
    except Exception as e:
        print(e)

    write_data_to_json(
        "./data/outputs/v1.1_output.json", # NOTE: to change to other models (not frequent)
        dwell_matrix=output_data["dwell_dict"],
        busload_matrix=output_data["busload_dict"],
        arrival_matrix=output_data["arrival_dict"]
        )