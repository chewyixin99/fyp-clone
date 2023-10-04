import json
import re
import plotly.express as px
import pandas as pd
from models.v1_0 import run_model # NOTE: to change to other models (not frequent)
from utils.transformation import convert_json_to_dict
import numpy as np
import time
import plotly.express as px
from tqdm import tqdm
import os

def get_input_subset(input_data, num_trips, num_stops):
    input_subset = {}

    input_subset["num_trips"] = num_trips
    input_subset["num_stops"] = num_stops
    input_subset["bus_capacity"] = input_data["bus_capacity"]
    input_subset["boarding_duration"] = input_data["boarding_duration"]
    input_subset["alighting_duration"] = input_data["alighting_duration"]
    input_subset["max_allowed_deviation"] = input_data["max_allowed_deviation"]

    input_subset["original_dispatch_list"] = input_data["original_dispatch_list"][:num_trips]
    input_subset["bus_availability_list"] = input_data["bus_availability_list"][:num_trips]

    input_subset["coordinates_list"] = input_data["coordinates_list"][:num_stops]
    input_subset["stop_ids_list"] = input_data["stop_ids_list"][:num_stops]
    input_subset["stop_names_list"] = input_data["stop_names_list"][:num_stops]
    input_subset["prev_arrival_list"] = input_data["prev_arrival_list"][:num_stops]
    input_subset["prev_dwell_list"] = input_data["prev_dwell_list"][:num_stops]
    input_subset["arrival_rate_list"] = input_data["arrival_rate_list"][:num_stops]
    input_subset["alighting_percentage_list"] = input_data["alighting_percentage_list"][:num_stops-1]
    input_subset["weights_list"] = input_data["weights_list"][:num_stops]
    input_subset["initial_passengers_list"] = input_data["initial_passengers_list"][:num_stops]

    input_subset["target_headway_2dlist"] = [trip[:num_stops] for trip in input_data["target_headway_2dlist"][:num_trips]]
    input_subset["target_headway_2dlist"] = [trip[:num_stops] for trip in input_data["target_headway_2dlist"][:num_trips]]
    input_subset["interstation_travel_2dlist"] = [trip[:num_stops] for trip in input_data["interstation_travel_2dlist"][:num_trips]]

    return input_subset

def get_all_timings(input_data):
    num_trips = input_data["num_trips"]
    num_stops = input_data["num_stops"]

    timings_matrix = np.full((num_trips, num_stops), -1.0)

    overall_start = time.time()

    for j in tqdm(range(num_trips), desc="Trips", position=0):
        for s in tqdm(range(num_stops), desc=f"Stops for Trip {j+1}", leave=False, position=1):
            input_subset = get_input_subset(input_data, j+1, s+1)
            start = time.time()
            try:
                run_model(data=input_subset, silent=True)
                timings_matrix[j, s] = time.time() - start
            except:
                timings_matrix[j, s] = -1.0

    print(f"Time taken for the entire simulation: {time.time() - overall_start}")

    return timings_matrix

def visualise_heatmap(timings_matrix, model_name):
    # create the heatmap
    fig = px.imshow(timings_matrix, 
                    labels=dict(x="Stops", y="Trips", color="Value"),
                    title=f"Computational complexity with varying stops and trips for model {model_name}",
                    zmin=0, zmax=0.04,
                    color_continuous_scale="RdBu_r")

    fig.update_xaxes(tickvals=list(range(timings_matrix.shape[1])), ticktext=list(range(1, timings_matrix.shape[1] + 1)))
    fig.update_yaxes(tickvals=list(range(timings_matrix.shape[0])), ticktext=list(range(1, timings_matrix.shape[0] + 1)))

    # show the heatmap
    fig.show()

    return fig

def save_figure(fig, save_fig_path):

    directory_path = os.path.dirname(save_fig_path)

    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

    _, file_type = os.path.splitext(save_fig_path)

    if file_type == '.html':
        # save to an HTML file
        fig.write_html(save_fig_path)
        print(f"successfully saved as a .html file at {save_fig_path}!")

    if file_type == '.json':
        # convert the figure to a JSON format
        fig_json = fig.to_json()

        # write to a JSON file
        with open(save_fig_path, "w") as file:
            json.dump(fig_json, file)
        print(f"successfully saved as a .json file at {save_fig_path}!")


        


if __name__ == "__main__":

    model = "v1_0" # NOTE: to change to other models (not frequent)
    file_type = "html"
    save_fig_path = f"./data/sensitivity_analyses/{model}.{file_type}"

    input_data = convert_json_to_dict("./data/inputs/actual/actual_input_2908.json")
    # input_data = convert_json_to_dict("./data/inputs/mock/mock_input_2908.json")

    timings_matrix = get_all_timings(input_data)
    fig = visualise_heatmap(timings_matrix, model)
    save_figure(fig, save_fig_path)