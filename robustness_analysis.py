import json
import re
import plotly.express as px
import pandas as pd
from models.v1_0CVXPY import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict
import numpy as np
import time
import plotly.express as px
import chart_studio
import chart_studio.plotly as py
from tqdm import tqdm
import os

# Access variables
chart_studio_username = os.getenv('CHART_STUDIO_USERNAME')
chart_studio_api_key = os.getenv('CHART_STUDIO_API_KEY')
chart_studio.tools.set_credentials_file(username=chart_studio_username, api_key=chart_studio_api_key)

def get_input_subset(input_data, num_trips, num_stops):
    """
    Generates a subset of the input data for a specific number of trips and stops.

    This function takes the full input data and extracts a subset relevant to a specified number of trips and stops.
    It considers various data types like scalars, vectors, and matrices, ensuring the subset aligns with the given parameters.

    Args:
        input_data (dict): The complete input data dictionary.
        num_trips (int): The number of trips to include in the subset.
        num_stops (int): The number of stops to include in the subset.

    Returns:
        dict: A dictionary representing the subset of input data for the specified number of trips and stops.

    Note:
        - The function categorises input data types (scalars, trip vectors, stop vectors, matrices) and slices them according to 'num_trips' and 'num_stops'.
    """

    input_subset = {}

    scalars = ["num_trips", "num_stops", "bus_capacity", "boarding_duration", "alighting_duration", "max_allowed_deviation", "penalty_coefficient"]
    trip_vectors = ["original_dispatch_list", "bus_availability_list"]
    stop_vectors = ["coordinates_list", "stop_ids_list", "stop_names_list", "prev_arrival_list", "prev_dwell_list", "arrival_rate_list", "alighting_percentage_list", "weights_list", "initial_passengers_list"]
    matrices = ["target_headway_2dlist", "interstation_travel_2dlist"]

    for scalar in scalars:
        if scalar == "num_trips":
            input_subset[scalar] = num_trips
        elif scalar == "num_stops":
            input_subset[scalar] = num_stops
        else:
            input_subset[scalar] = input_data[scalar]

    for trip_vector in trip_vectors:
        input_subset[trip_vector] = input_data[trip_vector][:num_trips]

    for stop_vector in stop_vectors:
        if stop_vector == "alighting_percentage_list" or stop_vector == "prev_dwell_list":
            input_subset[stop_vector] = input_data[stop_vector][:num_stops-1]
        else:
            input_subset[stop_vector] = input_data[stop_vector][:num_stops]

    for matrix in matrices:
        if matrix == "target_headway_2dlist":
            input_subset[matrix] = [trip[:num_stops] for trip in input_data[matrix][:num_trips]]
        else:
            input_subset[matrix] = [trip[:num_stops-1] for trip in input_data[matrix][:num_trips]]

    return input_subset

def get_all_timings(input_data):
    """
    Calculates the run time of the model for each combination of trips and stops.

    This function iterates through all possible combinations of trips and stops, running the model for each combination,
    and measuring the time taken for each run. It captures these times in a matrix.

    Args:
        input_data (dict): The full set of input data.

    Returns:
        np.ndarray: A 2D NumPy array where each element represents the time taken for the model to run with a specific combination of trips and stops.

    Note:
        - The function sets a threshold for the maximum waiting time (36 minutes). If exceeded, it stops further computation for that trip.
        - The function uses tqdm for progress visualisation.
    """
    num_trips = input_data["num_trips"]
    num_stops = input_data["num_stops"]

    timings_matrix = np.full((num_trips, num_stops), -1.0)

    overall_start = time.time()

    performance_comparisons = {}

    for j in tqdm(range(num_trips), desc="Trips", position=0):
        for s in tqdm(range(num_stops), desc=f"Stops for Trip {j+1}", leave=False, position=1):
            input_subset = get_input_subset(input_data, j+1, s+1)
            start = time.time()
            try:
                output_unoptimised = run_model(data=input_subset, silent=True, unoptimised=True ,retry=False)
                output_optimised = run_model(data=input_subset, silent=True, unoptimised=False, retry=False)
                performance_comparisons[f"{j},{s}"] = (output_unoptimised["ewt_value"], output_optimised["ewt_value"])

                duration_taken = time.time() - start
                timings_matrix[j, s] = duration_taken
                if duration_taken > 2160: # 36 mins of waiting time
                    timings_matrix[j, s+1:].fill(duration_taken)
                    break
            except:
                timings_matrix[j, s] = -1.0
    
    with open('performance_metrics.json', "w") as f:
        json.dump(performance_comparisons, f, indent=4)

    print(f"Time taken for the entire simulation: {time.time() - overall_start}")

    return timings_matrix

def main():
    """
    The main function to run the computational complexity analysis for a specified model.

    This function runs the unoptimised and optimised model to calculate the performance improvement in Excess Wait Time

    """

    input_data = convert_json_to_dict("./data/inputs/actual/actual_input_2710.json")

    timings_matrix = get_all_timings(input_data)

if __name__ == "__main__":
    main()