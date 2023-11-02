import json

def validate_data(data):
    try:
        # Check if required keys exist in the dictionary
        required_keys = [
            'num_trips',
            'num_stops',
            'original_dispatch_list',
            'coordinates_list',
            'stop_ids_list',
            'stop_names_list',
            'prev_arrival_list',
            'prev_dwell_list',
            'arrival_rate_list',
            'alighting_percentage_list',
            'boarding_duration',
            'alighting_duration',
            'weights_list',
            'bus_availability_list',
            'max_allowed_deviation',
            'target_headway_2dlist',
            'interstation_travel_2dlist']
        for key in required_keys:
            if key not in data:
                return False, f"Key '{key}' is missing from the data."

        # Check data types
        # num_trips
        if not isinstance(data['num_trips'], int):
            return False, "'num_trips' should be an integer."

        # num_stops
        if not isinstance(data['num_stops'], int):
            return False, "'num_stops' should be an integer."

        # original_dispatch_list
        if not isinstance(data['original_dispatch_list'], list):
            return False, "'original_dispatch_list' should be a list."

        if not all(isinstance(item, int) for item in data['original_dispatch_list']):
            return False, "'original_dispatch_list' should contain only integers."

        if len(data['original_dispatch_list']) != data['num_trips']:
            return False, f"'original_dispatch_list' should have {data['num_trips']} elements."

        # coordinates_list
        if not isinstance(data['coordinates_list'], list):
            return False, "'coordinates_list' should be a list."

        if len(data['coordinates_list']) != data['num_stops']:
            return False, f"'coordinates_list' should have {data['num_stops']} lists."

        for sublist in data['coordinates_list']:
            if not isinstance(sublist, list):
                return False, "Each element in 'coordinates_list' should be a list."
            if len(sublist) != 2:
                return False, f"Each list in 'coordinates_list' should have 2 elements."
            if not all(isinstance(item, float) for item in sublist):
                return False, "Each element in the sublists of 'coordinates_list' should be a float."

        # stop_ids_list
        if not isinstance(data['stop_ids_list'], list):
            return False, "'stop_ids_list' should be a list."

        if not all(isinstance(item, str) for item in data['stop_ids_list']):
            return False, "'stop_ids_list' should contain only strings."

        if len(data['stop_ids_list']) != data['num_stops']:
            return False, f"'stop_ids_list' should have {data['num_stops']} elements."

        # stop_names_list
        if not isinstance(data['stop_names_list'], list):
            return False, "'stop_names_list' should be a list."

        if not all(isinstance(item, str) for item in data['stop_names_list']):
            return False, "'stop_names_list' should contain only strings."

        if len(data['stop_names_list']) != data['num_stops']:
            return False, f"'stop_names_list' should have {data['num_stops']} elements."

        # prev_arrival_list
        if not isinstance(data['prev_arrival_list'], list):
            return False, "'prev_arrival_list' should be a list."

        if not all(isinstance(item, int) for item in data['prev_arrival_list']):
            return False, "'prev_arrival_list' should contain only integers."

        if len(data['prev_arrival_list']) != data['num_stops']:
            return False, f"'prev_arrival_list' should have {data['num_stops']} elements."

        # prev_dwell_list
        if not isinstance(data['prev_dwell_list'], list):
            return False, "'prev_dwell_list' should be a list."

        if not all(isinstance(item, int) for item in data['prev_dwell_list']):
            return False, "'prev_dwell_list' should contain only integers."

        if len(data['prev_dwell_list']) != data['num_stops'] - 1:
            return False, f"'prev_dwell_list' should have {data['num_stops'] - 1} elements."

        # arrival_rate_list
        if not isinstance(data['arrival_rate_list'], list):
            return False, "'arrival_rate_list' should be a list."

        if not all(isinstance(item, (int, float)) for item in data['arrival_rate_list']):
            return False, "'arrival_rate_list' should contain only integers or floats."

        if len(data['arrival_rate_list']) != data['num_stops']:
            return False, f"'arrival_rate_list' should have {data['num_stops']} elements."

        # alighting_percentage_list
        if not isinstance(data['alighting_percentage_list'], list):
            return False, "'alighting_percentage_list' should be a list."

        if not all(isinstance(item, (int, float)) for item in data['alighting_percentage_list']):
            return False, "'alighting_percentage_list' should contain only integers or floats."

        if len(data['alighting_percentage_list']) != data['num_stops'] - 1:
            return False, f"'alighting_percentage_list' should have {data['num_stops'] - 1} elements."

        # boarding_duration
        if not isinstance(data['boarding_duration'], int):
            return False, "'boarding_duration' should be an integer."

        #alighting_duration
        if not isinstance(data['alighting_duration'], int):
            return False, "'alighting_duration' should be an integer."

        #weights_list
        if not isinstance(data['weights_list'], list):
            return False, "'weights_list' should be a list."

        if not all(isinstance(item, (int, float)) for item in data['weights_list']):
            return False, "'weights_list' should contain only integers or floats."

        if len(data['weights_list']) != data['num_stops']:
            return False, f"'weights_list' should have {data['num_stops']} elements."

        # bus_availability_list
        if not isinstance(data['bus_availability_list'], list):
            return False, "'bus_availability_list' should be a list."

        if not all(isinstance(item, int) for item in data['bus_availability_list']):
            return False, "'bus_availability_list' should contain only integers."

        if len(data['bus_availability_list']) != data['num_trips']:
            return False, f"'bus_availability_list' should have {data['num_trips']} elements."

        # max_allowed_deviation
        if not isinstance(data['max_allowed_deviation'], int):
            return False, "'max_allowed_deviation' should be an integer."

        #target_headway_2dlist
        if not isinstance(data['target_headway_2dlist'], list):
            return False, "'target_headway_2dlist' should be a list."

        if len(data['target_headway_2dlist']) != data['num_trips']:
            return False, f"'target_headway_2dlist' should have {data['num_trips']} lists."

        for sublist in data['target_headway_2dlist']:
            if not isinstance(sublist, list):
                return False, "Each element in 'target_headway_2dlist' should be a list."
            if len(sublist) != data['num_stops']:
                return False, f"Each list in 'target_headway_2dlist' should have {data['num_stops']} elements."
            if not all(isinstance(item, int) for item in sublist):
                return False, "Each element in the sublists of 'target_headway_2dlist' should be an integer."

        # interstation_travel_2dlist
        if not isinstance(data['interstation_travel_2dlist'], list):
            return False, "'interstation_travel_2dlist' should be a list."

        if len(data['interstation_travel_2dlist']) != data['num_trips']:
            return False, f"'interstation_travel_2dlist' should have {data['num_trips']} lists."

        for sublist in data['interstation_travel_2dlist']:
            if not isinstance(sublist, list):
                return False, "Each element in 'interstation_travel_2dlist' should be a list."
            if len(sublist) != data['num_stops'] - 1:
                return False, f"Each list in 'interstation_travel_2dlist' should have {data['num_stops'] - 1} elements."
            if not all(isinstance(item, int) for item in sublist):
                return False, "Each element in the sublists of 'interstation_travel_2dlist' should be an integer."


        return True, "Data is valid."

    except Exception as e:
        return False, f"An error occurred: {e}"


# input_file_path = '../data/inputs/actual/actual_input_2710.json'

# with open(input_file_path, "r") as f:
#     data = json.load(f)

# print(validate_data(data))