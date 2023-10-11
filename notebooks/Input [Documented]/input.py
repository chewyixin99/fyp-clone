# Import necessary libraries
import pandas as pd
from datetime import datetime
import numpy as np
import random
import json

# Defining some helper functions #

##########################################################
#### Functions to clean data & generate simple output ####
##########################################################

def clean_data(orig_df):
    """
    Clean and preprocess a DataFrame containing bus trip data.

    This function takes an original DataFrame containing bus trip data and performs several cleaning and preprocessing steps
    to prepare the data for further analysis. The cleaned DataFrame includes timestamp conversion, dropping unnecessary columns,
    assigning trip direction labels, removing duplicate rows, and sorting by trip ID and timestamp.

    Args:
        orig_df (pd.DataFrame): The original DataFrame containing bus trip data.

    Returns:
        cleaned_df (pd.DataFrame): A cleaned and preprocessed DataFrame with the following modifications:
                                   - "vehicleTimestamp" column converted to datetime format.
                                   - Columns "pippenId," "pippenCreatedAt," "tripStartTime," and "tripStartDate" dropped.
                                   - "tripDirectionId" column assigned based on specific vehicle labels.
                                   - Duplicate rows removed.
                                   - Rows sorted by "tripId" and "vehicleTimestamp."

    Notes:
        - The function assumes that "vehicleTimestamp" is in Unix timestamp format (seconds since epoch) and converts it to datetime.
        - Columns "pippenId," "pippenCreatedAt," "tripStartTime," and "tripStartDate" are dropped as they are not needed.
        - The "tripDirectionId" column is assigned based on specific vehicle labels.
        - Duplicate rows are removed to ensure data consistency.
        - The resulting DataFrame is sorted by "tripId" and "vehicleTimestamp" for analysis and visualization.
    """

    cleaned_df = orig_df.copy() 
    cleaned_df["vehicleTimestamp"] = pd.to_datetime(cleaned_df["vehicleTimestamp"], unit="s")
    cleaned_df.drop(["pippenId", "pippenCreatedAt", "tripStartTime", "tripStartDate"], axis=1,inplace = True)
    cleaned_df["tripDirectionId"] = np.where((cleaned_df["vehicleLabel"] == "FX2 To Portland") | (cleaned_df["vehicleLabel"] == "FX2 To NW 5th & Hoyt") | (cleaned_df["vehicleLabel"] == "FX2 To NW Irving & 5th"), 1, 0)
    cleaned_df.drop_duplicates(inplace=True)
    cleaned_df.sort_values(by=['tripId', 'vehicleTimestamp'], inplace=True)

    return cleaned_df



def get_date_concerned(file_path):
    """
    Gets date of data in the file is concerned with.

    This function takes the name of a file to determine the date of the data in the file is concerned with.

    Args:
        file_path (string): CSV file name with format "gtfs_data_BusService_PollingRate_dd_mm_yyyy.csv".

    Returns:
        datetime: A datetime that represents the date of the data concerned.
    
    """
    date_str = (file_path.split(".")[0][-10:])
    date_format = '%d-%m-%Y'

    return datetime.strptime(date_str, date_format)



def get_service_concerned(file_path):
    """
    Gets the transport service number that the data in the file is concerned with.

    This function takes the name of a file to determine the transport service number of the data concerned in the file.

    Args:
        file_path (string): CSV file name with format "gtfs_data_BusService_PollingRate_dd_mm_yyyy.csv".

    Returns:
        string: A string that represents the transport service number of the data concerned.
     
    """

    service_str = (file_path.split("_")[2])
    return service_str


# def get_poll_rate(file_path): #NOT USED
#     """
#     Gets the polling rate of Pippen that the data in the file is concerned with.

#     This function takes the name of a file to determine the polling rate of Pippen of the data concerned in the file.

#     Args:
#         file_path (string): CSV file name with format "gtfs_data_BusService_PollingRate_dd_mm_yyyy.csv".

#     Returns:
#         string: A string that represents the polling rate of Pippen of the data concerned.
     
#     Note: 
#         File name format should be with format "gtfs_data_BusService_PollingRate_dd_mm_yyyy.csv"
#     """
#     poll_rate = (file_path.split(".")[0][12:14])
#     return poll_rate

# def get_seconds(time_str): #NOT USED
#     """
#     Gets the amount of time in seconds of any given duration.

#     This function takes a time period in hours or minutes and converts it to seconds.

#     Args:
#         time_str (string): Time in hh:mm:ss format.

#     Returns:
#         integer: An integer that represents the amount of time elapsed in seconds.
    
#     """
#     hh, mm, ss = time_str.split(':')
#     return int(hh) * 3600 + int(mm) * 60 + int(ss)


############################################
#### Functions to determine Bus Timings ####
############################################

