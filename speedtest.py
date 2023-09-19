import json
from models.v1_4 import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed

import time
from tqdm import tqdm

if __name__ == "__main__":

    model = 'v1.4'

    input_data = convert_json_to_dict("./data/inputs/mock_input.json")

    try:
        start_time = time.time()
        for i in tqdm(range(1000)):
            output_data = run_model(input_data)
        print("--- %s seconds ---" % (time.time() - start_time))

    except Exception as e:
        print(e)