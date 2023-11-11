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
    """
    Creates a heatmap visualisation of the model's computational complexity.

    This function generates a heatmap based on the timings matrix, representing the computational complexity of the model
    as a function of the number of trips and stops.

    Args:
        timings_matrix (np.ndarray): The matrix containing the timings for each combination of trips and stops.
        model_name (str): The name of the model used for the runs.

    Returns:
        plotly.graph_objs._figure.Figure: A Plotly figure object representing the heatmap.

    Note:
        - The heatmap uses colour coding to represent run times, providing a visual representation of the model's computational complexity.
    """

    # create the heatmap
    fig = px.imshow(timings_matrix, 
                    labels=dict(x="Stops", y="Trips", color="Value"),
                    title=f"Computational complexity with varying stops and trips for model {model_name}",
                    zmin=0, zmax=np.percentile(timings_matrix, 90),
                    color_continuous_scale="RdBu_r")

    fig.update_xaxes(tickvals=list(range(timings_matrix.shape[1])), ticktext=list(range(1, timings_matrix.shape[1] + 1)))
    fig.update_yaxes(tickvals=list(range(timings_matrix.shape[0])), ticktext=list(range(1, timings_matrix.shape[0] + 1)))

    fig.show()

    return fig

def visualise_3d(timings_matrix):
    """
    Generates a 3D scatter plot visualisation of the model's computational complexity.

    This function creates a 3D scatter plot using the timings matrix, plotting the number of trips, stops, and the corresponding run time.

    Args:
        timings_matrix (np.ndarray): The matrix containing the timings for each combination of trips and stops.

    Returns:
        plotly.graph_objs._figure.Figure: A Plotly figure object representing the 3D scatter plot.

    Note:
        - The function transforms the 2D timings matrix into a 3D coordinate system, where the Z-axis represents the run time.
        - The visualisation aids in understanding how the computational complexity scales with the number of trips and stops.
    """

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

    fig.show()

    return fig

def save_figure(fig_2d, fig_3d, save_fig_path_2d, save_fig_path_3d, timings_matrix, save_npy_path):
    """
    Saves the generated figures and the timings matrix to specified paths.

    This function saves the 2D heatmap and 3D scatter plot to HTML or JSON formats, and the timings matrix to a NumPy file.

    Args:
        fig_2d (plotly.graph_objs._figure.Figure): The 2D heatmap figure.
        fig_3d (plotly.graph_objs._figure.Figure): The 3D scatter plot figure.
        save_fig_path_2d (str): File path for saving the 2D heatmap.
        save_fig_path_3d (str): File path for saving the 3D scatter plot.
        timings_matrix (np.ndarray): The timings matrix.
        save_npy_path (str): File path for saving the timings matrix.

    Note:
        - The function supports saving figures in HTML and JSON formats.
        - The directory for saving the figures is created if it does not exist.
        - It also saves the timings matrix as a .npy file for future use.
    """

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
    """
    The main function to run the computational complexity analysis for a specified model.

    This function sets up the paths for saving output, loads the input data, generates timings, and visualizes the results. It also provides options to
    save the figures and upload them to Chart Studio.

    Note:
        - The model name and file type for saving figures can be specified.
        - The function allows for the option to upload the figures to Chart Studio.
        - It encapsulates the full workflow from data loading to visualisation and saving of results.
    """

    MODEL_NAME = "v1_0CVXPY" # NOTE: to change to other model names
    FILE_TYPE = "html"
    LOAD_VISUALISATION = True
    CHART_STUDIO_UPLOAD = False
    SAVE_FIGURES = False

    save_fig_path_2d = f"./data/sensitivity_analyses/{MODEL_NAME}_2d.{FILE_TYPE}"
    save_fig_path_3d = f"./data/sensitivity_analyses/{MODEL_NAME}_3d.{FILE_TYPE}"
    save_npy_path = f"./data/sensitivity_analyses/{MODEL_NAME}.npy"

    input_data = convert_json_to_dict("./data/inputs/actual/actual_input_2710.json")

    if LOAD_VISUALISATION:
        timings_matrix = np.load(save_npy_path, allow_pickle=True)
    else:
        timings_matrix = get_all_timings(input_data)

    fig_2d = visualise_heatmap(timings_matrix, MODEL_NAME)
    fig_3d = visualise_3d(timings_matrix)

    if SAVE_FIGURES:
        save_figure(fig_2d, fig_3d, save_fig_path_2d, save_fig_path_3d, timings_matrix, save_npy_path)

    if CHART_STUDIO_UPLOAD:
        py.plot(fig_2d, filename=f'{MODEL_NAME}_2d', auto_open=True)
        py.plot(fig_3d, filename=f'{MODEL_NAME}_3d', auto_open=True)

if __name__ == "__main__":
    main()