def distinguish_one_trip_data(df, tripID):
    """
    Gets data related to a particular trip based on tripID.
    This helper function provides information required by function get_timings()

    This function sorts all data of the specific tripID given by vehicleTimestamp and vehicleStopSequence and returns relevant rows.

    Args:
        df (pd.DataFrame): A DataFrame containing bus trip data.
        tripID (string): A string that represents the trip concerned.

    Returns:
        pd.DataFrame: A DataFrame contained detailed bus trip data with columns:
            "tripId","vehicleTimestamp","vehicleCurrentStatus", "vehicleStopSequence" and "vehicleStopID"
    
    """

    result = df[df["tripId"] == tripID].sort_values(by=['vehicleTimestamp', 'vehicleStopSequence'])
    return result[["tripId","vehicleTimestamp","vehicleCurrentStatus", "vehicleStopSequence", "vehicleStopID"]]


def get_timings(tripID, expectedNumSequence):
    one_trip_df = distinguish_one_trip_data(cleaned_df, tripID).copy()
    one_trip_df.reset_index(drop=True,inplace=True)
    one_trip_df2 = one_trip_df.groupby("vehicleStopSequence")

    counter = 1 # Starting sequence will be 1
    timings = [] # Output
    curStopArr = 0
    prevStopDep = 0
    
    for stopSequence, group in one_trip_df2:
        # This level deals with each stopSequece group as a whole. [Eg. All sequences from 1 to expectedNumSequence]

        # Ignore if 0. There were some off cases where stopSequence = 0. Ignore
        if stopSequence == 0: 
            continue
        
        # Add placeholder timestamps for missing sequences until counter matches the stopSequence. 
        # [Eg. Data only has stop sequence 20 to 30. This WHILE loop adds in [0,0] from 1 to 19]
        while counter < stopSequence:
            timings.append([0, 0])
            counter += 1

        for row_index, row in group.iterrows():
            # This level deals with a individual sequenceGroup's entries. [Eg. All entries within stopSequence = 5]

            # Stiutation 1: Only have one entry [Eg. stopSequence = 5 only have 1 entry]
            if len(group) == 1:
                # Status = IN_TRANSIT_TO, prevStopDep not set. Take the current StopSequence timestamp as the departure time of the previous stopSequence.
                # [Eg. stopSequence = 5 timestamp is stopSequence 4 departure]
                if row["vehicleStopSequence"] == counter and row["vehicleCurrentStatus"] == "IN_TRANSIT_TO" and prevStopDep == 0:
                    prevStopDep = row["vehicleTimestamp"]
                    timings[stopSequence-2][1] = prevStopDep

                # Status = STOPPED_AT, curStopArr not set. Take the current StopSequence timestamp as its arrival time.
                if row["vehicleCurrentStatus"] == "STOPPED_AT" and curStopArr == 0:
                    curStopArr = row["vehicleTimestamp"]

            # Situation 2: Multiple entries [Eg. stopSequence = 5 have 10 entries]
            else: 
                # Status = IN_TRANSIT_TO, prevStopDep not set. Continue is used here to take the current StopSequence first entry's timestamp as the departure time of the previous stopSequence.
                # [Eg. stopSequence = 5 have 10 entries, take first timestamp as stopSequence = 4 departure]
                if row["vehicleStopSequence"] == counter and row["vehicleCurrentStatus"] == "IN_TRANSIT_TO" and prevStopDep == 0:
                    prevStopDep = row["vehicleTimestamp"]
                    timings[stopSequence-2][1] = prevStopDep
                    continue

                # Get last transit as pass by timing
                if row["vehicleStopSequence"] == counter and row["vehicleCurrentStatus"] == "IN_TRANSIT_TO" and curStopArr == 0:
                    curStopArr = 0

                # Status = STOPPED_AT, curStopArr not set. Break is used here to take the current StopSequence first entry's timestamp as its arrival.
                # [Eg. stopSequence = 5 have 10 entries, take first timestamp as its arrival]
                elif row["vehicleCurrentStatus"] == "STOPPED_AT" and curStopArr == 0:
                    curStopArr = row["vehicleTimestamp"]
                    break
        
        # Reset the curStopArr & prevStopDep, increment the counter, append curStopArr for the current stopSequence.
        # [Eg. Append the curStopArr and departure = 0 for stopSequence = 5]
        if stopSequence <= expectedNumSequence:
            timings.append([curStopArr,0])
            curStopArr = 0
            prevStopDep = 0
            counter += 1

    # Add placeholder timings for missing stopSequence until it hits expectedNumSequence
    while len(timings) < expectedNumSequence:
        timings.append([0, 0])

    # Return the timings
    return timings


