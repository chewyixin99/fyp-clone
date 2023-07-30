class Stop():
    def __init__(self, id: str, name: str, coordinates: list, weight: float, num_passengers: int):
        self.id = id
        self.name = name
        self.coordinates = coordinates
        self.weight = weight
        self.num_passengers = num_passengers

    def __repr__(self):
        return f'Bus Stop Id: {self.id} AKA {self.name}\n \
                Coordinates: {self.coordinates}\n \
                Bus weight assigned: {self.weight}\n \
                Number of waiting passengers: {self.num_passengers}'
