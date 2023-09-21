/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useCallback } from "react";
import "../styling/bus-operations.css";
import { useState, useEffect } from "react";
import { mockJson, stopObjsAfter } from "../data/constants";
import Papa from "papaparse";

const Journey = (props) => {
  const [data, setData] = useState([]);
  const [busStopData, setBusStopData] = useState([]);
  const [totalDistance, setTotalDistance] = useState(3100);
  const [newBusStopData, setNewBusStopData] = useState([]);
  const route_bar_width = 1600; //  simulator route bar width in pixels
  const [relativeArrivalTiming, setRelativeArrivalTiming] = useState([]);
  const [relativeStopDistance, setRelativeStopDistance] = useState([]);
  const [dwellTiming, setDwellTiming] = useState([]);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [numOfTrips, setNumOfTrips] = useState(0);
  const [elapsedStartTime, setElapsedStartTime] = useState({});
  const [elapsedTime, setElapsedTime] = useState({});
  const [isJourneyComplete, setIsJourneyComplete] = useState({});
  const [count, setCount] = useState(0);
  const [RDPPM, setRDPPM] = useState(0);
  const [triggerRun, setTriggerRun] = useState(false);
  const [triggerPause, setTriggerPause] = useState(false);

  const [updateKey, setUpdateKey] = useState(0);
  const update_rate = 1; // affects bar update -> smoothness of animation -> need to update calculations if change
  var runRef = null;
  var temp = [];
  var timeRef = null;
  var runningRef = null;
  let stopNo = 1;

  // add bus stops onto HTML
  const loadBusStops = () => {
    // var busStopHTML = `<div class="bus-stop" style="left:-8.5px">&nbsp;</div>`;
    // var busStopDotHTML = `<div class="bus-stop-dot" style="left:-3.5px">&nbsp;</div>`;
    // var busStopTipHTML = `<div class="progress-tip" style="left:-3.5px">&nbsp;</div>`;
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
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
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
  const getBusStopData = (stopObjs) => {
    var busStopData = [];
    var totalDistance = 0;
    var distanceBetweenStops = [];
    var sum;
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
    setBusStopData(busStopData);
  };
  const formatDistance = (data) => {
    return parseFloat(((data / totalDistance) * 100).toFixed(2));
  };
  // useEffect(() => {
  //   if (triggerRun && !triggerPause) {
  //     elapsedTimeFunction();
  //   } else {
  //     clearInterval(timeRef);
  //   }

  //   return () => clearInterval(timeRef);
  // }, [triggerRun, triggerPause]);
  // load data from constants.js into getBusStopData
  // useEffect(() => {
  //   getBusStopData(stopObjsAfter);
  // }, []);
  // useEffect(() => {
  // console.log(busStopData);
  // formatBusStopDistance(busStopData);
  // load bus stops
  // }, [busStopData]);

  useEffect(() => {
    // getRelativeArrivalTiming(mockJson);

    // getDwellTiming(mockJson);
    fetchData();
  }, []);

  useEffect(() => {
    // get total distance and relative stop distance data
    extractData(data);
  }, [data]);

  useEffect(() => {
    loadBusStops();
  }, [relativeStopDistance, totalDistance, numOfTrips]);

  // const running_function = () => {
  //   if (!triggerRun) {
  //     clearInterval(runRef);
  //   } else {
  //     runRef = setInterval(() => {
  //       var relative_distance_travelled = Number(
  //         parseFloat(
  //           document
  //             .querySelector(`.route-travelled-ref`)
  //             .style.width.split("%")[0]
  //         ).toFixed(2)
  //       );
  //       setDistanceTravelled(relative_distance_travelled);

  //       if (relative_distance_travelled >= 100) {
  //         clearInterval(runRef);
  //         setDistanceTravelled(100);
  //       }

  //       if (
  //         props.busStopData.filter((item) => {
  //           return item.stopPercentDistance == relative_distance_travelled;
  //         }).length > 0 &&
  //         !temp.includes(relative_distance_travelled)
  //       ) {
  //         var item = props.busStopData.filter((item) => {
  //           return (
  //             relative_distance_travelled ==
  //             formatDistance(item.stopRelativeDistance)
  //           );
  //         });
  //         var duration = item[0].stopDuration;
  //         clearInterval(runRef);
  //         setTimeout(() => {
  //           temp.push(relative_distance_travelled);
  //           add_travel_distance(RDPPM);
  //           running_function();
  //         }, duration);
  //       }
  //       add_travel_distance(RDPPM * 4);
  //     }, update_rate);
  //   }
  // };

  // "arrival_matrix": {
  //   "1,1": 1020,
  //   "1,2": 1096, // 1st bus at 2nd stop
  //   "1,3": 1307,
  //   "1,4": 1637,

  // "distance_matrix": {
  //   "1,1": 0, // 1st bus at 1st stop
  //   "1,2": 50, // 1st bus at 2nd stop
  //   "1,3": 255.31252875662275,

  const getRelativeArrivalTiming = (data) => {
    let stopDiff = data.arrival_matrix["1,1"];
    let objValues = Object.values(data.arrival_matrix);
    for (let i = 0; i < objValues.length; i++) {
      objValues[i] = objValues[i] - stopDiff;
    }
    setRelativeArrivalTiming(objValues);
  };

  const getDwellTiming = (data) => {
    let objValues = Object.values(data.dwell_matrix);
    setDwellTiming(objValues);
  };

  // const getRelativeStopDistance = (data) => {
  //   let stopDiff = data.distance_matrix["1,1"];
  //   let objValues = Object.values(data.distance_matrix);
  //   let totalDistance = objValues[objValues.length - 1] - stopDiff;
  //   console.log(totalDistance);
  //   setTotalDistance(objValues[objValues.length - 1]);

  //   for (let i = 0; i < objValues.length; i++) {
  //     objValues[i] = objValues[i] - stopDiff;
  //   }

  //   for (let i = 0; i < objValues.length; i++) {
  //     objValues[i] = ((objValues[i] - stopDiff) / totalDistance) * 100;
  //   }

  //   // setRelativeStopDistance(objValues);
  // };

  const fetchData = async () => {
    Papa.parse("./v1.1_output.csv", {
      // options
      download: true,
      complete: (res) => {
        const tmpJourneyData = [];
        const data = res.data.slice(1);
        // console.log(data);
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
    setCount(data[0]?.timestamp);
    // let tripDataObj = {};
    // data.map((item) => {
    //   tripDataObj[item.timestamp] = item;
    // });
    // console.log(tripDataObj);
    setRelativeStopDistance(stopDistance);
    // set last bus stop distance as max distance
    setTotalDistance(stopDistance[stopDistance.length - 1]?.distance);
    setNumOfTrips(numberOfBusTrips.length);
  };

  // const elapsedTimeFunction = () => {
  //   timeRef = setInterval(() => {
  //     setElapsedTime(((new Date() - elapsedStartTime) / 1000).toFixed(1));
  //     var relative_distance_travelled = Number(
  //       parseFloat(
  //         document
  //           .querySelector(`.route-travelled-${props.id}`)
  //           .style.width.split("%")[0]
  //       ).toFixed(2)
  //     );

  //     if (relative_distance_travelled >= 100) {
  //       clearInterval(timeRef);
  //       setTriggerRun(false);
  //     }
  //   }, 1);
  // };

  // const run = () => {
  //   // [0, 76, 287, 617, 1045, 1]
  //   // [0, 0.38633817208497534, 1.972739513404527, 4.110922597099867]

  //   runningRef = setInterval(() => {
  //     count++;
  //     let nextStop = relativeStopDistance[stopNo];
  //     let timeToNextStop = relativeArrivalTiming[stopNo];
  //     let relative_distance_percentage_per_millisecond =
  //       nextStop / timeToNextStop / 1000;

  //     if (relativeArrivalTiming.includes(count)) {
  //       console.log(count);
  //       clearInterval(runningRef);
  //       console.log(dwellTiming[stopNo]);
  //       setTimeout(() => {
  //         stopNo++;
  //         run();
  //       }, dwellTiming[stopNo] * 10);
  //     }
  //     add_travel_distance(relative_distance_percentage_per_millisecond);
  //   }, 1);
  // };

  useEffect(() => {
    // timeRef = setInterval(() => {
    //   // setElapsedStartTime((prevElapsedStartTime) => {
    //   //   return {
    //   //     ...prevElapsedStartTime,
    //   //     [data[localCount].busTripNo]: new Date(),
    //   //   };
    //   // });
    //   setElapsedTime(...elapsedStartTime);
    // }, 10);
    // let ref = document.querySelector(`.progress-tip-content-elapsed-time-ref`);
    // ref.innerHTML = `{(new Date() - elapsedStartTime[i + 1]) > 60
    //   ? Math.floor((new Date() - elapsedStartTime[i + 1]) / 60) +
    //     "m" +
    //     ((new Date() - elapsedStartTime[i + 1]) % 60) +
    //     "s"
    //   : (new Date() - elapsedStartTime[i + 1]) + "s"}`
  }, [elapsedStartTime]);

  const startRun = () => {
    var pause_btn = document.querySelector(`.pause_simulation_${props.id}`);
    var run_btn = document.querySelector(`.run_simulation_${props.id}`);
    var stop_btn = document.querySelector(`.stop_simulation_${props.id}`);
    // setElapsedStartTime(new Date());
    pause_btn.classList.remove("hidden");
    run_btn.classList.add("hidden");
    stop_btn.classList.remove("hidden");
    runFunction(data);
    // how much percentage of the journey the bus travels realistically per millisecond
    // console.log(props.totalDistance);
    // var actual_distance_percentage_per_millisecond =
    //   (((props.busSpeed / 3600 / 1000) * 1000) / props.totalDistance) * 100;

    // console.log(actual_distance_percentage_per_millisecond);
    // // how much percentage of the journey the bus travels relatively per millisecond
    // console.log(actual_distance_percentage_per_millisecond);
    // var relative_distance_percentage_per_millisecond =
    //   actual_distance_percentage_per_millisecond * props.relativeFactor;
    // setRDPPM(relative_distance_percentage_per_millisecond);
    // // loadBusStops()
    // setTriggerRun(true);
  };
  const runFunction = (data) => {
    localStorage.clear();

    let localCount = 0;
    if (data.length < 0) {
      alert("Data error. Please try again.");
      return;
    }
    console.log(data[0]);
    runRef = setInterval(() => {
      if (data[localCount].currentStatus == "TRANSIT_TO") {
        if (formatDistance(data[localCount].distance) == 100) {
          alert("hi");
        }
        add_travel_distance(
          data[localCount].distance,
          data[localCount].busTripNo
        );
        // console.log(data[localCount].distance, data[localCount].busTripNo);
      } else if (
        data[localCount].currentStatus == "STOPPED_AT" &&
        formatDistance(data[localCount].distance) == 100
      ) {
        setIsJourneyComplete((prevIsJourneyComplete) => {
          return {
            ...prevIsJourneyComplete,
            [data[localCount].busTripNo]: true,
          };
        });
        add_travel_distance(totalDistance, data[localCount].busTripNo);
      } else if (data[localCount].currentStatus == "DWELL_AT") {
        add_travel_distance(
          data[localCount].distance,
          data[localCount].busTripNo
        );
      } else if (data[localCount].currentStatus == "DISPATCHED_FROM") {
        setElapsedStartTime((prevElapsedStartTime) => {
          return {
            ...prevElapsedStartTime,
            [data[localCount].busTripNo]: new Date(),
          };
        });
        localStorage.setItem(data[localCount].busTripNo, new Date().getTime());

        add_travel_distance(
          data[localCount].distance,
          data[localCount].busTripNo
        );
      }
      localCount++;
      setElapsedTime(new Date().getTime());
    }, 10);
  };

  const add_travel_distance = (newDistance, tripNo, elapsedTime) => {
    // var ref = document.querySelector(`.route-travelled-ref`);
    var progressTip = document.querySelector(`.progress-tip-ref-${tripNo}`);
    var progressTipContent = document.querySelector(
      `.progress-tip-content-ref-${tripNo}`
    );
    var progressTipContentDist = document.querySelector(
      `.progress-tip-content-dist-ref-${tripNo}`
    );

    // ref.style.width = formatDistance(newDistance) + "%";
    progressTip.style.left = formatDistance(newDistance) + "%";
    progressTipContent.style.left = formatDistance(newDistance) - 2.7 + "%";
    progressTipContentDist.innerHTML =
      "Dist.: " +
      newDistance.toFixed(0) +
      "m / " +
      formatDistance(newDistance).toFixed(0) +
      "%";
  };

  const pause = () => {
    setTriggerPause(!triggerPause);
    if (triggerRun) {
      setTriggerRun(false);
    } else {
      setTriggerRun(true);
    }
  };

  const stop = () => {
    var pause_btn = document.querySelector(`.pause_simulation_${props.id}`);
    var run_btn = document.querySelector(`.run_simulation_${props.id}`);
    var stop_btn = document.querySelector(`.stop_simulation_${props.id}`);
    var travelRef = document.querySelector(`.route-travelled-${props.id}`);
    var tipRef = document.querySelector(`.progress-tip-${props.id}`);
    var tipContentRef = document.querySelector(
      `.progress-tip-content-${props.id}`
    );
    clearInterval(runRef);
    setTriggerRun(false);
    setTriggerPause(false);
    setDistanceTravelled(0);
    setElapsedTime(0);
    clearInterval(timeRef);
    travelRef.style.width = "0%";
    tipRef.style.left = "0%";
    tipContentRef.style.left = "-1.8%";
    pause_btn.classList.add("hidden");
    run_btn.classList.remove("hidden");
    stop_btn.classList.add("hidden");
    setUpdateKey(updateKey + 1);
  };

  return (
    <div>
      <div className="control-panel">
        <div className="sm:flex gap-2 justify-center">
          <button
            onClick={startRun}
            id={`run_simulation_${props.id}}`}
            type="button"
            className={`run_simulation_${props.id} inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
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
            id={`stop_simulation_${props.id}}`}
            type="button"
            className={`stop_simulation_${props.id} hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
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
            id={`pause_simulation_${props.id}}`}
            type="button"
            className={`pause_simulation_${props.id} hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            {!triggerPause ? (
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
            key={updateKey}
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
                style={{ left: "-2.7%" }}
              >
                Trip No.: {""}
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
                Elapsed: {""}
                <span
                  className={`progress-tip-content-elapsed-time-ref-${
                    i + 1
                  } progress-tip-dist progress-tip-content-elapsed-time-ref`}
                >
                  {elapsedTime - localStorage.getItem(i + 1)
                    ? (elapsedTime - localStorage.getItem(i + 1)) / 10
                    : 0 + "s"}
                </span>
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
