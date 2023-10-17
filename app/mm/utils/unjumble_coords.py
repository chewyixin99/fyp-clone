import numpy as np
import pandas as pd
import plotly.express as px
import json

def find_nearest(current_index, coordinates, visited):
    min_distance = float('inf')
    nearest_index = -1
    for i, coord in enumerate(coordinates):
        if i not in visited:
            dist = np.linalg.norm(np.array(coord) - np.array(coordinates[current_index]))
            if dist < min_distance:
                min_distance = dist
                nearest_index = i
    return nearest_index

def greedy_order(coordinates):
    visited = set()
    current_index = 0
    ordered_indices = [current_index]
    visited.add(current_index)
    
    while len(visited) < len(coordinates):
        current_index = find_nearest(current_index, coordinates, visited)
        ordered_indices.append(current_index)
        visited.add(current_index)
    
    return ordered_indices

coordinates_list = [
        [
            45.504618,
            -122.441835
        ],
        [
            45.504572,
            -122.462292
        ],
        [
            45.504423,
            -122.560019
        ],
        [
            45.504221,
            -122.53817
        ],
        [
            45.50417,
            -122.529723
        ],
        [
            45.504167,
            -122.525128
        ],
        [
            45.504233,
            -122.516993
        ],
        [
            45.504694,
            -122.496144
        ],
        [
            45.504699,
            -122.484379
        ],
        [
            45.504859,
            -122.639912
        ],
        [
            45.504842,
            -122.634513
        ],
        [
            45.504824,
            -122.630064
        ],
        [
            45.504846,
            -122.62304
        ],
        [
            45.505446,
            -122.594449
        ],
        [
            45.505058,
            -122.579137
        ],
        [
            45.504706,
            -122.575383
        ],
        [
            45.528015,
            -122.675854
        ],
        [
            45.508043,
            -122.679711
        ],
        [
            45.520931,
            -122.677521
        ],
        [
            45.517604,
            -122.679316
        ],
        [
            45.504343,
            -122.51018
        ],
        [
            45.525725,
            -122.676441
        ],
        [
            45.504573,
            -122.449019
        ],
        [
            45.505324,
            -122.618403
        ],
        [
            45.514267,
            -122.681095
        ],
        [
            45.504577,
            -122.567451
        ],
        [
            45.502618,
            -122.671791
        ],
        [
            45.506602,
            -122.663155
        ],
        [
            45.510133,
            -122.682088
        ],
        [
            45.503106,
            -122.418964
        ],
        [
            45.503543,
            -122.426109
        ],
        [
            45.504597,
            -122.436563
        ],
        [
            45.504692,
            -122.477085
        ],
        [
            45.504701,
            -122.490105
        ],
        [
            45.504523,
            -122.502125
        ],
        [
            45.504276,
            -122.54419
        ],
        [
            45.50432,
            -122.548804
        ],
        [
            45.505466,
            -122.586166
        ],
        [
            45.50541,
            -122.602547
        ],
        [
            45.505374,
            -122.610346
        ],
        [
            45.504888,
            -122.645979
        ],
        [
            45.504921,
            -122.655159
        ]
    ]
stop_ids_list= [
        "1316",
        "1334",
        "1360",
        "1381",
        "1387",
        "1390",
        "1396",
        "1416",
        "1423",
        "1442",
        "1448",
        "1452",
        "1459",
        "1482",
        "1499",
        "1501",
        "3007",
        "3398",
        "7797",
        "7800",
        "9263",
        "9300",
        "9425",
        "10613",
        "11486",
        "13298",
        "13733",
        "13773",
        "13780",
        "14232",
        "14233",
        "14234",
        "14235",
        "14236",
        "14237",
        "14238",
        "14239",
        "14240",
        "14241",
        "14242",
        "14243",
        "14244"]

stop_names_list = [
        "NW Division & Civic Dr",
        "NW Division & Eastwood Ave",
        "SE Division & 101st Ave",
        "SE Division & 122nd Ave",
        "SE Division & 130th Ave",
        "SE Division & 135th Ave",
        "SE Division & 142nd Ave",
        "SE Division & 162nd Ave",
        "SE Division & 174th Ave",
        "SE Division & 26th Ave",
        "SE Division & 30th Ave",
        "SE Division & 34th Ave",
        "SE Division & Cesar Chavez Blvd",
        "SE Division & 67th Ave",
        "SE Division & 82nd Ave",
        "SE Division & 85th Ave",
        "NW Irving & 5th",
        "SW Lincoln & 1st",
        "SW 6th & Harvey Milk",
        "SW 6th & Taylor",
        "SE Division & 148th Ave",
        "NW 6th & Flanders",
        "NW Division & Angeline Ave",
        "SE Division & 43rd Ave",
        "SW 6th & Columbia",
        "SE Division & SE Division St MAX Station",
        "South Waterfront/S Moody",
        "OMSI/SE Water",
        "SW Hall & 5th",
        "Cleveland Ave Park & Ride",
        "Gresham Central Transit Center",
        "Gresham City Hall Park & Ride",
        "18000 Block SE Division",
        "SE Division & 168th Ave",
        "SE Division & 157th Ave",
        "SE Division & 116th Ave",
        "11100 Block SE Division",
        "SE Division & 75th Ave",
        "SE Division & 59th Ave",
        "SE Division & 51st Ave",
        "SE Division & 20th Ave",
        "SE Division & 11th Ave"
]
ordered_indices = greedy_order(coordinates_list)

# Re-order the lists based on the greedy approach
ordered_coordinates = [coordinates_list[i] for i in ordered_indices]
ordered_stop_ids = [stop_ids_list[i] for i in ordered_indices]
ordered_stop_names = [stop_names_list[i] for i in ordered_indices]

# Convert the ordered coordinates list to a DataFrame for plotting
df_ordered = pd.DataFrame(ordered_coordinates, columns=["Latitude", "Longitude"])

# Plot the ordered route
fig = px.line_mapbox(df_ordered, lat="Latitude", lon="Longitude", 
                     mapbox_style="carto-positron", 
                     zoom=10, 
                     title="Ordered Route Plot using Greedy Approach")

fig.show()

# Print the ordered coordinates, stop ids, and stop names in the desired format
formatted_data = {
    "coordinates_list": ordered_coordinates,
    "stop_ids_list": ordered_stop_ids,
    "stop_names_list": ordered_stop_names
}
# Using json.dumps for pretty printing with double quotes
formatted_output = json.dumps(formatted_data, indent=4)
print(formatted_output)