def get_trip_timings_by_direction(directedTripIds, expectedNumSequence):
    """
    Retrieve trip timings for a list of directed trip IDs.
    This helper function relies on get_timings() function to retrieve trip timings
    This helper function provides information required by other functions such as get_headway(), get_arrivals, get_dwellings() and get_interstation().

    This function takes a list of directed trip IDs and an expected number sequence as input. It iterates through each trip ID
    in the provided list and retrieves trip timings using the `get_timings` function. The resulting trip timings for all directed trips
    are stored in a list and returned.

    Args:
        directedTripIds (list): A list of directed trip IDs for which trip timings need to be retrieved.
        expectedNumSequence (int): The expected number sequence used to filter trip timings.

    Returns:
        timingArray (list): A list of lists (one for each trip) of lists of trip timings for each directed trip in the same order as `directedTripIds`.

    """

    timingArray = []
    for tripId in directedTripIds:
        timingArray.append(get_timings(tripId, expectedNumSequence))
    return timingArray

############################################################
#### Functions to generate data required for input.json ####
############################################################

def get_num_stops(df, directionId):
    """
    Calculate the number of stops in a DataFrame for a given trip direction.
    It is used to get information to be converted into JSON format for use in the model.


    This function takes a DataFrame containing bus trip data and a direction ID as input. It filters the DataFrame to include only
    the data for the specified trip direction and then calculates the number of unique stops for that direction. The resulting count
    represents the total number of stops for the given direction.

    Args:
        df (pd.DataFrame): A DataFrame containing bus trip data, including columns like "tripDirectionId" and "vehicleStopSequence."
        directionId (int): The direction ID for which the number of stops needs to be calculated. A integer that is either 0 or 1 (definition predetermined by GTFS standards)


    Returns:
        num_stops (int): The total number of stops in the specified trip direction.


    Notes:
        - The function filters the DataFrame to include only data for the specified trip direction.
        - It calculates the number of unique stops in the filtered data.
        - If the minimum stop sequence is greater than 1, it calculates the number of stops as the difference between the maximum and minimum stop sequences, plus 1.
        - If the stop sequence includes 0, it subtracts 1 from the count to account for the missing stop sequence.
    """    

    df = df.loc[df["tripDirectionId"] == directionId]
    stop_seq = df["vehicleStopSequence"].unique()

    min_stop_seq = min(stop_seq)

    if min_stop_seq >1:
        num_stops = max(stop_seq) - min_stop_seq +1
    else:
        num_stops = max(stop_seq)
    
    if 0 in stop_seq:
        num_stops = num_stops - 1

    return int(num_stops)


def get_stop_info(df, staticStopsFile, directionId):
    """
    Extracts information about bus stops from a DataFrame and a static stops file.
    It is used to get information to be converted into JSON format for use in the model.


    This function takes a DataFrame containing bus trip data, a static stops file in CSV format, and a direction ID
    as input, and extracts information about bus stops that match the provided direction ID. The extracted information
    includes stop coordinates, stop IDs, and stop names.

    Args:
        df (pd.DataFrame): A DataFrame containing bus trip data, including columns like "vehicleStopID" and "tripDirectionId".
        staticStopsFile (str): Path to a CSV file containing static bus stop information.
        directionId (int): The direction ID for which bus stops need to be extracted.

    Returns:
        coordinates_list (list): A list of lists containing stop coordinates in the format [(lat1, lon1), (lat2, lon2), ...].
        stop_ids_list (list): A list of unique stop IDs as strings.
        stop_names_list (list): A list of unique stop names as strings.

    Notes:
        - The function filters bus stops in the DataFrame based on the provided directionId.
        - It then reads static stop information from the CSV file and matches it with the filtered bus stops.
        - Coordinates (latitude and longitude), stop IDs, and stop names for the matching bus stops are extracted.
        - Stops with IDs listed in the 'stop_to_ignore' variable are excluded from the result.

    Example:
        df = pd.DataFrame({"vehicleStopID": ["1001", "2002", "3003"],
                           "tripDirectionId": [1, 2, 1]})
        staticStopsFile = "static_stops.csv"
        directionId = 1
        coords, ids, names = get_stop_info(df, staticStopsFile, directionId)
    """
    stopsTxt = pd.read_csv(staticStopsFile, delimiter='\t')

    bus_stops = df["vehicleStopID"].loc[df["tripDirectionId"] == directionId].unique().astype(int).astype(str)
    stop_to_ignore = ["9302"]  # TO BE FURTHER IMPROVED
    coordinates_list = []
    stop_ids_list = []
    stop_names_list = []

    for i in range(num_stops):
        coordinates_list.append([])

    for idx, each_stop in enumerate(bus_stops):
        for i in range(len(stopsTxt)):
            row = stopsTxt["stop_id,stop_code,stop_name,tts_stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station,direction,position"][i]
            one_stop = row.split(",")
            stop_id = str(one_stop[0])
            stop_name = str(one_stop[2])

            if stop_id in bus_stops and stop_id not in stop_to_ignore and each_stop == stop_id:
                try:
                    stop_location_lat = float(one_stop[5])
                    stop_location_long = float(one_stop[6])
                except ValueError:
                    stop_location_lat = float(one_stop[6])
                    stop_location_long = float(one_stop[7])

                coordinates_list[idx].append(stop_location_lat)
                coordinates_list[idx].append(stop_location_long)
                stop_ids_list.append(stop_id)
                stop_names_list.append(stop_name)

    return coordinates_list, stop_ids_list, stop_names_list



