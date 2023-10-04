# Import necessary libraries
import pandas as pd
from datetime import datetime
import numpy as np
import random
import json

# Defining some helper functions #
def get_date_concerned(file_path):
    date_str = (file_path.split(".")[0][12:])
    date_format = '%d-%m-%Y'
    return datetime.strptime(date_str, date_format)

def get_service_concerned(file_path):
    service_str = (file_path.split("_")[2])
    return service_str

def get_seconds(time_str):
    hh, mm, ss = time_str.split(':')
    return int(hh) * 3600 + int(mm) * 60 + int(ss)

def viewOneTrip(tripID):
    result = orig_df2[orig_df2["tripId"] == tripID].sort_values(by=['vehicleTimestamp', 'vehicleStopSequence'])
    return result[["tripId","vehicleTimestamp","vehicleCurrentStatus", "vehicleStopSequence", "vehicleStopID"]]

def num_stops_function(df, directionId):
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

def getStopInfo(df, stopsTxt, directionId):
    bus_stops = df["vehicleStopID"].loc[df["tripDirectionId"] == directionId].unique().astype(int).astype(str)
    stop_to_ignore = ["9302"]
    coordinates_list = []
    stop_ids_list = []
    stop_names_list = []

    for i in range(num_stops):
        coordinates_list.append([])

    for idx, each_stop in enumerate(bus_stops): 
        # if (stop_id in bus_stops) and (stop_id not in stop_to_ignore):
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

    # print(stop_names_list)
    return coordinates_list, stop_ids_list, stop_names_list

def get_timings(tripID, expectedNumSequence):
    one_trip_df = viewOneTrip(tripID).copy()
    one_trip_df.reset_index(drop=True,inplace=True)
    one_trip_df2 = one_trip_df.groupby("vehicleStopSequence")

    counter = 1 # Starting sequence will be 1
    timings = [] # Output
    curStopArr = 0
    prevStopDep = 0
    
    for stopSequence, group in one_trip_df2:
        # This level deals with each stopSequece group as a whole. [Eg. All sequences from 1 to expectedNumSequence]

        # Add placeholder timestamps for missing sequences until counter matches the stopSequence. 
        # [Eg. Data only has stop sequence 20 to 30. This WHILE loop adds in [0,0] from 1 to 19]
        while counter < stopSequence:
            # Ignore if 0. There were some off cases where stopSequence = 0. Ignore
            if stopSequence == 0: 
                continue
            else:
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

def viewTimings(tripID, expectedNumSequence):
    timings = get_timings(tripID, expectedNumSequence)
    print(100*"#")
    print("Arrival and Departure Timings for tripid #" + str(tripID))
    print("Expected number of timings is:",expectedNumSequence)
    print(100*"#")
    
    stop = 1
    for times in timings:
        print("Stop "+str(stop)+", [Arrival] is", times[0],"[Departure] is",times[1])
        stop += 1

def viewTimingTwo(tripArray):
    stop = 1
    for times in tripArray:
        print("Stop "+str(stop)+": [Arrival] is", times[0],"[Departure] is",times[1])
        stop += 1
    print("\n")

# Get Arrival Times [Each stop, per trip]
def getArrivals(tripsTimings,date):
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
def getBusAvailability(tripsTimings,date):
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
def getDwellings(tripsTimings):
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
def getHeadway(tripsTimings):
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

            if tripAStopArr == 0 and tripAStopDep == 0 and tripBStopArr == 0 and tripBStopDep == 0:
                headway = 0

            result[i].append(int(headway))
    return result

def generateTargetHeadways(tripsHeadways, targetHeadway, expectedNumSequence):
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
                result[i+1].append(targetHeadway)

    return result

# Get Interstation Travel Time [Between stops, each trip]
def getInterstation(tripsTimings):
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


# Weights_list
def generateWeights(df, num_stops, input_key_stops): 
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

