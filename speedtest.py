import json
from models.v2_1 import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed
import re

import time
from tqdm import tqdm

if __name__ == "__main__":
    input_data = convert_json_to_dict("./data/inputs/mock/mock_input_2908.json")

    model = "v2_1"
    is_first_trip = True

    try:
        start_time = time.time()
        if bool(re.match(r'v([3-9]|\d{2,})\_\d+|v2\_[0-9]+', model)): # check for models versions v2.0 and above
            for i in tqdm(range(1000)):
                output_data = run_model(data=input_data, silent=True, is_first_trip=is_first_trip)
        else:
            for i in tqdm(range(1000)):
                output_data = run_model(data=input_data, silent=True)
        print("--- %s seconds ---" % (time.time() - start_time))

    except Exception as e:
        print(e)