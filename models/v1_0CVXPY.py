import cvxpy as cp
import numpy as np
from utils.transformation import convert_list_to_dict, convert_2dlist_to_dict
from typing import Dict, Any

from exceptions.invalid_input import InvalidInput

def run_model(data: Dict[str, Any], silent: bool = False, deviated_dispatch_dict: Dict[str, Any] = None, unoptimised: bool = False, retry: bool = True) -> Dict[str, Any]:
    """
    Solves a mathematical optimisation problem for bus dispatch scheduling using the Q-hat model from K.Gkiotsalitis et al. (2020).

    This function implements the Q-hat optimisation model for bus dispatch scheduling, considering various constraints 
    like bus availability, boarding/alighting times, and desired headways between buses. It aims to minimise a specified 
    objective function related to dispatch timing deviations and passenger service levels.

    Args:
        data (dict): Input data for the optimisation problem, containing key-value pairs such as:
            - "num_trips" (int): Number of bus trips.
            - "num_stops" (int): Number of bus stops.
            - "boarding_duration" (float): Duration for boarding at each stop.
            - "alighting_duration" (float): Duration for alighting at each stop.
            - "max_allowed_deviation" (float): Maximum allowed deviation for dispatch offsets.
            - Additional lists and parameters needed for the optimisation model.

        silent (bool, optional): If True, suppresses the output print statements. Defaults to False.

        deviated_dispatch_dict (dict, optional): Dictionary specifying any deviations in dispatch times. Defaults to None.

        unoptimised (bool, optional): If True, model focuses only on minimising dispatch offsets but still prevent overtaking. 
                                      Defaults to False.

    Returns:
        Dict[str, Any]: A dictionary with optimisation results including dwell times, bus loads, arrival times, and dispatch 
                        times keyed by trip and stop identifiers.

    Note:
        The function employs CVXPY for modelling the optimisation problem and uses a solver (i.e., OSQP) to find the optimal 
        schedule. The results, including the optimised dispatch offsets and related timings, are printed (if not silent) and 
        returned as a dictionary.

        If the problem is unfeasible with the initial settings, the solver's tolerance for optimality accuracy is relaxed and 
        the model is solved again.

        If 'deviated_dispatch_dict' is provided, the function considers these deviations in the optimisation problem.
    """

    # Initialisation of variables from input
    num_trips = data["num_trips"]
    num_stops = data["num_stops"]
    boarding_duration = data["boarding_duration"]
    alighting_duration = data["alighting_duration"]
    max_allowed_deviation = data["max_allowed_deviation"]
    penalty_coefficient = data["penalty_coefficient"]

    # Transformation to dictionaries to be referred to by the constraints
    original_dispatch = convert_list_to_dict(data["original_dispatch_list"], 1, num_trips)
    prev_arrival = convert_list_to_dict(data["prev_arrival_list"], 1, num_stops)
    prev_dwell = convert_list_to_dict(data["prev_dwell_list"], 1, num_stops-1)
    arrival_rate = convert_list_to_dict(data["arrival_rate_list"], 1, num_stops)
    alighting_percentage = convert_list_to_dict(data["alighting_percentage_list"], 2, num_stops)
    weights = convert_list_to_dict(data["weights_list"], 2, num_stops)
    bus_availability = convert_list_to_dict(data["bus_availability_list"], 1, num_trips)
    target_headway = convert_2dlist_to_dict(data["target_headway_2dlist"], 1, num_trips, 2, num_stops)
    interstation_travel = convert_2dlist_to_dict(data["interstation_travel_2dlist"], 1, num_trips, 1, num_stops-1)


    # DECISION VARIABLES
    dispatch_offset = {i: cp.Variable(nonneg=False) for i in range(1, num_trips+1)}
    headway = {(i,j): cp.Variable(nonneg=True) for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    arrival = {(i,j): cp.Variable() for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    dwell = {(i,j): cp.Variable(nonneg=True) for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    willing_board = {(i,j): cp.Variable() for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    busload = {(i,j): cp.Variable() for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    stranded = {(i,j): cp.Variable() for i in range(1, num_trips+1) for j in range(1, num_stops+1)}
    slack = cp.Variable(nonneg=True)   

    # CONSTRAINTS
    constraints = []

    # Equation 1, Constraint 6
    constraints.append(headway[1,2] ==
                        (original_dispatch[1] + dispatch_offset[1])
                        + interstation_travel[(1,1)]
                        - prev_arrival[2])

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
    f_x = beta * sum(weights[s] * sum((headway[j,s] - target_headway[(j,s)]) ** 2 for j in range(1, num_trips+1))
                    for s in range(2, num_stops+1))

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
                            * (headway[1,s] - prev_dwell[s]))

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

    # Equation 16a, Constraint 35 additional constraints to implement soft constraint:
    # essentially a smooth way to do max(abs(x[j]) - max_allowed_deviation, 0)
    constraints.append(slack >= (dispatch_offset[num_trips] - max_allowed_deviation))

    # Equation 16b, Constraint 35 additional constraints to implement soft constraint:
    constraints.append(slack >= (-dispatch_offset[num_trips] - max_allowed_deviation))

    # Equation 17, Constraint 35
    constraints.append(slack >= 0)

    # Additional bookkeeping constraints to output arrival_matrix
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

    # Evaluate deviated dispatches
    if deviated_dispatch_dict != None:
        for key in deviated_dispatch_dict:
            constraints.append(original_dispatch[int(key)] + dispatch_offset[int(key)] ==
                                deviated_dispatch_dict[key])

    # OBJECTIVE FUNCTION
    # For every second of deviation more than max_allowed_deviation, penalty_coefficient is 10000 (can be changed in the JSON)
    objective_function = f_x + penalty_coefficient * slack

    if unoptimised:
        value = 0
        for j in range(1, num_trips+1):
            value += cp.abs(dispatch_offset[j])
        objective_function = value

    model = cp.Problem(cp.Minimize(objective_function), constraints)

    # Solve the model, if unfeasible, relax tolerance of optimality accuracy
    try:
        result = model.solve(solver=cp.OSQP, verbose=not silent, eps_rel=0.00001)
    except:
        if retry:
            print(f"Model has failed, re-running with a higher tolerance for inaccuracy")
            result = model.solve(solver=cp.OSQP, verbose=not silent, eps_rel=0.0001)

    if result is None or result == float("inf") or result == float("-inf"):
        raise InvalidInput

    # Output the results
    if not silent:
        for j in range(1, num_trips+1):
                print(f"Trip {j:3}: Original dispatch timing = {original_dispatch[j]:>6.0f}\
                        Trip {j:3}: Dispatch offset = {dispatch_offset[j].value:>6.0f}\
                        Time of Dispatch = {original_dispatch[j] + dispatch_offset[j].value:>6.0f}")

        if not unoptimised:
            print("\nObjective Function Value:", result)

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

    obj_fn_dict = {}
    for j in range(1, num_trips+1):
        for s in range(2, num_stops+1):
            obj_fn_dict[f"{j},{s}"] = weights[s] * beta * \
                                            (headway[j,s].value - target_headway[(j,s)]) ** 2 \
                                            if headway[j,s].value != None else 0

    stranded_dict = {}
    for j in range(1, num_trips+1):
        for s in range(1, num_stops+1):
            stranded_dict[f"{j},{s}"] = round(np.round(stranded[j,s].value)) if stranded[j,s].value != None else 0

    dispatch_dict = {}
    for j in range(1, num_trips+1):
        dispatch_dict[f"{j}"] = round(np.round(original_dispatch[j] + dispatch_offset[j].value)) if dispatch_offset[j].value != None else 0

    # Calculate Scheduled Waiting Time
    swt = sum(target_headway.values())/len(target_headway)/2

    # Calculate Actual Waiting Time
    total_awt = []
    for s in range(2, num_stops):
        total_wait_time = 0
        total_passengers = 0

        for j in range(1, num_trips+1):
            num_passengers = headway_dict[f"{j},{s}"] * arrival_rate[s]
            average_wait_time = headway_dict[f"{j},{s}"]/2
            total_passengers += num_passengers
            total_wait_time += num_passengers * average_wait_time
        
        awt_for_stop = total_wait_time / total_passengers
        total_awt.append(awt_for_stop)
    awt = sum(total_awt)/len(total_awt)

    slack_penalty = slack.value * penalty_coefficient

    if not silent:
        if unoptimised:
            print(f"Objective Function Value: {sum(obj_fn_dict.values())}")
        print(f"Scheduled waiting time: {swt:.0f}")
        print(f"Actual waiting time: {awt:.0f}")
        print(f"Excess waiting time: {awt-swt:.0f}")

    variables_to_return = {
        "dwell_dict": dwell_dict,
        "busload_dict": busload_dict,
        "arrival_dict": arrival_dict,
        "headway_dict": headway_dict,
        "obj_fn_dict": obj_fn_dict,
        "stranded_dict": stranded_dict,
        "dispatch_dict": dispatch_dict,
        "objective_value": sum(obj_fn_dict.values()) if unoptimised else result, # assumes unoptimised cannot incur slack penalty
        "slack_penalty": 0 if unoptimised else slack_penalty, # assumes unoptimised cannot incur slack penalty
        "ewt_value": awt - swt
    }

    return variables_to_return