def get_arrivals(tripsTimings,date): # Get Arrival Times [Each stop, per trip]
    """
    Calculate the arrival times relative to a given date for a list of trip timings.
    It is used to get information to be converted into JSON format for use in the model.
    This helper function relies on get_trip_timings_by_direction() function.


    This function takes a list of trip timings, where each trip consists of a list of stops with arrival and departure times.
    It calculates the arrival times for each stop relative to a specified date in seconds. If there is no arrival time for a stop,
    but there is a departure time, it treats it as the bus passing by the stop, and the arrival time is calculated based on the departure time.
    If neither arrival nor departure times are available, it assigns 0 as the arrival time.

    Args:
        tripsTimings (list): A list of lists of lists containing trip timings, where each trip consists of a list of stops.
                             Each stop should have a tuple (arrival_time, departure_time) in datetime format.
        date (datetime): The reference date to calculate arrival times relative to.

    Returns:
        result (list): A list of lists containing the calculated arrival times for each stop in each trip, 
                      measured in seconds relative to the provided date.

    Notes:
        - The function calculates arrival times as the number of seconds elapsed since the provided date.
        - If a stop has both arrival and departure times, it considers the arrival time.
        - If neither arrival nor departure times are available, it assigns 0 as the arrival time.
    """
  
    
    result = []

    for i in range(len(tripsTimings)): # Create as many empty list as there is in tripsTimings. Allows for easy append via index.
        result.append([])

    for j in range(len(tripsTimings)): # For each trip
        for stop in tripsTimings[j]: # For each stop 
            stopArr = stop[0]
            stopDep = stop[1]

            if stopArr != 0: # Arrival time is present and is a datetime object.
                result[j].append(int((stopArr - date).total_seconds()))

            elif stopArr == 0 and stopDep != 0: # No arrival time, but have departure time and is a datetime object. Treat as bus pass by the stop.
                result[j].append(int((stopDep - date).total_seconds()))

            else:
                result[j].append(0)

    return result

# Get Bus Availability
def get_bus_availability(tripsTimings,date):
    """
    Calculate the availability of a bus for each trip based on the last recorded departure time.
    It is used to get information to be converted into JSON format for use in the model.
    This helper function relies on get_trip_timings_by_direction() function.

    This function takes a list of trip timings and a reference date as input. It calculates the availability of a bus for each trip
    by examining the last recorded departure time relative to the provided date. The availability is measured in seconds from the date
    and returned as a list.

    Args:
        tripsTimings (list): A list of trip timings, where each trip consists of a list of stop timings.
                            Each stop timing should have arrival and departure times in datetime format.
        date (datetime): The reference date used to calculate the availability.

    Returns:
        availability (list): A list of availability values for each trip, measured in seconds from the provided date.
                            If the last recorded departure time is missing (0), it is returned as-is.

    Notes:
        - The function examines the last recorded departure time for each trip to calculate bus availability.
        - Availability is measured in seconds from the provided date.
        - If the last recorded departure time is missing (0), it is returned as-is to indicate the absence of data.
    """
    result = []

    for i in range(len(tripsTimings)): # For each trip
        lastRecordIndex = len(tripsTimings[i])-1
        lastRecordDep = tripsTimings[i][lastRecordIndex][1]
        if lastRecordDep != 0: # Last record departure is a datetime object.
            result.append(int((lastRecordDep - date).total_seconds()))
        else:
            result.append(lastRecordDep)
    return result

# Get Trip Dwelling Times [Each stop, per trip]
def get_dwellings(tripsTimings):
    """
    Calculate dwell times for each stop in a list of trip timings.
    It is used to get information to be converted into JSON format for use in the model.
    This helper function relies on get_trip_timings_by_direction() function.

    This function takes a list of trip timings as input, where each trip consists of a list of stop timings with arrival and departure times.
    It calculates the dwell times at each stop in each trip and stores the results in a nested list. Dwell time is defined as the time spent
    by the bus at a stop and is measured in seconds. Dwell time is calculated based on the difference between arrival and departure times at each stop.

    Args:
        tripsTimings (list): A list of trip timings, where each trip consists of a list of stop timings.
                            Each stop timing should have arrival and departure times in datetime format.

    Returns:
        dwellings (list): A list of lists containing dwell times for each stop in each trip. Dwell times are measured in seconds.
                         A value of 0 represents no dwell time or the absence of arrival and departure times.
    """

    result = []

    for i in range(len(tripsTimings)): # Create as many empty list as there is in tripsTimings. Allows for easy append via index.
        result.append([])

        for j in range(len(tripsTimings[i])-1): # For each stop in a trip
            stopArr = tripsTimings[i][j][0]
            stopDep = tripsTimings[i][j][1]

            # No arrival and departure time
            if stopArr == 0 and stopDep == 0:
                result[i].append(0)

            # No arrival time, but have departure time and is a datetime object. Bus passed by = No dwell time
            if stopArr == 0 and stopDep != 0:
                result[i].append(0)

            # Have both arrival and departure time and is a datetime object.
            if stopArr != 0 and stopDep != 0:
                dwell = stopDep - stopArr
                result[i].append(int(dwell.total_seconds()))

    return result

