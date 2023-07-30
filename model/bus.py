from stop import Stop

class Bus():
    def __init__(self, id: str, svc_number: str, direction: int, capacity: int, load: int, location: Stop):
        self.id = id
        self.svc_number = svc_number
        self.direction = direction
        self.capacity = capacity
        self.load = load
        self.location = location

    def __repr__(self):
        return f'Bus Id: {self.id}\n \
                Service number: {self.svc_number}\n \
                Direction: {self.direction}\n \
                Capacity: {self.capacity}\n \
                Load: {self.load}\n \
                Current location: {self.location}'