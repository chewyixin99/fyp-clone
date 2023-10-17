# v1.0 is the original Q-hat proposed by K.Gkiotsalitis et al.

import cvxpy as cp
import numpy as np
from utils.transformation import convert_list_to_dict, convert_2dlist_to_dict
from typing import Dict, Any

def run_model(data: Dict[str, Any], silent: bool = False, glued_dispatch_dict: Dict[str, Any] = None) -> None:
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
        - Writes the results (dwell times, busloads, arrival times, dwell times, dispatch times) to a JSON file.

    Note:
        This function uses IBM Decision Optimization CPLEX solver to find the optimal solution
        to the bus dispatch scheduling problem.
    """

    # model = Model(name="bus_dispatch", log_output=not silent)

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
    dispatch_offset = {i: cp.Variable(nonneg=False) for i in range(1, num_trips+1)}
    headway = {(i,j): cp.Variable(nonneg=True) for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    arrival = {(i,j): cp.Variable(nonneg=True) for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    dwell = {(i,j): cp.Variable() for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    willing_board = {(i,j): cp.Variable() for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    busload = {(i,j): cp.Variable() for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    stranded = {(i,j): cp.Variable(nonneg=True) for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    slack = cp.Variable()   

    # CONSTRAINTS
    constraints = []

    # Equation 1, Constraint 6
    constraints.append(headway[1,2] == (original_dispatch[1] + dispatch_offset[1]) + interstation_travel[(1,1)] - prev_arrival[2])

    # Equation 2, Constraint 6
    for s in range(3, num_stops+1):
        constraints.append(headway[1,s] ==
                            headway[1,s-1]
                            + (dwell[1,s-1] + interstation_travel[(1,s-1)])
                            - (prev_arrival[s] - prev_arrival[s-1]))

    # Equation 3, Constraint 7
    for j in range(2, num_trips+1):
        constraints.append(headway[j,2] ==
                            ((original_dispatch[j] + dispatch_offset[j]) + interstation_travel[(j,1)])
                            - ((original_dispatch[j-1] + dispatch_offset[j-1]) + interstation_travel[(j-1,1)]))

    # Equation 4, Constraint 7
    for j in range(2, num_trips+1):
        for s in range(3, num_stops+1):
            constraints.append(headway[j,s] ==
                                headway[j,s-1]
                                + (dwell[j,s-1] + interstation_travel[j,s-1])
                                - (dwell[j-1,s-1] + interstation_travel[j-1,s-1]))

    # Equation 5, Constraint 20
    beta = 1 / (num_trips * sum(weights))
    f_x = beta * sum(weights[s] * sum((headway[j,s] - target_headway[(j,s)]) ** 2 for j in range(1, num_trips))
                    for s in range(2, num_stops))

    # Equation 6, Constraint 20
    constraints.append(beta > 0)

    # Equation 7, Constraint 23
    for j in range(1, num_trips+1):
        constraints.append(original_dispatch[j] + dispatch_offset[j] >= bus_availability[j])

    # Equation 8, Constraint 26
    for s in range(2, num_stops):
        constraints.append(dwell[1,s] ==
                            boarding_duration * willing_board[1,s]
                            + alighting_duration * alighting_percentage[s] * busload[1,s])

    # Equation 9, Constraint 27
    for s in range(2, num_stops):
        constraints.append(willing_board[1,s] ==
                            (1 + arrival_rate[s] * boarding_duration)
                            * arrival_rate[s]
                            * (headway[1,s] - prev_dwell[s]) + prev_arrival[s])

    # Equation 10, Constraint 28
    for j in range(2, num_trips+1):
        for s in range(2, num_stops):
            constraints.append(dwell[j,s] ==
                                boarding_duration * willing_board[j,s]
                                + alighting_duration * alighting_percentage[s] * busload[j,s])

    # Equation 11, Constraint 29
    for j in range(2, num_trips+1):
        for s in range(2, num_stops):
            constraints.append(willing_board[j,s] ==
                        (1 + arrival_rate[s] * boarding_duration)
                        * arrival_rate[s]
                        * (headway[j,s] - dwell[j-1,s]))

    # Equation 12, Constraint 30
    constraints.append(busload[1,2] ==
                        (1 + arrival_rate[1] * boarding_duration)
                        * arrival_rate[1]
                        * (original_dispatch[1] + dispatch_offset[1] - prev_arrival[1] - prev_dwell[1]))

    # Equation 13, Constraint 31
    for s in range(3, num_stops+1):
        constraints.append(busload[1,s] ==
                            busload[1,s-1]
                            + willing_board[1,s-1]
                            - alighting_percentage[s-1] * busload[1,s-1])

    # Equation 14, Constraint 32
    for j in range(2, num_trips+1):
        constraints.append(busload[j,2] ==
                        (1 + arrival_rate[1] * boarding_duration)
                        * arrival_rate[1]
                        * (original_dispatch[j] + dispatch_offset[j] - original_dispatch[j-1] - dispatch_offset[j-1]))

    # Equation 15, Constraint 33
    for j in range(2, num_trips+1):
        for s in range(3, num_stops+1):
            constraints.append(busload[j,s] ==
                            busload[j,s-1]
                            + willing_board[j,s-1]
                            - alighting_percentage[s-1] * busload[j,s-1])

    # Equation 16, Constraint 35 additional constraints to implement soft constraint:
    for j in range(1, num_trips+1):
        #essentially its a smooth way to do max(x[j] - max_allowed_deviation, 0)
        constraints.append(slack >= (dispatch_offset[j] - max_allowed_deviation))
    # Equation 17, Constraint 35
    constraints.append(slack >= 0)

    # Additional bookkeeping constraints to output arrival_matrix NOTE: TESTING
    # Equation 18
    for j in range(1, num_trips+1):
        constraints.append(arrival[j, 2] ==
                            original_dispatch[j]
                            + dispatch_offset[j]
                            + interstation_travel[j, 1])

    # Equation 19
    for j in range(1, num_trips+1):
        for s in range(3, num_stops+1):
            constraints.append(arrival[j,s] ==
                                arrival[j,s-1]
                                + dwell[j,s-1]
                                + interstation_travel[j,s-1])

    # to evaluate rolled horizons
    if glued_dispatch_dict != None:
        for j in range(1, num_trips+1):
            constraints.append(original_dispatch[j] + dispatch_offset[j] ==
                                glued_dispatch_dict[f"{j}"])

    # OBJECTIVE FUNCTION
    beta = 1 / (num_trips * sum(weights))
    f_x = beta * sum(weights[s] * sum((headway[j,s] - target_headway[(j,s)]) ** 2 for j in range(1, num_trips))
                    for s in range(2, num_stops))
    objective_function = f_x + 1000 * slack

    model = cp.Problem(cp.Minimize(objective_function), constraints)

    # Solve the model
    result = model.solve(verbose=True)

    # Output the results
    if not silent:
        for j in range(1, num_trips+1):
                print(f"Trip {j}: Original dispatch timing = {original_dispatch[j]:.0f}\
                        Trip {j}: Dispatch offset = {dispatch_offset[j].value:.0f}\
                        Time of Dispatch = {original_dispatch[j] + dispatch_offset[j].value:.0f}")

        print("\nObjective Function Value:", result)

    # OUTPUTS NOTE: to refactor once finalised

    dwell_dict = {}
    for j in range(1, num_trips+1):
        for s in range(1, num_stops+1):
            dwell_dict[f"{j},{s}"] = round(np.round(dwell[j,s].value)) if dwell[j,s].value != None else 0

    busload_dict = {}
    for j in range(1, num_trips+1):
        for s in range(1, num_stops+1):
            busload_dict[f"{j},{s}"] = round(np.round(busload[j,s].value)) if busload[j,s].value != None else 0

    arrival_dict = {}
    for j in range(1, num_trips+1):
        for s in range(2, num_stops+1):
            arrival_dict[f"{j},{s}"] = round(np.round(arrival[j,s].value)) if arrival[j,s].value != None else 0

    headway_dict = {}
    for j in range(1, num_trips+1):
        for s in range(2, num_stops+1):
            headway_dict[f"{j},{s}"] = round(np.round(headway[j,s].value)) if headway[j,s].value != None else 0

    stranded_dict = {}
    for j in range(1, num_trips+1):
        for s in range(1, num_stops+1):
            stranded_dict[f"{j},{s}"] = round(np.round(stranded[j,s].value)) if stranded[j,s].value != None else 0

    dispatch_dict = {}
    for j in range(1, num_trips+1):
        dispatch_dict[f"{j}"] = round(np.round(original_dispatch[j] + dispatch_offset[j].value)) if dispatch_offset[j].value != None else 0

    variables_to_return = {
        "dwell_dict": dwell_dict,
        "busload_dict": busload_dict,
        "arrival_dict": arrival_dict,
        "headway_dict": headway_dict,
        "stranded_dict": stranded_dict,
        "dispatch_dict": dispatch_dict,
        "objective_value": result,
    }
            
    return variables_to_return