# Get Trip Headways [Each stop, between trips]
def get_headway(tripsTimings):
    """
    Calculate the headway between consecutive trips at each stop.
    It is a function used to calculate headways to estimate target headways more accurately. 


    This function takes a list of trip timings as input, where each trip consists of a list of stop timings with arrival and departure times.
    It calculates the headway (time interval between trips) at each stop, considering various scenarios such as one trip passing by another.
    Headway between consecutive trips at each stop is calculated based on their arrival and departure times

    Args:
        tripsTimings (list): A list of trip timings, where each trip consists of a list of stop timings.
                            Each stop timing should have arrival and departure times in datetime format.

    Returns:
        headways (list): A list of lists containing headways between consecutive trips at each stop. Headways are measured in seconds.

    """

    result = []
    for i in range(len(tripsTimings)-1):  
        result.append([])
        tripA = tripsTimings[i]
        tripB = tripsTimings[i+1]

        for j in range(len(tripA)):
            tripAStopArr = tripA[j][0]
            tripAStopDep = tripA[j][1]
            tripBStopArr = tripB[j][0]
            tripBStopDep = tripB[j][1]

            #Ideal
            if tripAStopArr != 0 and tripBStopArr != 0:
                headway = (tripBStopArr - tripAStopArr).total_seconds()

            # Bus pass by tripA at stop j, use its departure as arrival
            if tripAStopArr == 0 and tripAStopDep != 0:
                if tripBStopArr != 0:
                    headway = (tripBStopArr - tripAStopDep).total_seconds()
                else:
                    headway = (tripBStopDep - tripAStopDep).total_seconds()

            # Bus pass by tripB at stop j, use its departure as arrival
            if tripBStopArr == 0 and tripBStopDep != 0:
                if tripAStopArr != 0:
                    headway = (tripBStopDep - tripAStopArr).total_seconds()
                else:
                    headway = (tripBStopDep - tripAStopDep).total_seconds()

            if tripAStopArr == 0 and tripBStopArr == 0:
                if tripAStopDep != 0 and tripBStopDep != 0:
                    headway = (tripBStopDep - tripAStopDep).total_seconds()
                else:
                    headway = 0

            result[i].append(int(headway))
    return result

def generate_target_headways(tripsHeadways, target_headway, expectedNumSequence):
    """
    Generate target headways for each trip based on a specified value.
    This function relies on the outputs of function get_headway().
    It is used to get information to be converted into JSON format for use in the model.


    This function takes a list of trip headways, a target headway value, and the expected number of sequences as input. It generates
    a list of target headways for each trip based on the provided target headway value and expected number of sequences.

    Args:
        tripsHeadways (list): A list of lists containing trip headways between consecutive trips at each stop. Headways are measured in seconds.
        target_headway (int): The target headway value to be assigned to each trip.
        expectedNumSequence (int): The expected number of sequences used to determine the number of target headways to generate.

    Returns:
        target_headways (list): A list of lists containing target headway values for each trip and each sequence.
                               The target headways are measured in seconds.
    """

    result = [[]]
    for e in range(expectedNumSequence-1):
        result[0].append(0)

    for i in range(len(tripsHeadways)):
        result.append([])
        currentHeadwayList = tripsHeadways[i]
        for j in range(len(currentHeadwayList)):
            if j == 0:
                continue
            else:
                result[i+1].append(target_headway)

    return result

# Get Interstation Travel Time [Between stops, each trip]
def get_interstation(tripsTimings):
    """
    Calculate interstation travel times between consecutive stops for each trip.
    It is used to get information to be converted into JSON format for use in the model.


    This function takes a list of trip timings as input, where each trip consists of a list of stop timings with arrival and departure times.
    It calculates the interstation travel times between consecutive stops for each trip, considering various scenarios and scenarios where arrival or
    departure times are missing.

    Args:
        tripsTimings (list): A list of trip timings, where each trip consists of a list of stop timings.
                            Each stop timing should have arrival and departure times in datetime format.

    Returns:
        interstation_times (list): A list of lists containing interstation travel times for each trip. Interstation times are measured in seconds.

    """
    result = []
    for i in range(len(tripsTimings)):
        result.append([])
        for j in range(len(tripsTimings[i])-1):

            stopADep = tripsTimings[i][j][1]
            stopBArr = tripsTimings[i][j+1][0]
            stopBDep = tripsTimings[i][j+1][1]

            if stopBArr == 0 and stopBDep != 0:
                interstation = stopBDep - stopADep
            
            if stopADep != 0 and stopBArr != 0:
                interstation = stopBArr - stopADep
            
            result[i].append(int(interstation.total_seconds()))

    return result


