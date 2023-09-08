# v1.0 is the original Q-hat proposed by K.Gkiotsalitis et al.

from docplex.mp.model import Model
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

def run_model(data):
    """
    Solves a mathematical optimisation problem for bus dispatch scheduling.

    This function takes input data describing the bus dispatch problem and uses Q-hat optimisation
    model to find an optimal dispatch schedule. It utilises various constraints and decision variables
    to minimise a specified objective function.

    Args:
        data (dict): A dictionary containing input data for the optimisation problem. It should
            include the following keys:
            - "num_trips": Number of bus trips.
            - "num_stops": Number of bus stops.
            - "boarding_duration": Boarding duration at each stop.
            - "alighting_duration": Alighting duration at each stop.
            - "max_allowed_deviation": Maximum allowed deviation for dispatch offsets.
            - Other data lists and parameters needed for the optimisation problem.

    Returns:
        None

    Prints:
        - Solution details for dispatch offsets, times of dispatch, and objective function value.

    Output:
        - Writes the results (dwell times, busloads, arrival times) to a JSON file.

    Note:
        This function uses IBM Decision Optimization CPLEX solver to find the optimal solution
        to the bus dispatch scheduling problem.
    """

    model = Model(name="bus_dispatch")

    num_trips = data["num_trips"]
    num_stops = data["num_stops"]
    boarding_duration = data["boarding_duration"]
    alighting_duration = data["alighting_duration"]
    max_allowed_deviation = data["max_allowed_deviation"]

    # Transformation to dictionaries to be referred to by the constraints
    original_dispatch = convert_list_to_dict(data["original_dispatch_list"], 1, num_trips)
    prev_arrival = convert_list_to_dict(data["prev_arrival_list"], 1, num_stops) # MODIFIED keep for rolling horizons
    prev_dwell = convert_list_to_dict(data["prev_dwell_list"], 1, num_stops-1) # doesn't seem to be used
    arrival_rate = convert_list_to_dict(data["arrival_rate_list"], 1, num_stops)
    alighting_percentage = convert_list_to_dict(data["alighting_percentage_list"], 2, num_stops)
    weights = convert_list_to_dict(data["weights_list"], 2, num_stops)
    bus_availability = convert_list_to_dict(data["bus_availability_list"], 1, num_trips)
    initial_passengers = convert_list_to_dict(data["initial_passengers_list"], 1, num_stops)
    target_headway = convert_2dlist_to_dict(data["target_headway_2dlist"], 1, num_trips, 2, num_stops)
    interstation_travel = convert_2dlist_to_dict(data["interstation_travel_2dlist"], 1, num_trips, 1, num_stops-1)


    # DECISION VARIABLES
    dispatch_offset = model.continuous_var_dict(range(1,num_trips+1), name="dispatch_offset")
    headway = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="headway")
    arrival = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="arrival")
    dwell = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="dwell")
    willing_board = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="willing_board")
    busload = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="busload")
    slack = model.continuous_var(name="slack")

    # CONSTRAINTS
    # Equation 1, Constraint 6
    model.add_constraint(headway[1,2] ==
                        (original_dispatch[1] + dispatch_offset[1])
                        + interstation_travel[(1,1)]
                        - prev_arrival[2])

    # Equation 2, Constraint 6
    for s in range(3, num_stops+1):
        model.add_constraint(headway[1,s] ==
                            headway[1,s-1]
                            + (dwell[1,s-1] + interstation_travel[(1,s-1)])
                            - (prev_arrival[s] - prev_arrival[s-1]))
        
    # Equation 3, Constraint 7
    for j in range(2, num_trips+1):
        model.add_constraint(headway[j,2] ==
                            ((original_dispatch[j] + dispatch_offset[j]) + interstation_travel[(j,1)])
                            - ((original_dispatch[j-1] + dispatch_offset[j-1]) + interstation_travel[(j-1,1)]))
        
        # Equation 4, Constraint 7
        for s in range(3, num_stops+1):
            model.add_constraint(headway[j,s] ==
                                headway[j,s-1]
                                + (dwell[j,s-1] + interstation_travel[j,s-1])
                                - (dwell[j-1,s-1] + interstation_travel[j-1,s-1]))

    # Equation 5, Constraint 20
    beta = 1 / (num_trips * sum(weights))
    f_x = beta * sum(weights[s] * sum((headway[j,s] - target_headway[(j,s)]) ** 2 for j in range(1, num_trips))
                        for s in range(2, num_stops))
    # Equation 6, Constraint 20
    model.add_constraint(beta > 0)

    # Equation 7, Constraint 23
    for j in range(1, num_trips+1):
        model.add_constraint(original_dispatch[j] + dispatch_offset[j] >= bus_availability[j])
        
    # Equation 8, Constraint 26
    for s in range(2, num_stops):
        model.add_constraint(dwell[1,s] ==
                            boarding_duration * willing_board[1,s]
                            + alighting_duration * alighting_percentage[s] * busload[1,s])
        
    # Equation 9, Constraint 27
        model.add_constraint(willing_board[1,s] ==
                            (1 + arrival_rate[s] * boarding_duration)
                            * arrival_rate[s]
                            * (headway[j,s] - prev_dwell[s]))
        
    # Equation 10, Constraint 28
        for j in range(2, num_trips+1):
            for s in range(2, num_stops):
                model.add_constraint(dwell[j,s] ==
                                    boarding_duration * willing_board[j,s]
                                    + alighting_duration * alighting_percentage[s] * busload[j,s])
                
                # Equation 11, Constraint 29
                model.add_constraint(willing_board[j,s] ==
                            (1 + arrival_rate[s] * boarding_duration)
                            * arrival_rate[s]
                            * (headway[j,s] - dwell[j-1,s]))
                
    # Equation 12, Constraint 30
    model.add_constraint(busload[1,2] ==
                        (1 + arrival_rate[1] * boarding_duration)
                        * arrival_rate[1]
                        * (original_dispatch[1] + dispatch_offset[1] - prev_arrival[1] - prev_dwell[1]))

    # Equation 13, Constraint 31
    for s in range(3, num_stops+1):
        model.add_constraint(busload[1,s] ==
                            busload[1,s-1]
                            + willing_board[1,s-1]
                            - alighting_percentage[s-1] * busload[1,s-1])
        
    # Equation 14, Constraint 32
    for j in range(2, num_trips+1):
        model.add_constraint(busload[j,2] ==
                        (1 + arrival_rate[1] * boarding_duration)
                        * arrival_rate[1]
                        * (original_dispatch[j] + dispatch_offset[j] - original_dispatch[j-1] - dispatch_offset[j-1]))

    # Equation 15, Constraint 33
    for j in range(2, num_trips+1):
        for s in range(3, num_stops+1):
            model.add_constraint(busload[j,s] ==
                            busload[j,s-1]
                            + willing_board[j,s-1]
                            - alighting_percentage[s-1] * busload[j,s-1])
            
    # Equation 16, Constraint 35 additional constraints to implement soft constraint:
    for j in range(1, num_trips+1):
        #essentially its a smooth way to do max(x[j] - max_allowed_deviation, 0)
        model.add_constraint(slack >= (dispatch_offset[j] - max_allowed_deviation))
    # Equation 17, Constraint 35
    model.add_constraint(slack >= 0)

    # Additional bookkeeping constraints to output arrival_matrix NOTE: TESTING
    # Equation 18
    for j in range(1, num_trips+1):
        model.add_constraint(arrival[j, 2] ==
                            original_dispatch[j]
                            + dispatch_offset[j]
                            + interstation_travel[j, 1])

    # Equation 19
    for j in range(1, num_trips+1):
        for s in range(3, num_stops+1):
            model.add_constraint(arrival[j,s] ==
                                arrival[j,s-1]
                                + dwell[j,s-1]
                                + interstation_travel[j,s-1])

    # model.add_constraint(dispatch_offset[3] == -1) # TODO look into why no negatives


    # for j in range(1, num_trips+1): # to observe if dispatch optimisation was not used
    #     model.add_constraint(dispatch_offset[j] == 0)

    # OBJECTIVE FUNCTION
    objective_function = f_x + 1000 * slack # soft constraint using bigM = 1000 in case of infeasibility
    # objective_function = sum(dispatch_offset) # to find smallest dispatch_offsets
    model.minimize(objective_function)

    # Solve the model
    model.solve()

    # Output the results
    for j in range(1, num_trips+1):
            print(f"Trip {j}: Original dispatch timing = {original_dispatch[j]:.0f}\
                    Trip {j}: Dispatch offset = {dispatch_offset[j].solution_value:.0f}\
                    Time of Dispatch = {original_dispatch[j] + dispatch_offset[j].solution_value:.0f}")

    print("\nObjective Function Value:", model.objective_value)

    # OUTPUTS NOTE: to refactor once finalised

    dwell_dict = {}
    for j in range(1, num_trips+1):
        for s in range(1, num_stops+1):
            dwell_dict[f"{j},{s}"] = round(dwell[j,s].solution_value)

    busload_dict = {}
    for j in range(1, num_trips+1):
        for s in range(1, num_stops+1):
            busload_dict[f"{j},{s}"] = round(busload[j,s].solution_value)

    arrival_dict = {}
    for j in range(1, num_trips+1):
        for s in range(2, num_stops+1):
            arrival_dict[f"{j},{s}"] = round(arrival[j,s].solution_value)

    write_data_to_json(
        "../outputs/v1.0_output.json",
        dwell_matrix=dwell_dict,
        busload_matrix=busload_dict,
        arrival_matrix=arrival_dict
        )

if __name__ == "__main__":
    data = convert_json_to_dict("../inputs/mock_input.json")
    try:
        run_model(data)
    except Exception as e:
        print(e)