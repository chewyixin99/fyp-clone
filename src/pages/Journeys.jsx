import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect } from "react";
import Journey from "../components/Journey";
import { stopObjs } from "../data/constants";

const Journeys = () => {
  const [totalDistance, setTotalDistance] = useState(3100);
  const [relativeFactor, setRelativeFactor] = useState(20); // affects bus speed -> how many times faster than actual speed
  const [calibrationFactor, setCalibrationFactor] = useState(4); 
  const route_bar_width = 1300; //  simulator route bar width in pixels
  const [busStopData, setBusStopData] = useState([]);
  const [newBusStopData, setNewBusStopData] = useState([]);
  const [busSpeed, setBusSpeed] = useState(60);

  // convert string distance to float rounded off to 2 decimal place
  const formatDistance = (data) => {
    return parseFloat(((data / totalDistance) * 100).toFixed(2));
  };
  // get a list of formatted relative bus stop distances from start
  const formatBusStopDistance = (data) => {
    console.log(data);
    var format_data = data.map((item) =>
      formatDistance(item.stopRelativeDistance)
    );
    var temp = data;
    for (var i = 0; i < busStopData.length; i++) {
      temp[i].stopPercentDistance = format_data[i];
    }
    setNewBusStopData(temp);
  };
  // add bus stops onto HTML
  const loadBusStops = () => {
    var busStopHTML = `<div class="bus-stop" style="left:-8px">&nbsp;</div>`;
    var busStopDotHTML = `<div class="bus-stop-dot" style="left:-4.3px">&nbsp;</div>`;
    // var busStopTipHTML = `<div class="progress-tip" style="left:-4.3px">&nbsp;</div>`;
    for (var i = 0; i < newBusStopData.length; i++) {
      var relative_distance_percentage =
        (newBusStopData[i].stopRelativeDistance / totalDistance) * 100;
      var relative_distance =
        (route_bar_width * relative_distance_percentage) / 100;
      busStopHTML += `<div class="bus-stop" style="left:${
        relative_distance - 8.5
      }px">&nbsp;</div>`;
      busStopDotHTML += `<div class="bus-stop-dot" style="left:${
        relative_distance - 4.3
      }px">
        <div class="group relative">
          <button class="bus-stop-dot"></button>
          <span class="pointer-events-none max-w-xs absolute text-sm text-white bg-gray-700 p-2 rounded-lg -top-32 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
            ID: ${newBusStopData[i].stopId}
            <br />
            Name: ${newBusStopData[i].stopName}
            <br />
            Distance: ${newBusStopData[i].stopRelativeDistance.toFixed(0)}m / ${
        newBusStopData[i].stopPercentDistance
      }%
          </span>
        </div>
      </div>`;
    }

    for (var i = 0; i < 5; i++) {
      document.querySelector(`.bus-stop-${i}`).innerHTML += busStopHTML;
      document.querySelector(`.bus-stop-dot-${i}`).innerHTML += busStopDotHTML;
    }
  };
  // get distance between two coordinates in km
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
  // helper function for getDistanceFromLatLonInKm
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  // create bus stop data with formatted relative distance
  // get total distance of route
  const getBusStopData = (stopObjs) => {
    var busStopData = [];
    var totalDistance = 0;
    var distanceBetweenStops = [];
    var current = 0;
    var sum;
    console.log(stopObjs);
    // first fencepost
    busStopData.push({
      stopId: stopObjs[0].stopId,
      stopName: stopObjs[0].stopName,
      stopRelativeDistance: 0,
      stopDuration: 0,
    });

    for (var i = 1; i < stopObjs.length; i++) {
      var distance = getDistanceFromLatLonInKm(
        stopObjs[i - 1].lat,
        stopObjs[i - 1].lng,
        stopObjs[i].lat,
        stopObjs[i].lng
      );

      distanceBetweenStops.push(distance * 1000);
      totalDistance += distance;

      sum = distanceBetweenStops.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, 0);

      busStopData.push({
        stopId: stopObjs[i].stopId,
        stopName: stopObjs[i].stopName,
        stopRelativeDistance: sum,
        stopDuration: 10000,
      });
    }

    sum = distanceBetweenStops.reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);

    setTotalDistance(Number(totalDistance * 1000).toFixed(0));
    console.log(busStopData);
    setBusStopData(busStopData);
  };
  // load data from constants.js into getBusStopData
  useEffect(() => {
    getBusStopData(stopObjs);
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
  }, []);
  // get list of formatted relative bus stop distances
  useEffect(() => {
    console.log(busStopData);
    formatBusStopDistance(busStopData);
    // load bus stops
  }, [busStopData]);
  useEffect(() => {
    loadBusStops();
  }, [newBusStopData]);

  return (
    <div className="container">
      <div className="row operations-container">
        <p class="text-3xl font-bold text-gray-900 dark:text-white">
          Bus Operations
        </p>

        <div className="bus-operations">
          <p class="text-2md font-bold text-gray-900 dark:text-white">
            Configurations
          </p>
          <div className="configuration-panel">
              <div className="configuration-panel-item">
                <label
                  for={`bus_speed`}
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {`Bus Speed: ${busSpeed}km/h`}
                </label>
                <input
                  type="range"
                  id="bus_speed"
                  name="bus_speed"
                  value={busSpeed}
                  min="10"
                  max="80"
                  onChange={(e) => {
                    setBusSpeed(e.target.value);
                  }}
                />
              </div>
              <div className="configuration-panel-item">
                <label
                  for={`relative_factor`}
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {`Relative Factor: ${relativeFactor}`}
                </label>
                <input
                  type="range"
                  id="relative_factor"
                  name="relative_factor"
                  min="1"
                  max="50"
                  value={relativeFactor}
                  onChange={(e) => {
                    setRelativeFactor(e.target.value);
                  }}
                />
              </div>
              <div className="configuration-panel-item">
                <label
                  for={`calibration_factor`}
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {`Calibration Factor: ${calibrationFactor}`}
                </label>
                <input
                  type="range"
                  id="calibration_factor"
                  name="calibration_factor"
                  min="1"
                  max="10"
                  value={calibrationFactor}
                  onChange={(e) => {
                    setCalibrationFactor(e.target.value);
                  }}
                />
              </div>
              <div className="configuration-divider"/>
              <div className="configuration-panel-item">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  {`Bus Number : 84`}
                </label>
              </div>
              <div className="configuration-panel-item">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  {`City: Portland`}
                </label>
              </div>
              <div className="configuration-panel-item">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  {`Total Distance : ${totalDistance}m`}
                </label>
              </div>
              <div className="configuration-panel-item">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  {`Number of Bus Stops: 39`}
                </label>
              </div>
          </div>

          {Array.from(Array(5), (e, i) => {
            return (
              <Journey
                id={i.toString()}
                busStopData={newBusStopData}
                totalDistance={totalDistance}
                route_bar_width={route_bar_width}
                relativeFactor={relativeFactor}
                busSpeed={busSpeed}
                calibrationFactor={calibrationFactor}
              />
            );
          })}
        </div>
      </div>
      <div className="row operations-container">
      <p class="text-3xl font-bold text-gray-900 dark:text-white">
          Bus Stop Timings (ms)
        </p>
        <div className="bus-operations bus-timings">
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
    </div>
  );
};

export default Journeys;
