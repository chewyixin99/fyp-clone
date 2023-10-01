# v2.0 is the original Q-hat proposed by K.Gkiotsalitis et al, but modified Constraints 27 and 30
# and then changed Constraints 26 and 28 to make it max of boarding duration and alighting duration
# and then changed Constraints 29, 31, 32, 33 and added Equation 20 to add bus capacity constraints

# Constraints 6, 20, 27, 30 has been further revised to account for is_first_trip vs regular trips.

from docplex.mp.model import Model
from utils.transformation import convert_list_to_dict, convert_2dlist_to_dict
from typing import Dict, Any

def run_model(data: Dict[str, Any], silent: bool = False, is_first_trip: bool = False) -> None:
    """
    Solves a mathematical optimisation problem for bus dispatch scheduling.

    This function takes input data describing the bus dispatch problem and uses a modified Q-hat optimisation
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

    model = Model(name="bus_dispatch", log_output=not silent)

    num_trips = data["num_trips"]
    num_stops = data["num_stops"]
    boarding_duration = data["boarding_duration"]
    alighting_duration = data["alighting_duration"]
    max_allowed_deviation = data["max_allowed_deviation"]
    capacity = data["bus_capacity"]

    if is_first_trip:
        ift = 1
    else:
        ift = 0

    # Transformation to dictionaries to be referred to by the constraints
    original_dispatch = convert_list_to_dict(data["original_dispatch_list"], 1, num_trips)
    prev_arrival = convert_list_to_dict(data["prev_arrival_list"], 1, num_stops)
    prev_dwell = convert_list_to_dict(data["prev_dwell_list"], 1, num_stops-1)
    arrival_rate = convert_list_to_dict(data["arrival_rate_list"], 1, num_stops)
    alighting_percentage = convert_list_to_dict(data["alighting_percentage_list"], 2, num_stops)
    weights = convert_list_to_dict(data["weights_list"], 2, num_stops)
    bus_availability = convert_list_to_dict(data["bus_availability_list"], 1, num_trips)
    initial_passengers = convert_list_to_dict(data["initial_passengers_list"], 1, num_stops)
    target_headway = convert_2dlist_to_dict(data["target_headway_2dlist"], 1, num_trips, 2, num_stops)
    interstation_travel = convert_2dlist_to_dict(data["interstation_travel_2dlist"], 1, num_trips, 1, num_stops-1)


    # DECISION VARIABLES
    dispatch_offset = model.continuous_var_dict(range(1,num_trips+1), lb=-10000, ub=10000, name="dispatch_offset")
    headway = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="headway")
    arrival = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="arrival")
    dwell = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="dwell")
    willing_board = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="willing_board")
    busload = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="busload")
    stranded = model.continuous_var_matrix(range(1,num_trips+1), range(1,num_stops+1), name="stranded")
    f_x = model.continuous_var(name='f_x')
    slack = model.continuous_var(name="slack")

    # CONSTRAINTS
    # Equation 1, Constraint 6
    model.add_constraint(headway[1,2] ==
                            ((original_dispatch[1] + dispatch_offset[1])
                            + interstation_travel[(1,1)]
                            - prev_arrival[2]) * (1 - ift), "Eq1")

    # Equation 2, Constraint 6
    for s in range(3, num_stops+1):
        model.add_constraint(headway[1,s] ==
                            (headway[1,s-1]
                            + (dwell[1,s-1] + interstation_travel[(1,s-1)])
                            - (prev_arrival[s] - prev_arrival[s-1])) * (1 - ift), "Eq2")
        
    # Equation 3, Constraint 7
    for j in range(2, num_trips+1):
        model.add_constraint(headway[j,2] ==
                            ((original_dispatch[j] + dispatch_offset[j]) + interstation_travel[(j,1)])
                            - ((original_dispatch[j-1] + dispatch_offset[j-1]) + interstation_travel[(j-1,1)]), "Eq3")
        
        # Equation 4, Constraint 7
        for s in range(3, num_stops+1):
            model.add_constraint(headway[j,s] ==
                                headway[j,s-1]
                                + (dwell[j,s-1] + interstation_travel[j,s-1])
                                - (dwell[j-1,s-1] + interstation_travel[j-1,s-1]), "Eq4")

    # Equation 5, Constraint 20
    beta = 1 / (num_trips * sum(weights))
    model.add_constraint(f_x ==
                        beta * sum(weights[s] * sum((headway[j,s] - target_headway[(j,s)]) ** 2 for j in range(1+ift, num_trips))
                        for s in range(2, num_stops)), "Eq5")

    # Equation 6, Constraint 20
    model.add_constraint(beta > 0, "Eq6")

    # Equation 7, Constraint 23
    for j in range(1, num_trips+1):
        model.add_constraint(original_dispatch[j] + dispatch_offset[j] >= bus_availability[j], "Eq7")
        
    # Equation 8, Constraint 26
    for s in range(2, num_stops):
        model.add_constraint(dwell[1,s] ==
                            model.max(boarding_duration * willing_board[1,s],
                            alighting_duration * alighting_percentage[s] * busload[1,s]), "Eq8")
        
        # Equation 9, Constraint 27 modified according to Confluence v2.0
        model.add_constraint(willing_board[1,s] == initial_passengers[s]*ift
                            + ((1 + arrival_rate[s] * boarding_duration)
                            * arrival_rate[s]
                            * (headway[j,s] - prev_dwell[s]))*(1-ift), "Eq9")
        
    # Equation 10, Constraint 28
    for j in range(2, num_trips+1):
        for s in range(2, num_stops):
            model.add_constraint(dwell[j,s] ==
                                model.max(boarding_duration * willing_board[j,s],
                                alighting_duration * alighting_percentage[s] * busload[j,s]), "Eq10")
            
            # Equation 11, Constraint 29
            model.add_constraint(willing_board[j,s] ==
                        (1 + arrival_rate[s] * boarding_duration)
                        * (arrival_rate[s]
                        * (headway[j,s] - dwell[j-1,s])) + stranded[j,s], "Eq11")
                
    # Equation 12, Constraint 30 modified according to Confluence v2.0
    model.add_constraint(busload[1,2] == initial_passengers[1]*ift
                    + ((1 + arrival_rate[1] * boarding_duration)
                    * arrival_rate[1]
                    * (original_dispatch[1] + dispatch_offset[1] - prev_arrival[1] - prev_dwell[1]))*(1-ift), "Eq12")

    # Equation 13, Constraint 31
    for s in range(3, num_stops+1):
        model.add_constraint(busload[1,s] ==
                            model.min(
                            (busload[1,s-1]
                            + willing_board[1,s-1]
                            - alighting_percentage[s-1] * busload[1,s-1]), capacity), "Eq13")
        
    # Equation 14, Constraint 32
    for j in range(2, num_trips+1):
        model.add_constraint(busload[j,2] ==
                        model.min(
                        ((1 + arrival_rate[1] * boarding_duration)
                        * arrival_rate[1]
                        * (original_dispatch[j] + dispatch_offset[j] - original_dispatch[j-1] - dispatch_offset[j-1])), capacity), "Eq14")

    # Equation 15, Constraint 33
    for j in range(2, num_trips+1):
        for s in range(3, num_stops+1):
            model.add_constraint(busload[j,s] ==
                            model.min(
                            (busload[j,s-1]
                            + willing_board[j,s-1]
                            - alighting_percentage[s-1] * busload[j,s-1]), capacity), "Eq15")
            
    # Equation 16, Constraint 35 additional constraints to implement soft constraint:
    for j in range(1, num_trips+1):
        #essentially its a smooth way to do max(x[j] - max_allowed_deviation, 0)
        model.add_constraint(slack >= (dispatch_offset[j] - max_allowed_deviation), "Eq16")
    # Equation 17, Constraint 35
    model.add_constraint(slack >= 0, "Eq17")

    # Additional bookkeeping constraints to output arrival_matrix NOTE: TESTING
    # Equation 18
    for j in range(1, num_trips+1):
        model.add_constraint(arrival[j, 2] ==
                            original_dispatch[j]
                            + dispatch_offset[j]
                            + interstation_travel[j, 1], "Eq18")

    # Equation 19
    for j in range(1, num_trips+1):
        for s in range(3, num_stops+1):
            model.add_constraint(arrival[j,s] ==
                                arrival[j,s-1]
                                + dwell[j,s-1]
                                + interstation_travel[j,s-1], "Eq19")

    # Equation 20
    for j in range(2, num_trips+1):
        for s in range(3, num_stops+1):
            model.add_constraint(stranded[j,s] ==
                            model.max(
                            (busload[j,s]
                            + willing_board[j,s]
                            - alighting_percentage[s] * busload[j,s] - capacity), 0), "Eq20")

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
    if not silent:
        for j in range(1, num_trips+1):
                print(f"Trip {j}: Original dispatch timing = {original_dispatch[j]:.0f}\
                        Trip {j}: Dispatch offset = {dispatch_offset[j].solution_value:.0f}\
                        Time of Dispatch = {original_dispatch[j] + dispatch_offset[j].solution_value:.0f}")

        print("\nObjective Function Value:", model.objective_value)

    # for j in range(1, num_trips+1):
    #     for s in range(1, num_stops+1):
    #         print(f"Stranded people on trip {j} and stop {s}: {stranded[j, s].solution_value:.0f}")

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

    headway_dict = {}
    for j in range(1, num_trips+1):
        for s in range(2, num_stops+1):
            headway_dict[f"{j},{s}"] = round(headway[j,s].solution_value)

    stranded_dict = {}
    for j in range(1, num_trips+1):
        for s in range(1, num_stops+1):
            stranded_dict[f"{j},{s}"] = round(stranded[j,s].solution_value)

    dispatch_dict = {}
    for j in range(1, num_trips+1):
        dispatch_dict[f"{j}"] = round(original_dispatch[j] + dispatch_offset[j].solution_value)

    variables_to_return = {
        "dwell_dict": dwell_dict,
        "busload_dict": busload_dict,
        "arrival_dict": arrival_dict,
        "headway_dict": headway_dict,
        "stranded_dict": stranded_dict,
        "dispatch_dict": dispatch_dict,
        "objective_value": model.objective_value,
    }
            
    return variables_to_return