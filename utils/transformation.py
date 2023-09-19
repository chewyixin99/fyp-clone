from utils.coordinates import calculate_haversine_distance, split_line_between_coordinates
import json
import pandas as pd

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
    data_dict = {}
    for k, v in dicts.items():
        data_dict[k] = v

    with open(output_file_path, "w") as f:
        json.dump(data_dict, f, indent=4)

def initialise_dataframe(current_trip, data, coordinates, cumulative_distances, polling_rate=1):

    POLLING_RATE = polling_rate

    # Initialize empty lists for each column
    timestamps = []
    bus_trip_nos = []
    statuses = []
    bus_stop_nos = []
    latitudes = []
    longitudes = []
    distances = []

    # dispatch from the bus depot
    timestamps.append(data["dispatch_list"][f"{current_trip}"])
    bus_trip_nos.append(current_trip)
    statuses.append("DISPATCHED_FROM")
    bus_stop_nos.append(1)
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
            latitudes.append(coordinates[f"{stop_no}"][0])
            longitudes.append(coordinates[f"{stop_no}"][1])
            distances.append(cumulative_distances[f"{stop_no}"])

    timestamp_list = timestamps
    for i in range(len(timestamp_list)-1): # timestamp_list[i] = every stop's timestamp
        dwell_count = POLLING_RATE

        num_intermediate_segments = timestamp_list[i+1] - timestamp_list[i]
        segments = split_line_between_coordinates(
            (coordinates[f"{i+1}"][0], coordinates[f"{i+1}"][1]),
            (coordinates[f"{i+2}"][0], coordinates[f"{i+2}"][1]),
            num_intermediate_segments
            )

        
        interstation_distance = cumulative_distances[f"{i+2}"] - cumulative_distances[f"{i+1}"]
        distance_per_timestep = interstation_distance / num_intermediate_segments

        segment_count = 0
        
        for intermediate_time in range(timestamp_list[i]+1, (timestamp_list[i+1]), POLLING_RATE): #intermediate_time = timestamp at intermediates
            if dwell_count <= data["dwell_matrix"][f"{current_trip},{i+1}"]:
                timestamps.append(intermediate_time)
                bus_trip_nos.append(current_trip)
                statuses.append("DWELL_AT")
                latitudes.append(coordinates[f"{i+1}"][0])
                longitudes.append(coordinates[f"{i+1}"][1])
                bus_stop_nos.append(i+1)
                distances.append(cumulative_distances[f"{i+1}"])
                dwell_count += POLLING_RATE

            else:
                timestamps.append(intermediate_time)
                bus_trip_nos.append(current_trip)
                statuses.append("TRANSIT_TO")
                latitudes.append(segments[segment_count][0])
                longitudes.append(segments[segment_count][1])
                bus_stop_nos.append(i+2)
                covered_distance = cumulative_distances[f"{i+1}"] + distance_per_timestep * (segment_count+1)
                distances.append(covered_distance)  # Placeholder for NaN
                segment_count += 1

    # Create a DataFrame from the lists
    df = pd.DataFrame({
        "timestamp (in seconds)": timestamps,
        "bus_trip_no": bus_trip_nos,
        "status": statuses,
        "bus_stop_no": bus_stop_nos,
        "latitude": latitudes,
        "longitude": longitudes,
        "distance": distances
    })

    return df

def json_to_feed(json_file_path, feed_output_path, polling_rate=1):
    data = convert_json_to_dict(json_file_path)
    polling_rate = polling_rate

    num_trips = data["num_trips"]
    num_stops = data["num_stops"]

    coordinates = {f"{i+1}": (data["coordinates_list"][i][0], data["coordinates_list"][i][1]) for i in range(num_trips)}

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

    df.to_csv(feed_output_path, index=False)