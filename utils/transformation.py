import json

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