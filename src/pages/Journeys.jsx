import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect, useRef } from "react";
import Journey from "../components/Journey";
import { stopObjs } from "../data/constants";

const Journeys = () => {
  const [totalDistance, setTotalDistance] = useState(3100);
  const [relativeFactor, setRelativeFactor] = useState(50); // affects bus speed -> how many times faster than actual speed
  const [RDPPM, setRDPPM] = useState(0);
  const [triggerRun, setTriggerRun] = useState(false);
  const [triggerPause, setTriggerPause] = useState(false); // if bus is at bus stop, stop adding travel distance
  const [formattedBusStopDistance, setFormattedBusStopDistance] = useState([]); // if bus is at bus stop, stop adding travel distance
  const travelRef = useRef(null);
  const update_rate = 1; // affects bar update -> smoothness of animation
  const route_bar_width = 1400 ; //  simulator route bar width in pixels
  const [busStopDistance, setBusStopDistance] = useState([]); // if bus is at bus stop, stop adding travel distance
  var runRef = null;
  const [busStopData, setBusStopData] = useState([]);
  // const [busStopData, setBusStopData] = useState([
  //   {
  //     bus_stop_id: "1",
  //     bus_stop_name: "Bus Stop 1",
  //     bus_stop_relative_distance: 200,
  //     bus_stop_duration: 1000,
  //   },
  //   {
  //     bus_stop_id: "2",
  //     bus_stop_name: "Bus Stop 2",
  //     bus_stop_relative_distance: 1000,
  //     bus_stop_duration: 2000,
  //   },
  //   {
  //     bus_stop_id: "3",
  //     bus_stop_name: "Bus Stop 3",
  //     bus_stop_relative_distance: 1500,
  //     bus_stop_duration: 1000,
  //   },
  //   {
  //     bus_stop_id: "4",
  //     bus_stop_name: "Bus Stop 4",
  //     bus_stop_relative_distance: 1800,
  //     bus_stop_duration: 2000,
  //   },
  // ]);

  const formatDistance = (data) => {
    return parseFloat(((data / totalDistance) * 100).toFixed(2));
  };

  const formatBusStopDistance = (data) => {
    var format_data = data.map((item) => 
      formatDistance(item.stopRelativeDistance)
    );
    console.log(format_data);
    setFormattedBusStopDistance(format_data);
  };

  const running_function = () => {
    runRef = setInterval(() => {
      var relative_distance_travelled = Number(
        parseFloat(
          document.querySelector(".route-travelled").style.width.split("%")[0]
        ).toFixed(2)
      );
      setDistanceTravelled(relative_distance_travelled);
      console.log(formattedBusStopDistance);
      if (
        formattedBusStopDistance.includes(
          relative_distance_travelled.toString()
        )
      ) {
        var item = busStopData.filter((item) => {
          return (
            relative_distance_travelled.toString() ==
            formatDistance(item.stopRelativeDistance)
          );
        });
        var duration = item[0].bus_stop_duration;
        clearInterval(runRef);
        setTimeout(() => {
          add_travel_distance(RDPPM);
          running_function();
        }, duration);
      }
      add_travel_distance(RDPPM);
    }, 1);
  };

  useEffect(() => {
    getDistanceBetweenStops(stopObjs);
  }, []);
  useEffect(() => {
    formatBusStopDistance(busStopData);
    loadBusStops();
  }, [busStopDistance]);

  // useEffect(() => {
  //   if (triggerRun) {
  //     running_function();
  //   }
  //   return () => clearInterval(runRef);
  // }, [triggerRun, triggerPause]);

  // const add_travel_distance = (relative_speed) => {
  //   if (!triggerPause) {
  //     travelRef.current.style.width =
  //       (
  //         parseFloat(travelRef.current.style.width.split("%")[0]) +
  //         relative_speed
  //       ).toString() + "%";
  //   }
  // };

  const loadBusStops = () => {
    var busStopHTML = `<div class="bus-stop" style="left:0px">&nbsp;</div>`;
    for (var i = 0; i < busStopData.length; i++) {
      var relative_distance_percentage =
        (busStopData[i].stopRelativeDistance / totalDistance) * 100;
      var relative_distance =
        (route_bar_width * relative_distance_percentage) / 100;
      busStopHTML += `<div class="bus-stop" style="left:${relative_distance}px">&nbsp;</div>`;
    }

    for (var i = 0; i < 5; i++) {
      document.querySelector(`.bus-stop-${i}`).innerHTML += busStopHTML;
    }
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in kilometers
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in KM
    return d;
  };

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  const getDistanceBetweenStops = (stopObjs) => {
    var busStopData = [];
    // {
    //   bus_stop_id: "1",
    //   bus_stop_name: "Bus Stop 1",
    //   bus_stop_relative_distance: 200,
    //   bus_stop_duration: 1000,
    // },
    var totalDistance = 0;
    var distanceBetweenStops = [];
    var current = 0;
    for (var i = 0; i < stopObjs.length - 1; i++) {
      var distance = getDistanceFromLatLonInKm(
        stopObjs[i].lat,
        stopObjs[i].lng,
        stopObjs[i + 1].lat,
        stopObjs[i + 1].lng
      );

      distanceBetweenStops.push(distance * 1000);
      totalDistance += distance;

      var sum = distanceBetweenStops.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, 0);

      busStopData.push({
        stopId: stopObjs[i].stopId,
        stopName: stopObjs[i].stopName,
        stopRelativeDistance: sum,
        stopDuration: 20000,
      });
    }
    setTotalDistance(Number(totalDistance * 1000).toFixed(2));
    setBusStopDistance(distanceBetweenStops);
    setBusStopData(busStopData);
  };

  return (
    <div className="container">
      <div className="row operations-container">
        <p class="text-3xl font-bold text-gray-900 dark:text-white">
          Total Distance = {totalDistance}m
        </p>
        <input
            type="range"
            id="relative_factor"
            name="relative_factor"
            min="1"
            max="50"
            onChange={(e) => {
              setRelativeFactor(e.target.value);
            }}
          />
          <p>{relativeFactor}</p>
          <label for="relative_factor">Speed Up (Up to 50x)</label>
        <div className="bus-operations">
          Bus Operations (Imagine Gantt chart where this component represents
          the task while the route represents the dates)
          {Array.from(Array(5), (e, i) => {
            return (
              <Journey
                id={i.toString()}
                busStopData={busStopData}
                totalDistance={totalDistance}
                route_bar_width={route_bar_width}
                formattedBusStopDistance={formattedBusStopDistance}
                relativeFactor={relativeFactor}
              />
            );
          })}
        </div>
      </div>
      <div className="row p-4">
        <p class="text-3xl font-bold text-gray-900 dark:text-white">
          Bus Stop Timings (ms)
        </p>
        <form>
          <div class="grid gap-6 mb-6 md:grid-cols-2">
            {busStopData?.map((item) => (
              <div>
                <label
                  for={`bus_stop_id_${item.stopId}`}
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {item.stopName}
                </label>
                <label
                  for={`bus_stop_id_${item.stopId}`}
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Relative Distance from Start: {item.stopRelativeDistance}m or{" "}
                  {formatDistance(item.stopRelativeDistance)}% of the total
                  distance
                </label>
                <input
                  type="text"
                  id={`bus_stop_id_${item.stopId}`}
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-25 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  value={item.stopDuration}
                  onChange={(e) => {
                    var new_bus_stop_data = busStopData.map((bus_stop) => {
                      if (bus_stop.stopId == item.stopId) {
                        bus_stop.stopDuration = e.target.value;
                      }
                      return bus_stop;
                    });
                    setBusStopData(new_bus_stop_data);
                  }}
                />
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Journeys;
