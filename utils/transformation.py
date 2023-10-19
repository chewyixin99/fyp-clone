from utils.coordinates import calculate_haversine_distance, split_line_between_coordinates
import json
import pandas as pd
import os
from typing import Dict, Tuple, Any

# Ingestion of .json inputs
def convert_json_to_dict(input_file_path):
    """
    Convert JSON data from a file to a Python dictionary.

    This function reads a JSON file located at the specified `input_file_path` and
    converts its contents into a Python dictionary.

    Args:
        input_file_path (str): The path to the JSON file to be read.

    Returns:
        dict: A Python dictionary containing the JSON data.

    Example:
        >>> data_dict = convert_json_to_dict("input.json")

        Assuming "input.json" contains the following JSON data:
        {
            "name": "John",
            "age": 30,
            "city": "New York"
        }

        The resulting Python dictionary will be:
        {
            "name": "John",
            "age": 30,
            "city": "New York"
        }
    """
    with open(input_file_path, "r") as f:
        data = json.load(f)

    return data

def convert_list_to_dict(list_to_convert, start_index, end_index):
    """
    Convert a list to a dictionary with integer keys.

    This function takes a list and converts it into a dictionary with integer keys.
    The indices of the list elements determine the keys in the resulting dictionary.

    Args:
        list_to_convert (list): The list to be converted.
        start_index (int): The starting index for the list.
        end_index (int): The ending index for the list.

    Returns:
        dict: A dictionary with integer keys representing the elements of the list.

    Example:
        >>> data_list = ["apple", "banana", "cherry"]
        >>> result_dict = convert_list_to_dict(data_list, 1, 3)

        The resulting dictionary will contain:
        {
            1: "apple",
            2: "banana",
            3: "cherry"
        }
    """
    return {i: list_to_convert[i-start_index] for i in range(start_index, end_index+1)}

def convert_2dlist_to_dict(list_to_convert, j_start, j_end, s_start, s_end):
    """
    Convert a 2D list to a dictionary with tuple keys.

    This function takes a 2D list and converts it into a dictionary with tuple keys.
    The indices of the list elements determine the keys in the resulting dictionary.

    Args:
        list_to_convert (list): The 2D list to be converted.
        j_start (int): The starting index for the first dimension (j).
        j_end (int): The ending index for the first dimension (j).
        s_start (int): The starting index for the second dimension (s).
        s_end (int): The ending index for the second dimension (s).

    Returns:
        dict: A dictionary with tuple keys representing the elements of the 2D list.

    Example:
        >>> data_list = [
        ...     [1, 2, 3],
        ...     [4, 5, 6],
        ...     [7, 8, 9]
        ... ]
        >>> result_dict = convert_2dlist_to_dict(data_list, 1, 3, 1, 3)

        The resulting dictionary will contain:
        {
            (1, 1): 1,
            (1, 2): 2,
            (1, 3): 3,
            (2, 1): 4,
            (2, 2): 5,
            (2, 3): 6,
            (3, 1): 7,
            (3, 2): 8,
            (3, 3): 9
        }
    """
    return {(j,s): list_to_convert[j-j_start][s-s_start] for j in range(j_start, j_end+1) for s in range(s_start, s_end+1)}

def compress_dicts(**dicts) -> Dict[str, Any]:
    '''
    Args:
        **dicts: One or more dictionaries to be compressed. Each dictionary will contain a key-value pair.
    
    Returns:
        dict: A compression of all of the input dictionaries.
    '''
    data_dict = {}
    for k, v in dicts.items():
        data_dict[k] = v
    
    return data_dict

def write_data_to_json(output_file_path, **dicts):
    """
    Write dictionaries to a JSON file.

    This function takes one or more dictionaries and writes their contents to a JSON file
    specified by the `output_file_path`. The dictionaries are combined into a single JSON
    object where each dictionary corresponds to a key-value pair in the JSON object.

    Args:
        output_file_path (str): The path to the JSON output file.
        **dicts: One or more dictionaries to be written to the JSON file. Each dictionary
            will be a key-value pair in the resulting JSON object.

    Returns:
        None

    Example:
        To write two dictionaries to a JSON file:

        >>> dict1 = {"key1": "value1"}
        >>> dict2 = {"key2": "value2"}
        >>> write_data_to_json("output.json", dict1=dict1, dict2=dict2)

    The resulting JSON file "output.json" will contain:

    {
        "dict1": {"key1": "value1"},
        "dict2": {"key2": "value2"}
    }
    """
    data_dict = compress_dicts(**dicts)
    directory_path = os.path.dirname(output_file_path)

    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

    with open(output_file_path, "w") as f:
        json.dump(data_dict, f, indent=4)

