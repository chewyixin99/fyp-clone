/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import BusStop from "./BusStop";
import { num_trips, num_stops } from "/public/v1_0CVXPY_optimised_output.json"
import { bus_stop_data } from "/public/bus_stop_data.json"

const Journey = ({
  start,
  paused,
  ended,
  data,
  globalTime,
  id,
  triggerParentSave,
  setBusStopData,
}) => {
  const [totalDistance, setTotalDistance] = useState(3100);
  const route_bar_width = 1600;
  const [relativeStopDistance, setRelativeStopDistance] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [triggerStart, setTriggerStart] = useState(false);
  const [triggerStop, setTriggerStop] = useState(false);
  const [busDispatchTimestamps, setBusDispatchTimestamps] = useState({});
  const [dataObj, setDataObj] = useState({});
  const [deployedTrips, setDeployedTrips] = useState([]);
  const [headwayObj, setHeadwayObj] = useState({});
  const [saveHeadwayObj, setSaveHeadwayObj] = useState({});

  const distanceDataLoader = (data) => {    
    var output = data.map((item) => {
      return {
        stopId: item.stopId,
        stopName: item.stopName,
        busStopNo: item.busStopNo,
        distance: item.distance,
      }});
      setRelativeStopDistance(output)
      setTotalDistance(output[output.length - 1]?.distance);
      setBusStopData(output)
  }
  

  const loadBusStops = () => {
    var busStopHTML = ``;
    var busStopDotHTML = ``;
    var tempBusData = [];
    for (var i = 0; i < relativeStopDistance.length; i++) {
      tempBusData.push([
        relativeStopDistance[i].busStopNo,
        relativeStopDistance[i].stopId,
      ]);

      var relative_distance_percentage =
        (relativeStopDistance[i]?.distance / totalDistance) * 100;
      var relative_distance =
        (route_bar_width * relative_distance_percentage) / 100;
      busStopHTML += `<div class="bus-stop" style="left:${
        relative_distance - 8.5
      }px">&nbsp;</div>`;
      busStopDotHTML += `<div class="bus-stop-dot" style="left:${
        relative_distance - 3.5
      }px">
        <div class="group relative">
          <button class="bus-stop-dot"></button>
          <span class="pointer-events-none max-w-xs absolute text-sm text-white bg-gray-700 p-2 rounded-lg -top-42 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
            ID: ${relativeStopDistance[i]?.stopId}
            <br />
            Name: ${relativeStopDistance[i]?.stopName}
            <br />
            Distance: ${relativeStopDistance[i]?.distance.toFixed(
              0
            )}m / ${totalDistance.toFixed(
        0
      )}m (${relative_distance_percentage.toFixed(0)}%)
          <br />
            Headway: <span class="headway-ref-${id}-${
        relativeStopDistance[i]?.busStopNo
      }">-</span>
          </span>
        </div>
      </div>`;
    }
    if (id == 1) {
      // setBusStopData(tempBusData);
    }
    document.querySelector(`.bus-stop-ref-${id}`).innerHTML += busStopHTML;
    document.querySelector(`.bus-stop-dot-ref-${id}`).innerHTML +=
      busStopDotHTML;
  };

  const formatDistance = (data) => {
    return parseFloat(((data / totalDistance) * 100).toFixed(2));
  };

  const convert_seconds_to_time = (seconds) => {
    if (seconds == null) return "-";
    let min = Math.floor(seconds / 60);
    let sec = seconds % 60;
    return min + "m " + sec + "s";
  };

  const createDataObj = (data) => {
    var dataObj = {};
    data.map((item) => {
      if (item.timestamp in dataObj) {
        dataObj[item.timestamp].push(item);
      } else {
        dataObj[item.timestamp] = [item];
      }
    });

    return dataObj;
  };

  const newRunFunction = (dataObj, localCount) => {
    var data = dataObj;

    if (data[localCount] != undefined) {
      for (var i = 0; i < data[localCount].length; i++) {
        if (data[localCount][i].currentStatus == "TRANSIT_TO") {
          add_travel_distance(
            data[localCount][i].distance,
            data[localCount][i].busTripNo,
            data[localCount][i].timestamp
          );
        } else if (
          data[localCount][i].currentStatus == "STOPPED_AT" &&
          formatDistance(data[localCount][i].distance) == 100
        ) {
          add_travel_distance(
            totalDistance,
            data[localCount][i].busTripNo,
            data[localCount][i].timestamp
          );
        } else if (data[localCount][i].currentStatus == "DWELL_AT") {
          add_travel_distance(
            data[localCount][i].distance,
            data[localCount][i].busTripNo,
            data[localCount][i].timestamp
          );
        } else if (data[localCount][i].currentStatus == "DISPATCHED_FROM") {
          let currentObj = busDispatchTimestamps;
          currentObj[data[localCount][i].busTripNo] =
            data[localCount][i].timestamp;
          setBusDispatchTimestamps(currentObj);

          add_travel_distance(
            data[localCount][i].distance,
            data[localCount][i].busTripNo,
            data[localCount][i].timestamp
          );

          var temp = deployedTrips;
          temp.push(data[localCount][i].busTripNo);
          setDeployedTrips(temp);
        }
      }
    }
  };

  const add_travel_distance = (newDistance, tripNo, timestamp) => {
    var progressTip = document.querySelector(
      `.progress-tip-ref-${id}-${tripNo}`
    );
    var progressTipContent = document.querySelector(
      `.progress-tip-content-ref-${id}-${tripNo}`
    );
    var progressTipContentDist = document.querySelector(
      `.progress-tip-content-dist-ref-${id}-${tripNo}`
    );
    var progressTipContentElapsedTime = document.querySelector(
      `.progress-tip-content-elapsed-time-ref-${id}-${tripNo}`
    );
    progressTip.style.left = formatDistance(newDistance) + "%";
    progressTipContent.style.left = formatDistance(newDistance) - 2.7 + "%";
    progressTipContentDist.innerHTML =
      "Dist.: " +
      newDistance.toFixed(0) +
      "m / " +
      formatDistance(newDistance).toFixed(0) +
      "%";

    let elapsedSeconds = timestamp - busDispatchTimestamps[tripNo];
    progressTipContentElapsedTime.innerHTML =
      convert_seconds_to_time(elapsedSeconds);
  };

  const startRun = () => {
    setIsRunning(true);
    setTriggerStart(true);
    setTriggerStop(false);
  };

  const pause = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (triggerStart) {
        setIsRunning(true);
      }
    }
  };

  const stop = () => {
    setIsRunning(false);
    setTriggerStart(false);
    setTriggerStop(true);
    for (var i = 1; i <= num_trips; i++) {
      add_travel_distance(0, i, busDispatchTimestamps[i]);
    }
  };

  const updateLink = () => {
    triggerParentSave(saveHeadwayObj, id);
  };

  const updateHeadway = (headway, stopId, busStopNo, tripNo, numBusPast) => {
    if (headway != 0) {
      var current = headwayObj;
      var currentSave = saveHeadwayObj;
      if (numBusPast == num_trips) {
        current[busStopNo] = null;
        setHeadwayObj(current);
        return;
      }
      // does not overwrite past headway
      currentSave[[tripNo, busStopNo]] = headway;
      setSaveHeadwayObj(currentSave);
      updateLink();
      // overwrites past headway if new bus comes through
      current[busStopNo] = headway;
      setHeadwayObj(current);

      var headwayref = document.querySelector(
        `.headway-ref-${id}-${busStopNo}`
      );
      if (headwayref != null) {
        headwayref.innerHTML = convert_seconds_to_time(headway);
      }
    }
  };
  useEffect(() => {}, [saveHeadwayObj]);
  useEffect(() => {
    distanceDataLoader(bus_stop_data);
    setDataObj(createDataObj(data));
  }, [data]);

  useEffect(() => {
    loadBusStops();
  }, [relativeStopDistance, totalDistance, num_trips]);

  useEffect(() => {
    if (start) {
      startRun();
    }
  }, [start]);

  useEffect(() => {
    pause();
  }, [paused]);

  useEffect(() => {
    if (ended) {
      setTriggerStop(true);
      stop();
    }
  }, [ended]);

  useEffect(() => {
    console.log("line data parse completed...");
  }, [dataObj]);

  useEffect(() => {
    if (isRunning) {
      newRunFunction(dataObj, globalTime);
    }
  }, [globalTime, dataObj, isRunning]);

  return (
    <div className="mx-auto">
      <div className="control-panel">
        {/* <div className="sm:flex gap-2 justify-center">
          <button
            onClick={startRun}
            id={`run_simulation`}
            type="button"
            className={`run_simulation inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="bi bi-play-fill"
              viewBox="0 0 16 16"
            >
              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
            </svg>
          </button>
          <button
            onClick={stop}
            id={`stop_simulation`}
            type="button"
            className={`stop_simulation hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="bi bi-stop-fill"
              viewBox="0 0 16 16"
            >
              <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z" />
            </svg>
          </button>
          <button
            onClick={pause}
            id={`pause_simulation`}
            type="button"
            className={`pause_simulation hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            {isRunning ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-pause-fill"
                viewBox="0 0 16 16"
              >
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-play-fill"
                viewBox="0 0 16 16"
              >
                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
              </svg>
            )}
          </button>
        </div> */}
      </div>
      <div className="route-container">
        <div className="route-bar">
          <div
            className={`route-travelled-ref route-travelled`}
            style={{ width: "0%" }}
          >
            &nbsp;
          </div>
          {[...Array(num_trips)].map((x, i) => (
            <div key={[...Array(num_trips)].length - i}>
              <div
                className={`progress-tip-ref-${id}-${
                  [...Array(num_trips)].length - i
                } progress-tip`}
                style={{ left: "0%" }}
              ></div>
              <div
                className={`progress-tip-content-ref-${id}-${
                  [...Array(num_trips)].length - i
                } progress-tip-content`}
                style={{ left: "-2.7%" }}
              >
                Trip No.:{" "}
                {triggerStart
                  ? triggerStop
                    ? "-"
                    : `${[...Array(num_trips)].length - i}`
                  : "-"}
                <p
                  className={`progress-tip-content-trip-no-ref-${id}-${
                    [...Array(num_trips)].length - i
                  } progress-tip-dist`}
                ></p>
                <p
                  className={`progress-tip-content-dist-ref-${id}-${
                    [...Array(num_trips)].length - i
                  } progress-tip-dist`}
                >
                  Dist.: 0m / 0%
                </p>
                Elapsed:{" "}
                <span
                  className={`progress-tip-content-elapsed-time-ref-${id}-${
                    [...Array(num_trips)].length - i
                  } progress-tip-dist`}
                >
                  {triggerStart ? (triggerStop ? "" : "") : "0m 0s"}
                </span>
              </div>
            </div>
          ))}

          <div className={`bus-stop-ref-${id}`}></div>
          <div className={`bus-stop-dot-ref-${id}`}></div>
          {[...Array(num_stops)].map((x, i) => (
            <BusStop
              key={i}
              id={relativeStopDistance[i]?.stopId}
              busStopNo={relativeStopDistance[i]?.busStopNo}
              globalTime={globalTime}
              start={start}
              dataObj={dataObj}
              updateHeadway={updateHeadway}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

Journey.propTypes = {
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  start: PropTypes.bool,
  triggerParentSave: PropTypes.func,
};

export default Journey;
