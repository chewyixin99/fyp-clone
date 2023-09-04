import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect, useRef } from "react";
import { Outlet, Link } from "react-router-dom";

const Journey = () => {
  const [busSpeed, setBusSpeed] = useState(35);
  const [totalDistance, setTotalDistance] = useState(3100);
  const [RDPPM, setRDPPM] = useState(0);
  const [triggerRun, setTriggerRun] = useState(false);
  const [triggerPause, setTriggerPause] = useState(false); // if bus is at bus stop, stop adding travel distance
  const [distanceTravelled, setDistanceTravelled] = useState(0); // if bus is at bus stop, stop adding travel distance
  const [formattedBusStopDistance, setFormattedBusStopDistance] = useState([]); // if bus is at bus stop, stop adding travel distance
  const travelRef = useRef(null);
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
          document.querySelector(".route-travelled").style.width.split("%")[0]
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
  }, []);

  useEffect(() => {
    if (triggerRun) {
      running_function();
    }
    return () => clearInterval(runRef);
  }, [triggerRun, triggerPause]);

  const add_travel_distance = (relative_speed) => {
    if (!triggerPause) {
      travelRef.current.style.width =
        (
          parseFloat(travelRef.current.style.width.split("%")[0]) +
          relative_speed
        ).toString() + "%";
    }
  };

  const loadBusStops = () => {
    var busStopHTML = ``;
    for (var i = 0; i < busStopData.length; i++) {
      var relative_distance_percentage =
        (busStopData[i].bus_stop_relative_distance / totalDistance) * 100;
      var relative_distance =
        (route_bar_width * relative_distance_percentage) / 100;
      console.log(relative_distance);
      busStopHTML += `<div class="bus-stop" style="left:${relative_distance}px">&nbsp;</div>`;
    }
    document.querySelector(".bus-stop").innerHTML += busStopHTML;
  };

  const startRun = () => {
    pause_btn.current.classList.remove("hidden");
    run_btn.current.classList.add("hidden");
    stop_btn.current.classList.remove("hidden");
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
    setTriggerPause(!triggerPause);
    if (triggerPause) {
      pause_btn.current.innerHTML = "Pause";
    } else {
      pause_btn.current.innerHTML = "Unpause";
    }
  };

  const stop = () => {
    setTriggerRun(false);
    setTriggerPause(false);
    setDistanceTravelled(0);
    travelRef.current.style.width = "0%";
    pause_btn.current.classList.add("hidden");
    run_btn.current.classList.remove("hidden");
    stop_btn.current.classList.add("hidden");
  };

  return (
    <div>
      <div className="container">
        <div className="row operations-container">
          <div className="service-route">
            Service Route (Shows the route of the bus service w/ bus stops and
            traffic lights of relative distance to one another )
          </div>
          <div className="bus-operations">
            Bus Operations (Imagine Gantt chart where this component represents
            the task while the route represents the dates)
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
                  id="run_simulation"
                  ref={run_btn}
                  type="button"
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Start
                </button>
                <button
                  onClick={stop}
                  id="stop_simulation"
                  ref={stop_btn}
                  type="button"
                  className="hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Stop
                </button>
                <button
                  onClick={pause}
                  id="pause_simulation"
                  ref={pause_btn}
                  type="button"
                  className="hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Pause
                </button>
              </div>
            </div>
            <div className="route-bar">
              <div
                className="route-travelled"
                style={{ width: "0%" }}
                ref={travelRef}
              >
                &nbsp;
              </div>
              <div className="bus-stop"></div>
            </div>
            <div>{distanceTravelled}</div>
          </div>
        </div>
        <div className="row p-4">
        <p class="text-3xl font-bold text-gray-900 dark:text-white">Bus Stop Timings (ms)</p>
          <form>
            <div class="grid gap-6 mb-6 md:grid-cols-2">
              { busStopData?.map((item) => 
                <div>
                <label
                  for={`bus_stop_id_${item.bus_stop_id}`}
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {item.bus_stop_name}
                </label>
                <label
                  for={`bus_stop_id_${item.bus_stop_id}`}
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Relative Distance from Start: {item.bus_stop_relative_distance}m or {formatDistance(item.bus_stop_relative_distance)}% of the total distance
                </label>
                <input
                  type="text"
                  id={`bus_stop_id_${item.bus_stop_id}`}
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-25 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  value={item.bus_stop_duration}
                  onChange={(e) => {
                    var new_bus_stop_data = busStopData.map((bus_stop) => {
                      if (bus_stop.bus_stop_id == item.bus_stop_id) {
                        bus_stop.bus_stop_duration = e.target.value;
                      }
                      return bus_stop;
                    });
                    setBusStopData(new_bus_stop_data);
                  }}
                />
              </div>
              )
                 
              }
             
            </div>
          </form>
        </div>

        <div className="row statistics-container p-4">
          <div className="statistics">
            Statistics (Shows the statistics of the bus service in card
            components)
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journey;
