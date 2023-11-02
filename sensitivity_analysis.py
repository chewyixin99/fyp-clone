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
# from dotenv import load_dotenv
import os

# Load environment variables from .env file
# load_dotenv()

# Access variables
chart_studio_username = os.getenv('CHART_STUDIO_USERNAME')
chart_studio_api_key = os.getenv('CHART_STUDIO_API_KEY')
chart_studio.tools.set_credentials_file(username=chart_studio_username, api_key=chart_studio_api_key)

def get_input_subset(input_data, num_trips, num_stops):
    input_subset = {}

    scalars = ["num_trips", "num_stops", "bus_capacity", "boarding_duration", "alighting_duration", "max_allowed_deviation"]
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
        if stop_vector == "alighting_percentage_list":
            input_subset[stop_vector] = input_data[stop_vector][:num_stops-1]
        else:
            input_subset[stop_vector] = input_data[stop_vector][:num_stops]

    for matrix in matrices:
        input_subset[matrix] = [trip[:num_stops] for trip in input_data[matrix][:num_trips]]

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
                run_model(data=input_subset, silent=True, retry=False)
                duration_taken = time.time() - start
                timings_matrix[j, s] = duration_taken
                if duration_taken > 2160: # 36 mins of waiting time
                    timings_matrix[j, s+1:].fill(duration_taken)
                    break
            except:
                timings_matrix[j, s] = -1.0

    print(f"Time taken for the entire simulation: {time.time() - overall_start}")

    return timings_matrix

def visualise_heatmap(timings_matrix, model_name):
    # create the heatmap
    fig = px.imshow(timings_matrix, 
                    labels=dict(x="Stops", y="Trips", color="Value"),
                    title=f"Computational complexity with varying stops and trips for model {model_name}",
                    zmin=0, zmax=np.percentile(timings_matrix, 90),
                    color_continuous_scale="RdBu_r")

    fig.update_xaxes(tickvals=list(range(timings_matrix.shape[1])), ticktext=list(range(1, timings_matrix.shape[1] + 1)))
    fig.update_yaxes(tickvals=list(range(timings_matrix.shape[0])), ticktext=list(range(1, timings_matrix.shape[0] + 1)))

    return fig

def visualise_3d(timings_matrix):
    # create coordinate grids
    num_trips = np.arange(1, timings_matrix.shape[0] + 1)
    num_stops = np.arange(1, timings_matrix.shape[1] + 1)
    stops, trips = np.meshgrid(num_stops, num_trips)

    # flatten data
    flat_data = timings_matrix.flatten()
    flat_stops = stops.flatten()
    flat_trips = trips.flatten()

    # filter out the -1 values for not possible combinations
    mask = flat_data != -1
    x = flat_stops[mask]
    y = flat_trips[mask]
    z = flat_data[mask]

    fig = px.scatter_3d(x=x, y=y, z=z, color=z, color_continuous_scale='Viridis',
                        labels={'x': 'Number of Stops', 'y': 'Number of Trips', 'z': 'Run time (s)'})

    return fig

def save_figure(fig_2d, fig_3d, save_fig_path_2d, save_fig_path_3d, timings_matrix, save_npy_path):

    directory_path = os.path.dirname(save_fig_path_2d)

    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

    _, file_type = os.path.splitext(save_fig_path_2d)

    if file_type == '.html':
        # save to an HTML file
        fig_2d.write_html(save_fig_path_2d)
        print(f"successfully saved figures as a .html file at {save_fig_path_2d}!")
        fig_3d.write_html(save_fig_path_3d)
        print(f"successfully saved figures as a .html file at {save_fig_path_3d}!")
        

    if file_type == '.json':
        # convert the figure to a JSON format
        fig_json_2d = fig_2d.to_json()
        fig_json_3d = fig_3d.to_json()

        # write to a JSON file
        with open(save_fig_path_2d, "w") as file:
            json.dump(fig_json_2d, file)
        with open(save_fig_path_3d, "w") as file:
            json.dump(fig_json_3d, file)
        print(f"successfully saved as a .json file at {save_fig_path_2d}!")

    np.save(save_npy_path, timings_matrix)
    print(f"successfully saved matrix as a .npy file at {save_npy_path}!")

def main():
    model = "v1_0CVXPY" # NOTE: to change to other models (not frequent)
    file_type = "html"
    chart_studio_upload = True
    save_fig_path_2d = f"./data/sensitivity_analyses/{model}_2d.{file_type}"
    save_fig_path_3d = f"./data/sensitivity_analyses/{model}_3d.{file_type}"
    save_npy_path = f"./data/sensitivity_analyses/{model}.npy"

    input_data = convert_json_to_dict("./data/inputs/actual/actual_input_2710.json")
    # input_data = convert_json_to_dict("./data/inputs/mock/mock_input_2909.json")

    timings_matrix = get_all_timings(input_data)
    # timings_matrix = np.load(save_npy_path, allow_pickle=True)
    fig_2d = visualise_heatmap(timings_matrix, model)
    fig_3d = visualise_3d(timings_matrix)
    save_figure(fig_2d, fig_3d, save_fig_path_2d, save_fig_path_3d, timings_matrix, save_npy_path)

    if chart_studio_upload:
        py.plot(fig_2d, filename=f'{model}_2d', auto_open=True)
        py.plot(fig_3d, filename=f'{model}_3d', auto_open=True)

if __name__ == "__main__":
    main()