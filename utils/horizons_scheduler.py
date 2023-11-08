from models.v1_0CVXPY import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict, write_data_to_json, json_to_feed
from copy import deepcopy
import json

def split_into_horizons(input_data, horizon_length, recalculation_interval):
    """
    Splits the input data into multiple smaller data sets (horizons) based on a specified horizon length and recalculation interval.

    This function divides the larger set of trip data into smaller segments or 'horizons' for processing. Each horizon
    contains a subset of the trips determined by the horizon length. The function allows for overlap in data between
    horizons based on the recalculation interval.

    Args:
        input_data (dict): The complete input data for all trips.
        horizon_length (int): The number of trips to include in each horizon.
        recalculation_interval (int): The interval at which to recalculate the horizons, allowing for overlapping data points.

    Returns:
        list: A list of dictionaries, where each dictionary represents a segment of the input data for a specific horizon.

    Note:
        - The function uses a deepcopy to ensure that modifications to horizon data do not affect the original input data.
        - Only certain variables are updated for each horizon; others, like 'prev_arrival', 'prev_dwell', and 'initial_passengers', are to be dynamically added later.
    """

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
    """
    Extracts updated data from the output of a horizon for use in subsequent horizons.

    This function processes the output from a horizon run and extracts specific data points that are necessary for initializing the next horizon.

    Args:
        horizon_output (dict): The output data from a horizon run.
        recalculation_interval (int): The interval at which horizons are recalculated.
        num_stops (int): The number of stops in the trip data.

    Returns:
        tuple: A tuple containing three lists: 'dynamic_prev_arrival_list', 'dynamic_prev_dwell_list', and 'dynamic_initial_passengers_list'.
               Each list corresponds to dynamically updated values for the next horizon.

    Note:
        - The function assumes a specific structure of the horizon_output dictionary.
        - The values extracted are specifically tailored for initialising the next horizon in the sequence.
    """

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
    """
    Aggregates dispatch timings from multiple horizon outputs into a single dispatch dictionary.

    This function combines the dispatch timings from each horizon into a single dictionary, accounting for the overlaps
    and intervals defined by the recalculation interval and horizon length.

    Args:
        horizon_outputs (list): A list of dictionaries, each containing the output data from a horizon run.
        recalculation_interval (int): The interval at which horizons are recalculated.
        horizon_length (int): The number of trips included in each horizon.

    Returns:
        dict: A dictionary containing the aggregated dispatch timings for all trips across all horizons.

    Note:
        - The function aligns the trip numbers in the output dictionary to their original numbering in the full set of input data.
        - The function is critical for reconstructing a continuous schedule from segmented horizon outputs.
    """

    glued_dispatch_dict = {}

    for i in range(len(horizon_outputs)):
        for trip in range(1, horizon_length+1):
            if f"{trip}" in horizon_outputs[i]["dispatch_dict"]:
                glued_dispatch_dict[f"{trip+ i*recalculation_interval}"] = horizon_outputs[i]["dispatch_dict"][f"{trip}"]

    return glued_dispatch_dict

if __name__ == "__main__":
    """
    The main script to run the horizon-based bus dispatch scheduling model.

    This script orchestrates the splitting of input data into horizons, running the model on each horizon, extracting updated data for subsequent horizons,
    and finally aggregating the outputs into a final set of dispatch timings.

    Note:
        - The script is configured for a specific model version and input data type, which can be modified as needed.
        - The recalculation interval and horizon length are key parameters defining how the input data is segmented and processed.
        - The script includes diagnostic prints to observe the intermediate and final outputs.
    """

    TYPE_OF_DATA = "mock" # actual or mock
    DATA_DATE = "2908"
    HORIZON_LENGTH = 3
    RECALCULATION_INTERVAL = 2

    input_data = convert_json_to_dict(f"./data/inputs/{TYPE_OF_DATA}/{TYPE_OF_DATA}_input_{DATA_DATE}.json")
    # print(input_data)

    # cutting up into rolling horizons
    horizon_inputs = split_into_horizons(input_data, HORIZON_LENGTH, RECALCULATION_INTERVAL)
    horizon_outputs = []
    num_stops = input_data["num_stops"]

    # run trips
    trip_no = 1
    for i in range(len(horizon_inputs)):
        if i != 0:
            horizon_inputs[i]["prev_arrival_list"], \
            horizon_inputs[i]["prev_dwell_list"], \
            horizon_inputs[i]["initial_passengers_list"] = extract_updated_data(horizon_output, RECALCULATION_INTERVAL, num_stops)
            # print(json.dumps(horizon_inputs[i], indent=4))
        horizon_output = run_model(horizon_inputs[i])
        horizon_outputs.append(horizon_output)
        trip_no += 1

    # piecing back horizon_outputs

    print('outputs')
    # print(horizon_outputs)
    formatted_output = json.dumps(horizon_outputs, indent=4)
    print(formatted_output)

    glued_dispatch_dict = glue_dispatch_timings(horizon_outputs, RECALCULATION_INTERVAL, HORIZON_LENGTH)
    print(glued_dispatch_dict)

    # re-evaluate the efficacy of these dispatch timings, similar if not the same since there is no 'uncertainty' imbued
    final_outputs = run_model(input_data, glued_dispatch_dict=glued_dispatch_dict)