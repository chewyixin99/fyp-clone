// eslint-disable-next-line no-unused-vars
import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect } from "react";
import Journey from "../components/Journey";
import { stopObjsBefore } from "../data/constants";

const stopObjs = stopObjsBefore;

const Journeys = () => {
  const [totalDistance, setTotalDistance] = useState(3100);
  const [relativeFactor, setRelativeFactor] = useState(20); // affects bus speed -> how many times faster than actual speed
  const route_bar_width = 1600; //  simulator route bar width in pixels
  const [busStopData, setBusStopData] = useState([]);
  const [newBusStopData, setNewBusStopData] = useState([]);

  // convert string distance to float rounded off to 2 decimal place
  const formatDistance = (data) => {
    return parseFloat(((data / totalDistance) * 100).toFixed(2));
  };
  // get a list of formatted relative bus stop distances from start
  const formatBusStopDistance = (data) => {
    // console.log(data);
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

    for (let i = 0; i < 1; i++) {
      // document.querySelector(`.bus-stop-${i}`).innerHTML += busStopHTML;
      // document.querySelector(`.bus-stop-dot-${i}`).innerHTML += busStopDotHTML;
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
    var sum;
    // console.log(stopObjs);
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
    // console.log(busStopData);
    setBusStopData(busStopData);
  };
  // load data from constants.js into getBusStopData
  useEffect(() => {
    getBusStopData(stopObjs);
  }, []);
  // get list of formatted relative bus stop distances
  useEffect(() => {
    // console.log(busStopData);
    formatBusStopDistance(busStopData);
    // load bus stops
  }, [busStopData]);
  useEffect(() => {
    loadBusStops();
  }, [newBusStopData]);

  return (
    <div className="mx-auto">
      <div className="row operations-container">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          Bus Operations
        </p>

        <div className="bus-operations">
          <p className="text-2md font-bold text-gray-900 dark:text-white">
            Details
          </p>
          <div className="configuration-panel">
            <div className="configuration-panel-item">
              <label
                htmlFor={`relative_factor`}
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
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

            <div className="configuration-divider" />
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`Bus Number : 84`}
              </label>
            </div>
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`City: Portland`}
              </label>
            </div>
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`Total Distance : ${totalDistance}m`}
              </label>
            </div>
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`Number of Bus Stops: 39`}
              </label>
            </div>
          </div>

          {Array.from(Array(1), (e, i) => {
            return (
              <Journey
                key={i.toString()}
                id={i.toString()}
                busStopData={newBusStopData}
                totalDistance={totalDistance}
                route_bar_width={route_bar_width}
                relativeFactor={relativeFactor}
                busSpeed={60}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Journeys;
