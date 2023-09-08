# gives us globally optimal solution with simplified assumptions, TODO: will refactor and explore rolling horizons

from docplex.mp.model import Model
import json

# PARAMETERS
num_trips = 5 # |N|
num_stops = 5 # |S|
original_dispatch_list = [600, 1200, 1800, 2400, 3000] #j \in {1, .., |N|}
prev_arrival_list = [100, 200, 400, 700, 900] # j = 0, s \in {2, .. , |S|} # MODIFIED keep for rolling horizons
prev_dwell_list = [100, 100, 100, 100] #j = 0, s \in {1, .., |S|-1}
arrival_rate_list = [0.03, 0.03, 0.1, 0.03, 0.03]
alighting_percentage_list = [0.1, 0.5, 0.2, 0.3] # s \in {2, .. |S|}
boarding_duration = 2
alighting_duration = 2
weights_list = [0.1, 0.2, 0.3, 0.4]
bus_availability_list = [500, 1500, 2500, 3500, 4500]
bus_availability_list = [0,0,0,0,0]
initial_passengers_list = [5, 5, 10, 11, 12]
max_allowed_deviation = 300
target_headway_lists = [ # j \in {1, .. , |N|} s \in {2, .., |S|}
    [100, 200, 200, 100],
    [100, 200, 200, 100],
    [100, 200, 200, 100],
    [100, 200, 200, 100],
    [100, 200, 200, 100]
]
interstation_travel_lists = [ # j \in {1, .. , |N|} s \in {1, .., |S|-1}
    [100, 200, 300, 400],
    [100, 200, 300, 400],
    [100, 200, 300, 400],
    [100, 200, 300, 400],
    [100, 200, 300, 400]
]

def run_model():

    model = Model(name="bus_dispatch")

    # Transformation to dictionaries to be referred to by the constraints
    original_dispatch = {j: original_dispatch_list[j-1] for j in range(1, num_trips+1)}
    prev_arrival = {s: prev_arrival_list[s-1] for s in range(1, num_stops+1)} # MODIFIED keep for rolling horizons
    prev_dwell = {s: prev_dwell_list[s-1] for s in range(1, num_stops)} # doesn't seem to be used
    arrival_rate = {s: arrival_rate_list[s-1] for s in range(1, num_stops+1)}
    alighting_percentage = {s: alighting_percentage_list[s-2] for s in range(2, num_stops+1)}
    weights = {s: weights_list[s-2] for s in range(2, num_stops+1)}
    bus_availability = {j: bus_availability_list[j-1] for j in range(1, num_trips+1)}
    initial_passengers = {s: initial_passengers_list[s-1] for s in range(1, num_stops+1)}
    target_headway = {(j,s): target_headway_lists[j-1][s-2] for j in range(1, num_trips+1) for s in range(2, num_stops+1)}
    interstation_travel = {(j,s): interstation_travel_lists[j-1][s-1] for j in range(1, num_trips+1) for s in range(1, num_stops)}


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
        
    # Equation 9, Constraint 27 modified according to Confluence v1.1
        model.add_constraint(willing_board[1,s] == initial_passengers[s])
        
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
                
    # Equation 12, Constraint 30 modified according to Confluence v1.1
    model.add_constraint(busload[1,2] == initial_passengers[1])

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

    data_dict = {}

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

    # print(arrival_dict)

    data_dict["dwell_matrix"] = dwell_dict
    data_dict["busload_matrix"] = busload_dict
    data_dict["arrival_matrix"] = arrival_dict

    with open("../outputs/output.json", "w") as f:
        json.dump(data_dict, f, indent=4)

    
    

if __name__ == "__main__":
    try:
        run_model()
    except Exception as e:
        print(e)