def initialise_dataframe(current_trip: int, data: Dict[str, Any], coordinates: Dict[str, Tuple[float, float]], 
                         cumulative_distances: Dict[str, float], polling_rate: int = 1) -> pd.DataFrame:
    """
    Initialises a DataFrame containing bus trip details for a GIVEN bus trip.
    It is used as a helper function to initialise dataframes to be concatenated later.

    This function creates a DataFrame containing timestamps, bus trip numbers, status of the trip, 
    bus stop numbers, latitudes, longitudes, and cumulative distances. It captures the dispatch from 
    the depot, stops at bus stops, dwelling times, and transit times between stops. 
    Intermediate data points based on a given polling rate are also included.

    Args:
        current_trip (int): The bus trip number for which the DataFrame is being generated.
        data (dict): A dictionary containing trip-related data. Expected keys include "dispatch_list", 
            "arrival_matrix", and "dwell_matrix".
        coordinates (dict): A dictionary mapping bus stop numbers to their corresponding 
            latitude and longitude coordinates. Example: {"1": (40.7128, -74.0060)}
        cumulative_distances (dict): A dictionary mapping bus stop numbers to the cumulative 
            distance (from the start) up to that stop.
        polling_rate (int, optional): The interval in seconds at which data points are to be sampled. 
            Defaults to 1.

    Returns:
        pd.DataFrame: A DataFrame containing the detailed bus trip data with columns: 
            "timestamp (in seconds)", "bus_trip_no", "status", "bus_stop_no", "latitude", 
            "longitude", and "distance".

    Note:
        - The status in the DataFrame can be one of the following:
            - "DISPATCHED_FROM": When the bus is dispatched from the depot.
            - "STOPPED_AT": When the bus stops at a bus stop.
            - "DWELL_AT": When the bus is dwelling at a bus stop.
            - "TRANSIT_TO": When the bus is in transit between two stops.
        - The function relies on the `split_line_between_coordinates` to determine the intermediate coordinates 
            between two bus stops.
    """

    POLLING_RATE = polling_rate

    # Initialize empty lists for each column
    timestamps = []
    bus_trip_nos = []
    statuses = []
    bus_stop_nos = []
    stop_ids = []
    stop_names = []
    latitudes = []
    longitudes = []
    distances = []

    # dispatch from the bus depot
    timestamps.append(data["dispatch_list"][f"{current_trip}"])
    bus_trip_nos.append(current_trip)
    statuses.append("DISPATCHED_FROM")
    bus_stop_nos.append(1)
    stop_ids.append(data["stop_ids_list"][0])
    stop_names.append(data["stop_names_list"][0])
    latitudes.append(coordinates[f"1"][0])
    longitudes.append(coordinates[f"1"][1])
    distances.append(0)

    # Iterate through the keys in the arrival_matrix (assuming it contains all necessary keys)
    for key in data["arrival_matrix"]:
        # Split the key into trip number and stop number
        trip_no, stop_no = map(int, key.split(','))

        # Get the timestamp from the arrival_matrix
        timestamp_seconds = data["arrival_matrix"][key]

        # Append data to respective lists for stops
        if trip_no == current_trip:
            timestamps.append(timestamp_seconds)
            bus_trip_nos.append(trip_no)
            statuses.append("STOPPED_AT")
            bus_stop_nos.append(stop_no)
            stop_ids.append(data["stop_ids_list"][stop_no-1])
            stop_names.append(data["stop_names_list"][stop_no-1])
            latitudes.append(coordinates[f"{stop_no}"][0])
            longitudes.append(coordinates[f"{stop_no}"][1])
            distances.append(cumulative_distances[f"{stop_no}"])

    timestamp_list = timestamps
    for i in range(len(timestamp_list)-1): # timestamp_list[i] = every stop's timestamp
        dwell_count = 1

        num_intermediate_segments = timestamp_list[i+1] - timestamp_list[i] - data["dwell_matrix"][f"{current_trip},{i+1}"]
        segments = split_line_between_coordinates(
            (coordinates[f"{i+1}"][0], coordinates[f"{i+1}"][1]),
            (coordinates[f"{i+2}"][0], coordinates[f"{i+2}"][1]),
            num_intermediate_segments
            )

        
        interstation_distance = cumulative_distances[f"{i+2}"] - cumulative_distances[f"{i+1}"]
        distance_per_timestep = interstation_distance / num_intermediate_segments

        segment_count = 0
        
        for intermediate_time in range(timestamp_list[i]+1, (timestamp_list[i+1])): #intermediate_time = timestamp at intermediates
            if dwell_count <= data["dwell_matrix"][f"{current_trip},{i+1}"]:
                if intermediate_time % POLLING_RATE == 0:
                    timestamps.append(intermediate_time)
                    bus_trip_nos.append(current_trip)
                    statuses.append("DWELL_AT")
                    latitudes.append(coordinates[f"{i+1}"][0])
                    longitudes.append(coordinates[f"{i+1}"][1])
                    bus_stop_nos.append(i+1)
                    stop_ids.append(data["stop_ids_list"][i])
                    stop_names.append(data["stop_names_list"][i])
                    distances.append(cumulative_distances[f"{i+1}"])
                dwell_count += 1

            else:
                if intermediate_time % POLLING_RATE == 0:
                    timestamps.append(intermediate_time)
                    bus_trip_nos.append(current_trip)
                    statuses.append("TRANSIT_TO")
                    latitudes.append(segments[segment_count][0])
                    longitudes.append(segments[segment_count][1])
                    bus_stop_nos.append(i+2)
                    stop_ids.append(data["stop_ids_list"][i+1])
                    stop_names.append(data["stop_names_list"][i+1])
                    covered_distance = cumulative_distances[f"{i+1}"] + distance_per_timestep * (segment_count+1)
                    distances.append(covered_distance)
                segment_count += 1

    # Create a DataFrame from the lists
    df = pd.DataFrame({
        "timestamp (in seconds)": timestamps,
        "bus_trip_no": bus_trip_nos,
        "status": statuses,
        "bus_stop_no": bus_stop_nos,
        "stop_id": stop_ids,
        "stop_name": stop_names,
        "latitude": latitudes,
        "longitude": longitudes,
        "distance": distances
    })

    return df

