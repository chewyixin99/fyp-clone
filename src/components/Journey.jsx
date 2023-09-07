import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect, useRef } from "react";

const Journey = (props) => {
  const [busSpeed, setBusSpeed] = useState(35);
  const [totalDistance, setTotalDistance] = useState(3100);
  const [RDPPM, setRDPPM] = useState(0);
  const [triggerRun, setTriggerRun] = useState(false);
  const [triggerPause, setTriggerPause] = useState(false); // if bus is at bus stop, stop adding travel distance
  const [distanceTravelled, setDistanceTravelled] = useState(0); // if bus is at bus stop, stop adding travel distance
  const [formattedBusStopDistance, setFormattedBusStopDistance] = useState([]); // if bus is at bus stop, stop adding travel distance
  const pause_btn = useRef(null);
  const run_btn = useRef(null);
  const stop_btn = useRef(null);

  const relative_factor = 20; // affects bus speed -> how many times faster than actual speed
  const update_rate = 1; // affects bar update -> smoothness of animation
  const route_bar_width = 1200; //  simulator route bar width in pixels

  var runRef = null;

  const [busStopData, setBusStopData] = useState([
    {
      bus_stop_id: "1",
      bus_stop_name: "Bus Stop 1",
      bus_stop_relative_distance: 200,
      bus_stop_duration: 1000,
    },
    {
      bus_stop_id: "2",
      bus_stop_name: "Bus Stop 2",
      bus_stop_relative_distance: 1000,
      bus_stop_duration: 2000,
    },
    {
      bus_stop_id: "3",
      bus_stop_name: "Bus Stop 3",
      bus_stop_relative_distance: 1500,
      bus_stop_duration: 1000,
    },
    {
      bus_stop_id: "4",
      bus_stop_name: "Bus Stop 4",
      bus_stop_relative_distance: 1800,
      bus_stop_duration: 2000,
    },
  ]);

  const formatDistance = (data) => {
    return Number(parseFloat((data / totalDistance) * 100)).toFixed(2);
  };

  const formatBusStopDistance = (data) => {
    var format_data = data.map((item) =>
      formatDistance(item.bus_stop_relative_distance)
    );
    setFormattedBusStopDistance(format_data);
  };

  const running_function = () => {
    runRef = setInterval(() => {
      var relative_distance_travelled = Number(
        parseFloat(
          document.querySelector(`.route-travelled-${props.id}`).style.width.split("%")[0]
        ).toFixed(2)
      );
      setDistanceTravelled(relative_distance_travelled);
      if (
        formattedBusStopDistance.includes(
          relative_distance_travelled.toString()
        )
      ) {
        var item = busStopData.filter((item) => {
          return (
            relative_distance_travelled.toString() ==
            formatDistance(item.bus_stop_relative_distance)
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
    loadBusStops();
    formatBusStopDistance(busStopData);
  }, [props]);

  useEffect(() => {
    if (triggerRun) {
      running_function();
    }
    return () => clearInterval(runRef);
  }, [triggerRun, triggerPause]);

  const add_travel_distance = (relative_speed) => {
    if (!triggerPause) {
      
      var ref = document.querySelector(`.route-travelled-${props.id}`);
      ref.style.width =
        (
          parseFloat(ref.style.width.split("%")[0]) +
          relative_speed
        ).toString() + "%";
    }
  };

  const loadBusStops = () => {
    var busStopHTML = ``;
    for (var i = 0; i < props.bus_stop_data.length; i++) {
      var relative_distance_percentage =
        (props.bus_stop_data[i].bus_stop_relative_distance /
          props.total_distance) *
        100;
      var relative_distance =
        (props.route_bar_width * relative_distance_percentage) / 100;

      busStopHTML += `<div class="bus-stop" style="left:${relative_distance}px">&nbsp;</div>`;
    }
    document.querySelector(`.bus-stop-${props.id}`).innerHTML = busStopHTML;
  };

  const startRun = () => {
    var pause_btn = document.querySelector(`.pause_simulation_${props.id}`);
    var run_btn = document.querySelector(`.run_simulation_${props.id}`);
    var stop_btn = document.querySelector(`.stop_simulation_${props.id}`);

    console.log(run_btn);
    console.log(pause_btn);
    pause_btn.classList.remove("hidden");
    run_btn.classList.add("hidden");
    stop_btn.classList.remove("hidden");
    // how much percentage of the journey the bus travels realistically per millisecond
    var actual_distance_percentage_per_millisecond =
      (((busSpeed / 3600) * 1000) / 1000 / totalDistance) * 100;
    // how much percentage of the journey the bus travels relatively per millisecond
    var relative_distance_percentage_per_millisecond =
      actual_distance_percentage_per_millisecond * relative_factor;
    setRDPPM(relative_distance_percentage_per_millisecond);
    // loadBusStops()
    setTriggerRun(true);
  };

  const pause = () => {
    var pause_btn = document.querySelector(`.pause_simulation_${props.id}`);
    setTriggerPause(!triggerPause);
    if (triggerPause) {
      pause_btn.innerHTML = "Pause";
    } else {
      pause_btn.innerHTML = "Unpause";
    }
  };

  const stop = () => {
    var pause_btn = document.querySelector(`.pause_simulation_${props.id}`);
    var run_btn = document.querySelector(`.run_simulation_${props.id}`);
    var stop_btn = document.querySelector(`.stop_simulation_${props.id}`);
    var travelRef = document.querySelector(`.route-travelled-${props.id}`);
    setTriggerRun(false);
    setTriggerPause(false);
    setDistanceTravelled(0);
    travelRef.style.width = "0%";
    pause_btn.classList.add("hidden");
    run_btn.classList.remove("hidden");
    stop_btn.classList.add("hidden");
  };

  return (
    <div>
      <div className="control-panel">
        <div className="">
          <input
            type="range"
            id="bus_speed"
            name="bus_speed"
            min="10"
            max="60"
            onChange={(e) => {
              setBusSpeed(e.target.value);
            }}
          />
          <label for="bus_speed">Bus Speed</label>
          {/* <input type="range" id="total_distance" name="total_distance" min="1000" max="10000" onChange={(e) => { setTotalDistance(e.target.value) }} /> */}
          {/* <label for="total_distance">Total Distance (testing only)</label> */}
        </div>

        <div className="sm:flex">
          <button
            onClick={startRun}
            id={`run_simulation_${props.id}}`}
            type="button"
            className={`run_simulation_${props.id} inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            Start
          </button>
          <button
            onClick={stop}
            id={`stop_simulation_${props.id}}`}
            type="button"
            className={`stop_simulation_${props.id} hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            Stop
          </button>
          <button
            onClick={pause}
            id={`pause_simulation_${props.id}}`}
            type="button"
            className={`pause_simulation_${props.id} hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50`}
          >
            Pause
          </button>
        </div>
      </div>
      <div>
        <div className="route-bar">
          <div
            className={`route-travelled-${props.id} route-travelled`}
            style={{ width: "0%" }}
          >
            &nbsp;
          </div>
          <div className={`bus-stop-${props.id}`}></div>
        </div>
        <div>{distanceTravelled}</div>
      </div>
    </div>
  );
};

export default Journey;
