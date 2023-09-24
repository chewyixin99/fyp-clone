/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect } from "react";
import { mockJson, stopObjsAfter } from "../data/constants";
import Papa from "papaparse";

const Journey = () => {
  const [data, setData] = useState([]);
  const [totalDistance, setTotalDistance] = useState(3100);
  const route_bar_width = 1600; //  simulator route bar width in pixels
  const [relativeStopDistance, setRelativeStopDistance] = useState([]);
  const [numOfTrips, setNumOfTrips] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [triggerStart, setTriggerStart] = useState(false);

  var runRef = null;

  const loadBusStops = () => {
    var busStopHTML = ``;
    var busStopDotHTML = ``;
    for (var i = 0; i < relativeStopDistance.length; i++) {
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
          <span class="pointer-events-none max-w-xs absolute text-sm text-white bg-gray-700 p-2 rounded-lg -top-32 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
            ID: ${relativeStopDistance[i]?.stopId}
            <br />
            Name: ${relativeStopDistance[i]?.stopName}
            <br />
            Distance: ${relativeStopDistance[i]?.distance.toFixed(
              0
            )}m / ${totalDistance.toFixed(
        0
      )}m (${relative_distance_percentage.toFixed(0)}%)
          </span>
        </div>
      </div>`;
    }

    document.querySelector(`.bus-stop-ref`).innerHTML += busStopHTML;
    document.querySelector(`.bus-stop-dot-ref`).innerHTML += busStopDotHTML;
  };

  const formatDistance = (data) => {
    return parseFloat(((data / totalDistance) * 100).toFixed(2));
  };

  const convert_seconds_to_time = (seconds) => {
    let min = Math.floor(seconds / 60);
    let sec = seconds % 60;
    return min + "m " + sec + "s";
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    extractData(data);
  }, [data]);

  useEffect(() => {
    loadBusStops();

  }, [relativeStopDistance, totalDistance, numOfTrips]);

  const fetchData = async () => {
    Papa.parse("./v1.1_output.csv", {
      // options
      download: true,
      complete: (res) => {
        const tmpJourneyData = [];
        const data = res.data.slice(1);
        for (let i = 0; i < data.length; i++) {
          const rowData = data[i];
          tmpJourneyData.push({
            timestamp: parseFloat(rowData[0]),
            lat: parseFloat(rowData[4]),
            lng: parseFloat(rowData[5]),
            opacity: 0,
            stopId: "to be filled",
            stopName: "to be filled",
            busStopNo: parseInt(rowData[3]),
            currentStatus: rowData[2],
            busTripNo: parseInt(rowData[1]),
            distance: parseFloat(rowData[6]),
          });
        }
        setData(tmpJourneyData);
      },
    });
  };

  const extractData = (data) => {
    let stopDistance = data.filter((item) => {
      return (
        (item.currentStatus == "STOPPED_AT" ||
          item.currentStatus == "DISPATCHED_FROM") &&
        item.busTripNo == 1
      );
    });
    let numberOfBusTrips = data.filter((item) => {
      return item.currentStatus == "DISPATCHED_FROM";
    });
    setRelativeStopDistance(stopDistance);
    setTotalDistance(stopDistance[stopDistance.length - 1]?.distance);
    setNumOfTrips(numberOfBusTrips.length);
  };

  const [saveLocalCount, setSaveLocalCount] = useState(0);
  const [busDispatchTimestamps, setBusDispatchTimestamps] = useState({});

  useEffect(() => {
    if (isRunning) {
      runFunction(data);
    }
  }, [saveLocalCount, isRunning]);

  var localCount = 0;
  const runFunction = (data) => {
    localCount = saveLocalCount;

    if (data.length < 0) {
      alert("Data error. Please try again.");
      return;
    }

    runRef = setInterval(() => {
      if (data[localCount].currentStatus == "TRANSIT_TO") {
        if (formatDistance(data[localCount].distance) == 100) {
          alert("hi");
        }
        add_travel_distance(
          data[localCount].distance,
          data[localCount].busTripNo,
          data[localCount].timestamp
        );
      } else if (
        data[localCount].currentStatus == "STOPPED_AT" &&
        formatDistance(data[localCount].distance) == 100
      ) {
        add_travel_distance(
          totalDistance,
          data[localCount].busTripNo,
          data[localCount].timestamp
        );
      } else if (data[localCount].currentStatus == "DWELL_AT") {
        add_travel_distance(
          data[localCount].distance,
          data[localCount].busTripNo,
          data[localCount].timestamp
        );
      } else if (data[localCount].currentStatus == "DISPATCHED_FROM") {
        let currentObj = busDispatchTimestamps;
        currentObj[data[localCount].busTripNo] = data[localCount].timestamp;
        setBusDispatchTimestamps(currentObj);

        add_travel_distance(
          data[localCount].distance,
          data[localCount].busTripNo,
          data[localCount].timestamp
        );
      }

      localCount++;
    }, 10);
  };

  const add_travel_distance = (newDistance, tripNo, timestamp) => {
    var progressTip = document.querySelector(`.progress-tip-ref-${tripNo}`);
    var progressTipContent = document.querySelector(
      `.progress-tip-content-ref-${tripNo}`
    );
    var progressTipContentDist = document.querySelector(
      `.progress-tip-content-dist-ref-${tripNo}`
    );
    var progressTipContentElapsedTime = document.querySelector(
      `.progress-tip-content-elapsed-time-ref-${tripNo}`
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
    var pause_btn = document.querySelector(`.pause_simulation`);
    var run_btn = document.querySelector(`.run_simulation`);
    var stop_btn = document.querySelector(`.stop_simulation`);
    pause_btn.classList.remove("hidden");
    run_btn.classList.add("hidden");
    stop_btn.classList.remove("hidden");
    setIsRunning(true);
    setTriggerStart(true);
  };

  const pause = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(runRef);
      setSaveLocalCount(localCount);
    } else {
      setIsRunning(true);
    }
  };

  const stop = () => {
    var pause_btn = document.querySelector(`.pause_simulation`);
    var run_btn = document.querySelector(`.run_simulation`);
    var stop_btn = document.querySelector(`.stop_simulation`);

    clearInterval(runRef);
    setIsRunning(false);
    add_travel_distance(data[0].distance, data[0].busTripNo, data[0].timestamp);
    setSaveLocalCount(0);

    pause_btn.classList.add("hidden");
    run_btn.classList.remove("hidden");
    stop_btn.classList.add("hidden");
  };

  return (
    <div>
      <div className="control-panel">
        <div className="sm:flex gap-2 justify-center">
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
        </div>
      </div>
      <div className="route-container">
        <div className="route-bar">
          <div
            className={`route-travelled-ref route-travelled`}
            style={{ width: "0%" }}
          >
            &nbsp;
          </div>
          {[...Array(numOfTrips)].map((x, i) => (
            <div key={i}>
              <div
                className={`progress-tip-ref-${i + 1} progress-tip`}
                style={{ left: "0%" }}
              ></div>
              <div
                className={`progress-tip-content-ref-${
                  i + 1
                } progress-tip-content`}
                style={{ left: "-2.7%"}}
              >
                Trip No.: {triggerStart ? `${i+1}` : "-"}
                <p
                  className={`progress-tip-content-trip-no-ref-${
                    i + 1
                  } progress-tip-dist`}
                ></p>
                <p
                  className={`progress-tip-content-dist-ref-${
                    i + 1
                  } progress-tip-dist`}
                >
                  Dist.: 0m / 0%
                </p>
                Elapsed: {triggerStart ? "" : "0m 0s"}
                <span
                  className={`progress-tip-content-elapsed-time-ref-${
                    i + 1
                  } progress-tip-dist progress-tip-content-elapsed-time-ref`}
                ></span>
              </div>
            </div>
          ))}

          <div className={`bus-stop-ref`}></div>
          <div className={`bus-stop-dot-ref`}></div>
        </div>
      </div>
    </div>
  );
};

export default Journey;