def generate_weights(df, num_stops, input_key_stops): 
    """
    Generate weights for stops in a bus trip based on specific criteria.
    It is used to get information to be converted into JSON format for use in the model.

    This function calculates weights for each stop in a bus trip based on provided criteria, such as key stops and the bus's current status.
    The weights are used to represent the significance of each stop in the trip.

    Args:
        df (pd.DataFrame): A DataFrame containing bus trip data, including columns like "vehicleStopSequence," "vehicleStopID," and "vehicleCurrentStatus."
        num_stops (int): The total number of stops in the trip.
        input_key_stops (list): A list of stop IDs considered as key stops that should have higher weights.

    Returns:
        weights_list (list): A list of weights for each stop in the trip, with higher values indicating higher significance.

    Notes:
        - Key stops, when present, receive higher weights.
    """
    stop_sequence = 1
    row = 0

    weights_list = [0.5] * num_stops
    for i in range(num_stops):
        stop_now = i
        green = 1
        while stop_sequence == int(df["vehicleStopSequence"][row]):
            if int(df["vehicleStopID"][row]) in input_key_stops and green:
                weights_list[stop_sequence-1] += 0.2
                green = 0
            if weights_list[stop_sequence-1] <=1 and df["vehicleCurrentStatus"][row] == "STOPPED_AT":
                weights_list[stop_sequence-1] +=0.05
            row+=1
        stop_sequence +=1

    return weights_list