def json_to_feed(json_file_path: str, feed_output_path: str, polling_rate: int = 1) -> None:
    """
    Converts a JSON file containing bus trip data into a CSV feed with detailed trip information.

    This function reads bus trip data from a given JSON file and constructs a DataFrame with 
    detailed information about each trip, such as timestamps, trip numbers, bus stop numbers, 
    latitudes, longitudes, and distances. The DataFrame is then written to a CSV file at the 
    specified output path.

    Args:
        json_file_path (str): Path to the input JSON file containing bus trip data.
        feed_output_path (str): Path where the generated CSV feed should be saved.
        polling_rate (int, optional): The interval in seconds at which data points are to be sampled. 
            Defaults to 1.

    Outputs:
        CSV file: A file containing the detailed bus trip data with columns such as "timestamp (in seconds)", 
                  "bus_trip_no", "status", "bus_stop_no", "latitude", "longitude", and "distance".

    Notes:
        - The function uses `convert_json_to_dict` to parse the input JSON file.
        - Cumulative distances between stops are computed using the `calculate_haversine_distance` function.
        - Trip details are constructed using the `initialise_dataframe` function for each trip.
        - If the directory specified in the `feed_output_path` doesn't exist, it is created.
    """

    if not isinstance(polling_rate, int):
        raise TypeError("\nTypeError: Polling rate is not an integer! Please make it an integer.")
    
    data = convert_json_to_dict(json_file_path)
    polling_rate = polling_rate

    num_trips = data["num_trips"]
    num_stops = data["num_stops"]

    coordinates = {f"{i+1}": (data["coordinates_list"][i][0], data["coordinates_list"][i][1]) for i in range(num_stops)}

    cumulative_distances = {
        "1": 0
    }

    for i in range(2, num_stops+1):
        cumulative_distances[f"{i}"] = cumulative_distances[f"{i-1}"] + calculate_haversine_distance(coordinates[f"{i-1}"], coordinates[f"{i}"])


    dataframes_list = []
    for trip in range(1, num_trips+1):
        dataframes_list.append(initialise_dataframe(trip, data, coordinates, cumulative_distances, polling_rate))
        
    df = pd.concat(dataframes_list)
    df = df.sort_values(by=["timestamp (in seconds)"])
    df = df.reset_index(drop=True)

    directory_path = os.path.dirname(feed_output_path)

    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

    df.to_csv(feed_output_path, index=False)