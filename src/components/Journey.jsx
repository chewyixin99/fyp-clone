/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect } from "react";

const Journey = (props) => {
  
  const [RDPPM, setRDPPM] = useState(0);
  const [triggerRun, setTriggerRun] = useState(false);
  const [triggerPause, setTriggerPause] = useState(false);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [elapsedStartTime, setElapsedStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [updateKey, setUpdateKey] = useState(0);
  const update_rate = 1; // affects bar update -> smoothness of animation -> need to update calculations if change
  var runRef = null;
  var temp = [];
  
  const formatDistance = (data) => {
    return parseFloat(((data / props.totalDistance) * 100).toFixed(2));
  };

  const running_function = () => {
    if (!triggerRun){
      clearInterval(runRef);
    }
    else {
      runRef = setInterval(() => {
        var relative_distance_travelled = Number(
          parseFloat(
            document
              .querySelector(`.route-travelled-${props.id}`)
              .style.width.split("%")[0]
          ).toFixed(2)
        );
        setDistanceTravelled(relative_distance_travelled);
  
        if (relative_distance_travelled >= 100) {
          clearInterval(runRef);
          setDistanceTravelled(100);
        }
  
        if (
          props.busStopData.filter((item) => {
            return item.stopPercentDistance == relative_distance_travelled;
          }).length > 0 &&
          !temp.includes(relative_distance_travelled)
        ) {
          var item = props.busStopData.filter((item) => {
            return (
              relative_distance_travelled ==
              formatDistance(item.stopRelativeDistance)
            );
          });
          var duration = item[0].stopDuration;
          clearInterval(runRef);
          setTimeout(() => {
            temp.push(relative_distance_travelled);
            add_travel_distance(RDPPM);
            running_function();
          }, duration);
        }
        add_travel_distance(RDPPM * 4);
      }, update_rate);
    }

  };

  useEffect(() => {
    console.log("reload1 ");
  }, [props]);

  useEffect(() => {
    console.log(triggerRun,"reload 2");

      running_function();

    
    
    return () => clearInterval(runRef);
  }, [triggerRun]);

  var timeRef = null;

  const elapsedTimeFunction = () => {
    timeRef = setInterval(() => {
      setElapsedTime(((new Date() - elapsedStartTime) / 1000).toFixed(1));
      var relative_distance_travelled = Number(
        parseFloat(
          document
            .querySelector(`.route-travelled-${props.id}`)
            .style.width.split("%")[0]
        ).toFixed(2)
      );

      if (relative_distance_travelled >= 100) {
        clearInterval(timeRef);
        setTriggerRun(false);
      }
    }, 1);
  };

  useEffect(() => {
    if (triggerRun && !triggerPause) {
      elapsedTimeFunction();
    } else {
      clearInterval(timeRef);
    }

    return () => clearInterval(timeRef);
  }, [triggerRun, triggerPause]);

  const add_travel_distance = (relative_speed) => {
    if (!triggerPause) {
      var ref = document.querySelector(`.route-travelled-${props.id}`);
      var progressTip = document.querySelector(`.progress-tip-${props.id}`);
      var progressTipContent = document.querySelector(
        `.progress-tip-content-${props.id}`
      );
      ref.style.width =
        (
          parseFloat(ref.style.width.split("%")[0]) + relative_speed
        ).toString() + "%";
      progressTip.style.left =
        (
          parseFloat(progressTip.style.left.split("%")[0]) + relative_speed
        ).toString() + "%";
      progressTipContent.style.left =
        (
          parseFloat(progressTipContent.style.left.split("%")[0]) +
          relative_speed
        ).toString() + "%";
    }
  };

  const startRun = () => {
    var pause_btn = document.querySelector(`.pause_simulation_${props.id}`);
    var run_btn = document.querySelector(`.run_simulation_${props.id}`);
    var stop_btn = document.querySelector(`.stop_simulation_${props.id}`);
    setElapsedStartTime(new Date());
    pause_btn.classList.remove("hidden");
    run_btn.classList.add("hidden");
    stop_btn.classList.remove("hidden");
    // how much percentage of the journey the bus travels realistically per millisecond
    console.log(props.totalDistance);
    var actual_distance_percentage_per_millisecond =
      (((props.busSpeed / 3600 / 1000) * 1000) / props.totalDistance) * 100;

    console.log(actual_distance_percentage_per_millisecond);
    // how much percentage of the journey the bus travels relatively per millisecond
    console.log(actual_distance_percentage_per_millisecond);
    var relative_distance_percentage_per_millisecond =
      actual_distance_percentage_per_millisecond * props.relativeFactor;
    setRDPPM(relative_distance_percentage_per_millisecond);
    // loadBusStops()
    setTriggerRun(true);
  };

  const pause = () => {
    setTriggerPause(!triggerPause);
    if (triggerRun){
      setTriggerRun(false);
    }
    else {
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
      <div className="route-container">
        <div className="route-bar" >
          <div
            className={`route-travelled-${props.id} route-travelled`}
            style={{ width: "0%" }}
            key={updateKey}
          >
            &nbsp;
          </div>

          <div
            className={`progress-tip-${props.id} progress-tip`}
            style={{ left: "0%" }}
          ></div>
          <div
            className={`progress-tip-content-${props.id} progress-tip-content`}
            style={{ left: "-1.8%" }}
          >
            Dist: {distanceTravelled}%
            <br />
            ET: {elapsedTime}s
          </div>
          <div className={`bus-stop-${props.id}`}></div>
          <div className={`bus-stop-dot-${props.id}`}></div>
        </div>
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
      </div>
    </div>
  );
};

export default Journey;
