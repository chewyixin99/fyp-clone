import math
from typing import List, Tuple

def calculate_haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculates the Haversine distance between two geographical points.

    This function computes the great-circle distance between two points on the surface of a sphere 
    (in this context, the Earth). Given their longitudes and latitudes, it utilizes the Haversine formula 
    to provide an accurate estimate of the distance between them in metres.

    Args:
        coord1 (tuple): A tuple containing the latitude and longitude (in degrees) of the first point.
            Example: (40.7128, -74.0060) for New York City.

        coord2 (tuple): A tuple containing the latitude and longitude (in degrees) of the second point.

    Returns:
        float: The Haversine distance between the two provided points in metres.

    Note:
        The radius of the Earth is approximated as the mean radius, 6371.0 kilometres.
    """

    lat1, lon1 = coord1
    lat2, lon2 = coord2

    # Convert latitude and longitude from degrees to radians
    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    # Radius of the Earth in kilometres
    earth_radius = 6371.0  # This is the mean radius of the Earth
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    # Calculate the distance in kilometres
    distance = earth_radius * c
    distance_in_metres = distance * 1000
    
    return distance_in_metres

def split_line_between_coordinates(coord1: Tuple[float, float], coord2: Tuple[float, float], n: int) -> List[Tuple[float, float]]:
    """
    Splits the line between two geographical coordinates into segments and returns the intermediate coordinates.

    This function takes two geographical points and an integer n, and calculates n-1 intermediate (equally-spaced) coordinates 
    along the straight line connecting the given points. The latitude and longitude differences between the 
    points are divided by n to determine the location of each intermediate point. 

    The resulting list does not include the start and end coordinates, so the length of the list will be (n-1).

    Args:
        coord1 (tuple): A tuple containing the latitude and longitude (in degrees) of the first point.
            Example: (40.7128, -74.0060) for New York City.

        coord2 (tuple): A tuple containing the latitude and longitude (in degrees) of the second point.

        n (int): The number of segments the line should be divided into. Determines the number of intermediate
            coordinates to be calculated.

    Returns:
        list: A list of tuples, where each tuple contains the latitude and longitude (in degrees) of an 
            intermediate point. The list will contain n-1 intermediate coordinates.

    Note:
        - The function calculates intermediate points along a straight line in the latitude-longitude space,
          not along the great-circle path between the points.
        - If n is less than or equal to 1, the function will return an empty list.
    """

    lat1, lon1 = coord1
    lat2, lon2 = coord2

    # Calculate the differences in latitude and longitude
    dlat = (lat2 - lat1) / n
    dlon = (lon2 - lon1) / n

    # Initialize a list to store intermediate coordinates
    intermediate_coordinates = []

    # Calculate n-1 intermediate coordinates
    for i in range(1, n):
        intermediate_lat = lat1 + i * dlat
        intermediate_lon = lon1 + i * dlon
        intermediate_coordinates.append((intermediate_lat, intermediate_lon))

    return intermediate_coordinates