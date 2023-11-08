// eslint-disable-next-line no-unused-vars
import React from "react";
import "../styling/journey.css";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import BusStop from "./BusStop";

const Journey = React.memo(
  ({
    start,
    paused,
    ended,
    data,
    globalTime,
    id,
    setUnoptimisedOF,
    setOptimisedOF,
    skipToEndTrigger,
    resetChart,
    optimizedOutputJson,
    unoptimizedOutputJson,
    stopObjs
  }) => {
    const [totalDistance, setTotalDistance] = useState(3100);
    const route_bar_width = 1400;
    const [isRunning, setIsRunning] = useState(false);
    const [triggerStart, setTriggerStart] = useState(false);
    const [triggerStop, setTriggerStop] = useState(false);
    const [busDispatchTimestamps, setBusDispatchTimestamps] = useState({});
    const [dataObj, setDataObj] = useState({});
    const [deployedTrips, setDeployedTrips] = useState([]);
    const [OFObj, setOFObj] = useState({});
    const [currentStop, setCurrentStop] = useState({});
    const [numTrips, setNumTrips] = useState(0);
    const [numStops, setNumStops] = useState(0);

    // ------------ helper functions start ------------

    // convert distance travelled in meters to percentage
    const formatDistance = (data) => {
      return parseFloat(((data / totalDistance) * 100).toFixed(2));
    };
    // convert seconds to minutes and seconds
    const convert_seconds_to_time = (seconds) => {
      if (isNaN(seconds) || seconds == null) return "-";
      let min = Math.floor(seconds / 60);
      let sec = seconds % 60;
      return min + "m " + sec + "s";
    };
    // ------------ helper functions end ------------

    // ------------ data processing functions start ------------

    // populate bus stops on HTML DOM based on bus data

    const loadBusStops = () => {

      document.querySelector(`.bus-stop-ref-${id}`).innerHTML = ``;
      document.querySelector(`.bus-stop-dot-ref-${id}`).innerHTML = ``;

      var totalDistance = stopObjs[stopObjs.length - 1]?.distance;
      setTotalDistance(totalDistance);
      
      var busStopHTML = ``;
      var busStopDotHTML = ``;
      var tempBusData = [];
      for (var i = 0; i < stopObjs.length; i++) {
        tempBusData.push([stopObjs[i].busStopNo, stopObjs[i].stopId]);

        var relative_distance_percentage =
          (stopObjs[i]?.distance / totalDistance) * 100;
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
          <span class="pointer-events-none w-52 z-30 absolute text-sm text-white bg-gray-700 p-2 rounded-lg  ${id == '1' ? "-bottom-24" : "-top-24"} left-4 opacity-0 transition-opacity group-hover:opacity-100">
            ID: ${stopObjs[i]?.stopId}
            <br />
            Name: ${stopObjs[i]?.stopName}
            <br />
            Distance: ${stopObjs[i]?.distance.toFixed(
              0
            )}m / ${totalDistance.toFixed(
          0
        )}m (${relative_distance_percentage.toFixed(0)}%)
          <br />
          
          </span>
        </div>
      </div>`;
      }
      if (id == 1) {
        // setBusStopData(tempBusData);
      }
      document.querySelector(`.bus-stop-ref-${id}`).innerHTML += busStopHTML;
      document.querySelector(`.bus-stop-dot-ref-${id}`).innerHTML += busStopDotHTML;
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

    // ------------ data processing functions end ------------

    // ------------ main functions start ------------

    // check feed object based on global time and update HTML DOM based on object data
    
    const newRunFunction = (dataObj, globalCount) => {
      var data = dataObj;
      if (data[globalCount] != undefined) {
        for (var i = 0; i < data[globalCount].length; i++) {
          if (data[globalCount][i].currentStatus == "TRANSIT_TO") {
            add_travel_distance(
              data[globalCount][i].distance,
              data[globalCount][i].busTripNo,
              data[globalCount][i].timestamp
            );
          } else if (
            data[globalCount][i].currentStatus == "STOPPED_AT" &&
            formatDistance(data[globalCount][i].distance) == 100
          ) {
            add_travel_distance(
              totalDistance,
              data[globalCount][i].busTripNo,
              data[globalCount][i].timestamp
            );
          } else if (data[globalCount][i].currentStatus == "DWELL_AT") {
            add_travel_distance(
              data[globalCount][i].distance,
              data[globalCount][i].busTripNo,
              data[globalCount][i].timestamp
            );
          } else if (data[globalCount][i].currentStatus == "DISPATCHED_FROM") {
            let currentObj = busDispatchTimestamps;
            currentObj[data[globalCount][i].busTripNo] =
              data[globalCount][i].timestamp;
            setBusDispatchTimestamps(currentObj);

            add_travel_distance(
              data[globalCount][i].distance,
              data[globalCount][i].busTripNo,
              data[globalCount][i].timestamp
            );

            var temp = deployedTrips;
            temp.push(data[globalCount][i].busTripNo);
            setDeployedTrips(temp);
          }
        }
      }
    };

    // HTML DOM update function
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
      if (elapsedSeconds > 0) {
        progressTipContentElapsedTime.innerHTML =
          convert_seconds_to_time(elapsedSeconds);
      }
    };

    const getOF = (currentStop) => {
      var { busTripNo, busStopNo } = currentStop;
      var temp_key = busTripNo + "," + busStopNo;
      if (id == "1") {
        return unoptimizedOutputJson.obj_fn_matrix[temp_key];
      }
      return optimizedOutputJson.obj_fn_matrix[temp_key];
    };

    const updateObjectiveFunction = () => {
      var { busTripNo, busStopNo } = currentStop;
      var currentOF = getOF(currentStop);
      var currentSave = OFObj;
      currentSave[[busTripNo, busStopNo]] = currentOF;
      setOFObj(currentSave);
    };

    // ------------ main functions end ------------

    // ------------ playback functions start ------------

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
      for (var i = 1; i <= numTrips; i++) {
        add_travel_distance(0, i, busDispatchTimestamps[i]);
      }
    };

    // ------------ playback functions end ------------

    // initial setup hooks
    useEffect(() => {
      setDataObj(createDataObj(data));
      setNumTrips(optimizedOutputJson.num_trips);
      setNumStops(optimizedOutputJson.num_stops);
    }, [data, optimizedOutputJson]);

    // if bus arrives at a bus stop, update OF
    useEffect(() => {
      if (isRunning && currentStop.busTripNo) {
        updateObjectiveFunction();
      }
    }, [currentStop, isRunning]);

    // once updated OF and new current stop detected, send to parent
    useEffect(() => {
      if (isRunning) {
        if (id == "1") {
          setUnoptimisedOF({ ["timingKey"]: globalTime, ["obj"]: OFObj });
        } else {
          setOptimisedOF({ ["timingKey"]: globalTime, ["obj"]: OFObj });
        }
      }
    }, [OFObj, isRunning, currentStop]);

      // load bus stop data
    useEffect(() => {
      loadBusStops();
    }, [stopObjs]);

    // playback hooks
    useEffect(() => {
      if (ended) {
        setTriggerStop(true);
        stop();
      } else if (paused) {
        pause();
      } else if (start) {
        startRun();
      }
    }, [ended, paused, start]);

    // main function hook
    useEffect(() => {
      if (isRunning) {
        newRunFunction(dataObj, globalTime);
      }
    }, [globalTime, dataObj, isRunning, totalDistance]);

    // reset chart when stop button from parent is clicked
    useEffect(() => {
      setCurrentStop({});
      setOFObj({});
    }, [resetChart]);

    // reset chart when skip to end button from parent is clicked
    useEffect(() => {
      if (skipToEndTrigger) {
        setTriggerStop(true);
        stop();
      }
    }, [skipToEndTrigger]);

    return (
      <div className="mx-auto">
        <div className="route-container">
          <div className="route-bar">
            <div
              className={`route-travelled-ref route-travelled`}
              style={{ width: "0%" }}
            >
              &nbsp;
            </div>
            {[...Array(numTrips)].map((x, i) => (
              <div key={[...Array(numTrips)].length - i}>
                <div
                  className={`progress-tip-ref-${id}-${
                    [...Array(numTrips)].length - i
                  } progress-tip`}
                  style={{ left: "0%" }}
                ></div>
                <div
                  className={`progress-tip-content-ref-${id}-${
                    [...Array(numTrips)].length - i
                  } progress-tip-content`}
                  style={{ left: "-2.7%" }}
                >
                  Trip No.:{" "}
                  {triggerStart
                    ? triggerStop
                      ? "-"
                      : `${[...Array(numTrips)].length - i}`
                    : "-"}
                  <p
                    className={`progress-tip-content-trip-no-ref-${id}-${
                      [...Array(numTrips)].length - i
                    } progress-tip-dist`}
                  ></p>
                  <p
                    className={`progress-tip-content-dist-ref-${id}-${
                      [...Array(numTrips)].length - i
                    } progress-tip-dist`}
                  >
                    Dist.: 0m / 0%
                  </p>
                  Elapsed:{" "}
                  <span
                    className={`progress-tip-content-elapsed-time-ref-${id}-${
                      [...Array(numTrips)].length - i
                    } progress-tip-dist`}
                  >
                    {triggerStart ? (triggerStop ? "" : "") : "0m 0s"}
                  </span>
                </div>
              </div>
            ))}

            <div className={`bus-stop-ref-${id}`}></div>
            <div className={`bus-stop-dot-ref-${id}`}></div>
            {[...Array(numStops)].map((x, i) => (
              <BusStop
                key={i}
                id={stopObjs[i]?.stopId + 1}
                busStopNo={stopObjs[i]?.busStopNo}
                globalTime={globalTime}
                start={start}
                dataObj={dataObj}
                setCurrentStop={setCurrentStop}
                modelId={id}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

Journey.propTypes = {
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  start: PropTypes.bool,
  data: PropTypes.array,
  globalTime: PropTypes.number,
  id: PropTypes.string,
  setUnoptimisedOF: PropTypes.func,
  setOptimisedOF: PropTypes.func,
  skipToEndTrigger: PropTypes.bool,
  resetChart: PropTypes.bool,
  optimizedOutputJson: PropTypes.object,
  unoptimizedOutputJson: PropTypes.object,
  stopObjs: PropTypes.array
};

Journey.displayName = "Journey";

export default Journey;