#    eda seems random
#     in theory: less at the end of route; more at key stops 
def generate_arrival_rate(df, num_stops, input_key_stops): 
    """
    Generate arrival rates of passengers arrival per second for stops in a bus route.
    It is used to get information to be converted into JSON format for use in the model.


    This function calculates arrival rates for each stop in a bus route based on specific criteria, including key stops and stop order.
    Arrival rates represent the expected rate of passengers arriving at each stop per second.

    Args:
        df (pd.DataFrame): A DataFrame containing bus route data, including columns like "vehicleStopID" and "tripDirectionId."
        num_stops (int): The total number of stops in the route.
        input_key_stops (list): A list of stop IDs considered as key stops that should have higher arrival rates.

    Returns:
        arrival_rate_list (list): A list of arrival rates of passengers for each stop in the route.

    Notes:
        - key stops are deterministically higher than non-key stops
        - Last stop has 0 passengers arriving
        - Range of 0 to 0.1 (aka maximum of 6pax/min)

    """

    arrival_rate_list = []

    stops_in_route = df["vehicleStopID"].unique()
    for i in range(num_stops-1):
        arr = 0

        if stops_in_route[i] in input_key_stops:
            arr += 0.05

        if i <(num_stops//2):
            arr += round(random.uniform(0, 0.03),3)
        else:
            arr += round(random.uniform(0, 0.049),3)

        arrival_rate_list.append(arr)


    arrival_rate_list.append(0)
    return arrival_rate_list

    #less at the end of route; more at key stops 
def generate_initial_passengers(df, num_stops, input_key_stops):
    """
    Generate initial passenger counts for stops in a bus route.

    This function calculates initial passenger counts for each stop in a bus route based on specific criteria, including key stops and stop order.
    Initial passenger counts represent the number of passengers present when the bus starts its route.

    Args:
        df (pd.DataFrame): A DataFrame containing bus route data, including columns like "vehicleStopID."
        num_stops (int): The total number of stops in the route.
        input_key_stops (list): A list of stop IDs considered as key stops that should have higher initial passenger counts.

    Returns:
        initial_passengers_list (list): A list of initial passenger counts for each stop in the route.

    Notes:
        - Manual set rnge of 0 to 6

    """
    initial_passengers_list = []

    stops_in_route = df["vehicleStopID"].unique()
    for i in range(num_stops-1):
        p = 0

        if stops_in_route[i] in input_key_stops:
            p += 4

        if i <(num_stops//2):
            p += random.randint(0, 6)
        else:
            p += random.randint(0, 4)
            
        initial_passengers_list.append(p)

    initial_passengers_list.append(0)
    return initial_passengers_list

#alighting_percentage_list [41]
def generate_alighting_percentage(df, num_stops, input_key_stops, directionId):
    """
    Generate alighting percentages of passengers for stops in a bus route.

    This function calculates alighting percentages for each stop in a bus route based on specific criteria, including key stops, direction, and stop order.
    Alighting percentages represent the expected percentage of passengers alighting at each stop, ranging from 0 to 1.

    Args:
        df (pd.DataFrame): A DataFrame containing bus route data, including columns like "vehicleStopID" and "tripDirectionId."
        num_stops (int): The total number of stops in the route.
        input_key_stops (list): A list of stop IDs considered as key stops that should have higher alighting percentages.
        directionId (int): The direction identifier for the bus route.

    Returns:
        alighting_percentage_list (list): A list of alighting percentages for each stop in the route.
 
    """

    alighting_percentage_list = []

    stops_in_route = df["vehicleStopID"].loc[df["tripDirectionId"]== directionId].unique()

    alighting_percentage_list.append(0)

    for i in range(num_stops-3):
        a = 0

        if stops_in_route[i] in input_key_stops:
            a += 0.02

        if i <(num_stops//2):
            a += round(random.uniform(0, 0.6),3)
        else:
            a += round(random.uniform(0, 0.97),3)
            
        alighting_percentage_list.append(a)

    alighting_percentage_list.append(1)

    return alighting_percentage_list

def getNumStops(df, directionId):
    df = df.loc[df["tripDirectionId"] == directionId]
    stop_seq = df["vehicleStopSequence"].unique()
    min_stop_seq = min(stop_seq)

    if min_stop_seq >1:
        num_stops = max(stop_seq) - min_stop_seq +1
    else:
        num_stops = max(stop_seq)
    
    if 0 in stop_seq:
        num_stops = num_stops - 1

    return int(num_stops)


#################################
#### Functions to Print Data ####
#################################

# def viewTimings(df, tripID, expectedNumSequence): #NOT USED
#     timings = get_timings(tripID, expectedNumSequence)
#     print(100*"#")
#     print("Arrival and Departure Timings for tripid #" + str(tripID))
#     print("Expected number of timings is:",expectedNumSequence)
#     print(100*"#")
    
#     stop = 1
#     for times in timings:
#         print("Stop "+str(stop)+", [Arrival] is", times[0],"[Departure] is",times[1])
#         stop += 1

# def view_timing_2(tripArray): #NOT USED
#     stop = 1
#     for times in tripArray:
#         print("Stop "+str(stop)+": [Arrival] is", times[0],"[Departure] is",times[1])
#         stop += 1
#     print("\n")



# def output(allDirectedTripTimings, allDirectedTripIds): #NOT USED
#     for i in range(len(allDirectedTripIds)):
#         print(100*"#")
#         print("Arrival and Departure Timings for tripid #" + str(allDirectedTripIds[i]))
#         print(100*"#")
#         view_timing_2(allDirectedTripTimings[i])


# Ignore

# def getTripIds(directionDF):
#     return directionDF["tripId"].unique()


# greshamBoundTrips = cleaned_df[cleaned_df["tripDirectionId"] == 0]
# portlandBoundTrips = cleaned_df[cleaned_df["tripDirectionId"] == 1]
# allGreshamTripIds = getTripIds(greshamBoundTrips)
# allPortlandTripIds = getTripIds(portlandBoundTrips)
# allGreshamTripIds = allGreshamTripIds.tolist()
# allPortlandTripIds = allPortlandTripIds.tolist()
# greshamTimings = []
# portlandTimings = []

# greshamTimings = get_trip_timings_by_direction(allGreshamTripIds, expectedNumSequence)
# portlandTimings = get_trip_timings_by_direction(allPortlandTripIds, expectedNumSequence)


# Importing the data #
file_path = "gtfs_data_2_15s_17-09-2023.csv"
orig_df = pd.read_csv(file_path)
cleaned_df = clean_data(orig_df)


# Some basic info needed for datetime calculations
expectedNumSequence = cleaned_df["vehicleStopSequence"].max()-1
date = get_date_concerned(file_path)
service = get_service_concerned(file_path)

## PRETTY PRINTS ##
print("Date we are looking at:", date)


# KeyStops [Manual, based on TriMet website]
input_key_stops = [14232, 14233, 1416, 1381, 1499, 1459, 7800, 9302] #SET
numStops0 = getNumStops(cleaned_df, 0)
numStops1 = getNumStops(cleaned_df, 1)

# Subset Trips [MidTerm]
subsetTripIds = [12748581, 12748582, 12748583, 12748584]
subsetTripDf = cleaned_df[cleaned_df["tripId"].isin(subsetTripIds)]
subsetTimings = get_trip_timings_by_direction(subsetTripIds, expectedNumSequence)

# Current Headways
tripHeadways = get_headway(subsetTimings)
target_headway = 720

# Setting some JSON Values # 
num_trips =  subsetTripDf["tripId"].nunique()
num_stops = get_num_stops(subsetTripDf,1)
bus_capacity = 100 #SET
original_dispatch_list = [73200, 73920, 74640, 75360] #Exlcude 72420 since it's trip 0 timing #Manual via TriMet website #!!! Change to 77420, 79200, 80920, 81640 or any other timing
coordinates_list = get_stop_info(subsetTripDf, "stops.txt", 1)[0]
stop_ids_list = get_stop_info(subsetTripDf, "stops.txt", 1)[1]
stop_names_list = get_stop_info(subsetTripDf, "stops.txt", 1)[2]
prev_arrival_list = get_arrivals(subsetTimings,date)[0] #Change to 1d
prev_dwell_list = get_dwellings(subsetTimings)[0] #Change to 1d
arrival_rate_list = generate_arrival_rate(cleaned_df, numStops1, input_key_stops) #[0.045, 0.029, 0.026, 0.096, 0.066, 0.095, 0.081, 0.02, 0.039, 0.018, 0.003, 0.076, 0.059, 0.024, 0.068, 0.075, 0.073, 0.027, 0.019, 0.05, 0.062, 0.063, 0.084, 0.086, 0.052, 0.00, 0.021, 0.002, 0.074, 0.095, 0.059, 0.012, 0.056, 0.011, 0.043, 0.026, 0.092, 0.009, 0.055, 0.01, 0.03, 0]
alighting_percentage_list = generate_alighting_percentage(cleaned_df, numStops1, input_key_stops, 1) #[0.16, 0.31, 0.65, 0.22, 0.82, 0.17, 0.87, 0.07, 0.35, 0.83, 0.84, 0.14, 0.19, 0.21, 0.77, 0.24, 0.95, 0.7, 0.53, 0.61, 0.36, 0.32, 0.81, 0.45, 0.55, 0.25, 0.78, 0.06, 0.09, 0.78, 0.59, 0.6, 0.35, 0.46, 0.91, 0.96, 0.01, 0.58, 0.83, 0.03, 0.79]
boarding_duration = 2 #SET
alighting_duration = 2 #SET
weights_list = generate_weights(cleaned_df, numStops1, input_key_stops) #[0.7, 0.75, 0.55, 0.55, 0.5, 0.55, 0.55, 0.55, 0.5, 0.75, 0.55, 0.6000000000000001, 0.55, 0.55, 0.55, 0.8, 0.6000000000000001, 0.5, 0.5, 0.55, 0.5, 0.75, 0.6000000000000001, 0.55, 0.55, 0.55, 0.55, 0.7, 0.5, 0.5, 0.55, 0.55, 0.5, 0.55, 0.8000000000000003, 0.55, 0.55, 0.6000000000000001, 0.8500000000000001, 0.55, 0.6000000000000001]
bus_availability_list = [72000, 72000, 72000, 72000]  #get_bus_availability(subsetTimings,date)
initial_passengers_list = generate_initial_passengers(cleaned_df, numStops1, input_key_stops) #[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
max_allowed_deviation = 600 #SET
target_headway_2dlist = generate_target_headways(tripHeadways, target_headway, expectedNumSequence) #SET
interstation_travel_2dlist = get_interstation(subsetTimings)


# ONE LAST HURRAH
def jsonOutput(num_trips, num_stops, bus_capacity, original_dispatch_list, coordinates_list, stop_ids_list, stop_names_list, prev_arrival_list, prev_dwell_list, arrival_rate_list, alighting_percentage_list, boarding_duration, alighting_duration, weights_list, bus_availability_list, initial_passengers_list, max_allowed_deviation, target_headway_2dlist, interstation_travel_2dlist):
    output = {
        "num_trips": num_trips,
        "num_stops": num_stops,
        "bus_capacity": bus_capacity,
        "original_dispatch_list": original_dispatch_list,
        "coordinates_list": coordinates_list,
        "stop_ids_list": stop_ids_list,
        "stop_names_list": stop_names_list,
        "prev_arrival_list": prev_arrival_list,
        "prev_dwell_list": prev_dwell_list,
        "arrival_rate_list": arrival_rate_list,
        "alighting_percentage_list": alighting_percentage_list,
        "boarding_duration": boarding_duration,
        "alighting_duration": alighting_duration,
        "weights_list": weights_list, 
        "bus_availability_list": bus_availability_list,
        "initial_passengers_list": initial_passengers_list,
        "max_allowed_deviation": max_allowed_deviation,
        "target_headway_2dlist": target_headway_2dlist,
        "interstation_travel_2dlist": interstation_travel_2dlist 
    }

    # Serializing json
    json_object = json.dumps(output, indent=4)
    
    # Writing to sample.json
    with open("input.json", "w") as outfile:
        outfile.write(json_object)

jsonOutput(num_trips, num_stops, bus_capacity, original_dispatch_list, coordinates_list, stop_ids_list, stop_names_list, prev_arrival_list, prev_dwell_list, arrival_rate_list, alighting_percentage_list, boarding_duration, alighting_duration, weights_list, bus_availability_list, initial_passengers_list, max_allowed_deviation, target_headway_2dlist, interstation_travel_2dlist)