# arrival_rate_list [42]
#     pax/s arriving at bus stop
#    eda seems random
#     in theory: less at the end of route; more at key stops 
#     0 to 0.1 (6pax/min)
def generateArrivalRate(df, num_stops, input_key_stops): 
    arrival_rate_list = []

    stops_in_route = df["vehicleStopID"].unique()
    for i in range(num_stops-1):
        arr = 0

        if stops_in_route[i] in input_key_stops:
            arr += 0.02

        if i <(num_stops//2):
            arr += round(random.uniform(0, 0.05),3)
        else:
            arr += round(random.uniform(0, 0.1),3)

        arrival_rate_list.append(arr)


    arrival_rate_list.append(0)
    return arrival_rate_list

#initial_passengers_list [42]
    #less at the end of route; more at key stops 
    #if dwell = 0, passengers and arrival must = 0
    #0 to 5
def generateInitialPassengers(df, num_stops, input_key_stops):
    initial_passengers_list = []

    stops_in_route = df["vehicleStopID"].unique()
    for i in range(num_stops-1):
        p = 0

        if stops_in_route[i] in input_key_stops:
            p += 2

        if i <(num_stops//2):
            p += random.randint(0, 6)
        else:
            p += random.randint(0, 4)
            
        initial_passengers_list.append(p)

    initial_passengers_list.append(0)
    return initial_passengers_list

#alighting_percentage_list [41]
def generateAlightingPercentage(df, num_stops, input_key_stops, directionId):
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


def output(allDirectedTripTimings, allDirectedTripIds):
    for i in range(len(allDirectedTripIds)):
        print(100*"#")
        print("Arrival and Departure Timings for tripid #" + str(allDirectedTripIds[i]))
        print(100*"#")
        viewTimingTwo(allDirectedTripTimings[i])


# Ignore

# def getTripIds(directionDF):
#     return directionDF["tripId"].unique()

def getTripTimingsByDirection(directedTripIds, expectedNumSequence):
    timingArray = []
    for tripId in directedTripIds:
        timingArray.append(get_timings(tripId, expectedNumSequence))
    return timingArray

# greshamBoundTrips = orig_df2[orig_df2["tripDirectionId"] == 0]
# portlandBoundTrips = orig_df2[orig_df2["tripDirectionId"] == 1]
# allGreshamTripIds = getTripIds(greshamBoundTrips)
# allPortlandTripIds = getTripIds(portlandBoundTrips)
# allGreshamTripIds = allGreshamTripIds.tolist()
# allPortlandTripIds = allPortlandTripIds.tolist()
# greshamTimings = []
# portlandTimings = []

# greshamTimings = getTripTimingsByDirection(allGreshamTripIds, expectedNumSequence)
# portlandTimings = getTripTimingsByDirection(allPortlandTripIds, expectedNumSequence)


# Importing the data #
stopsTxt = pd.read_csv("stops.txt", delimiter='\t')
file_path = "gtfs_data_2_17-09-2023.csv"
orig_df = pd.read_csv(file_path)
orig_df2 = orig_df.copy()
orig_df2["vehicleTimestamp"] = pd.to_datetime(orig_df2["vehicleTimestamp"], unit="s")

# Some basic info needed for datetime calculations
expectedNumSequence = orig_df2["vehicleStopSequence"].max()-1
date = get_date_concerned(file_path)
service = get_service_concerned(file_path)

## PRETTY PRINTS ##
print("Date we are looking at:", date)

# Cleaning & Transforming #
orig_df2.drop(["pippenId", "pippenCreatedAt", "tripStartTime", "tripStartDate"], axis=1,inplace = True)
orig_df2["tripDirectionId"] = np.where((orig_df2["vehicleLabel"] == "FX2 To Portland") | (orig_df2["vehicleLabel"] == "FX2 To NW 5th & Hoyt") | (orig_df2["vehicleLabel"] == "FX2 To NW Irving & 5th"), 1, 0)
orig_df2.drop_duplicates(inplace=True)
orig_df2.sort_values(by=['tripId', 'vehicleTimestamp'], inplace=True)

# KeyStops [Manual, based on TriMet website]
input_key_stops = [14232, 14233, 1416, 1381, 1499, 1459, 7800, 9302] #SET
numStops0 = getNumStops(orig_df2, 0)
numStops1 = getNumStops(orig_df2, 1)

# Subset Trips [MidTerm]
subsetTripIds = [12748581, 12748582, 12748583, 12748584]
subsetTripDf = orig_df2[orig_df2["tripId"].isin(subsetTripIds)]
subsetTimings = getTripTimingsByDirection(subsetTripIds, expectedNumSequence)

# Current Headways
tripHeadways = getHeadway(subsetTimings)
targetHeadway = 720

# Setting some JSON Values # 
num_trips =  subsetTripDf["tripId"].nunique()
num_stops = num_stops_function(subsetTripDf,1)
bus_capacity = 100 #SET
original_dispatch_list = [73200, 73920, 74640, 75360] #Exlcude 72420 since it's trip 0 timing #Manual via TriMet website #!!! Change to 77420, 79200, 80920, 81640 or any other timing
coordinates_list = getStopInfo(subsetTripDf, stopsTxt, 1)[0]
stop_ids_list = getStopInfo(subsetTripDf, stopsTxt, 1)[1]
stop_names_list = getStopInfo(subsetTripDf, stopsTxt, 1)[2]
prev_arrival_list = getArrivals(subsetTimings,date)[0] #Change to 1d
prev_dwell_list = getDwellings(subsetTimings)[0] #Change to 1d
arrival_rate_list = generateArrivalRate(orig_df2, numStops1, input_key_stops) #[0.045, 0.029, 0.026, 0.096, 0.066, 0.095, 0.081, 0.02, 0.039, 0.018, 0.003, 0.076, 0.059, 0.024, 0.068, 0.075, 0.073, 0.027, 0.019, 0.05, 0.062, 0.063, 0.084, 0.086, 0.052, 0.00, 0.021, 0.002, 0.074, 0.095, 0.059, 0.012, 0.056, 0.011, 0.043, 0.026, 0.092, 0.009, 0.055, 0.01, 0.03, 0]
alighting_percentage_list = generateAlightingPercentage(orig_df2, numStops1, input_key_stops, 1) #[0.16, 0.31, 0.65, 0.22, 0.82, 0.17, 0.87, 0.07, 0.35, 0.83, 0.84, 0.14, 0.19, 0.21, 0.77, 0.24, 0.95, 0.7, 0.53, 0.61, 0.36, 0.32, 0.81, 0.45, 0.55, 0.25, 0.78, 0.06, 0.09, 0.78, 0.59, 0.6, 0.35, 0.46, 0.91, 0.96, 0.01, 0.58, 0.83, 0.03, 0.79]
boarding_duration = 2 #SET
alighting_duration = 2 #SET
weights_list = generateWeights(orig_df2, numStops1, input_key_stops) #[0.7, 0.75, 0.55, 0.55, 0.5, 0.55, 0.55, 0.55, 0.5, 0.75, 0.55, 0.6000000000000001, 0.55, 0.55, 0.55, 0.8, 0.6000000000000001, 0.5, 0.5, 0.55, 0.5, 0.75, 0.6000000000000001, 0.55, 0.55, 0.55, 0.55, 0.7, 0.5, 0.5, 0.55, 0.55, 0.5, 0.55, 0.8000000000000003, 0.55, 0.55, 0.6000000000000001, 0.8500000000000001, 0.55, 0.6000000000000001]
bus_availability_list = [72000, 72000, 72000, 72000]  #getBusAvailability(subsetTimings,date)
initial_passengers_list = generateInitialPassengers(orig_df2, numStops1, input_key_stops) #[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
max_allowed_deviation = 600 #SET
target_headway_2dlist = generateTargetHeadways(tripHeadways, targetHeadway, expectedNumSequence) #SET
interstation_travel_2dlist = getInterstation(subsetTimings)


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