import math

def calculate_haversine_distance(coord1: tuple, coord2: tuple) -> float:
    """
    Calculate the Haversine distance between two points on the Earth's surface.
    
    :param coord1: Tuple containing latitude and longitude of the first point (in degrees)
    :param coord2: Tuple containing latitude and longitude of the second point (in degrees)
    
    :return: Haversine distance in metres
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

def split_line_between_coordinates(coord1, coord2, n):
    """
    Split the line between two sets of latitude and longitude coordinates into n equal parts.
    
    :param coord1: Tuple containing latitude and longitude of the first point (in degrees)
    :param coord2: Tuple containing latitude and longitude of the second point (in degrees)
    :param n: Number of segments to split the line into
    
    :return: List of n-1 intermediate coordinates
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