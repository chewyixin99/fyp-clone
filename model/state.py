import copy
import numpy.random as random
import time as timer

from bus import Bus
from stop import Stop
# from alns import State
from parameters import *


class Simulation():

    def __init__(self, stops: list[Stop], buses: list[Bus]):
        self.stops = stops
        self.buses = buses

    def copy(self):
        return copy.deepcopy(self)

    def can_assign(self):
        return None

    def assign_time(self):
        return None

    def remove_time(self):
        return None

    def initialise(self, seed=None): 
        # init random seed
        if seed is None:
            seed = 42
        random.seed(seed)

        return None

    def objective(self):
        return None