import React from "react";
import "../styling/bus-operations.css";
import { useState, useEffect, useRef } from "react";

const Home = () => {

  const [busSpeed, setBusSpeed] = useState(35);
  const [totalDistance, setTotalDistance] = useState(3100);
  const [RDPPM, setRDPPM] = useState(0)
  const [pause_state, setPauseState] = useState(false);
  const [runState, setRunState] = useState(false);
  const [busStopState, setBusStopState] = useState(false); // if bus is at bus stop, stop adding travel distance

  const travelRef = useRef(null);
  const pause_btn = useRef(null);
  const run_btn = useRef(null);
  const stop_btn = useRef(null);
  const bus_stop_1 = useRef(null);
  const bus_stop_2 = useRef(null);

  const relative_factor = 20 // affects bus speed -> how many times faster than actual speed
  const update_rate = 1 // affects bar update -> smoothness of animation
  const route_bar_width = 1200 //  simulator route bar width in pixels

  var runRef = null;
  var pause_for_stop_ref_1 // reference to the setInterval function for pausing at bus stops
  var pause_for_stop_ref_2


  useEffect(() => {
    if (runState) {
      runRef = setInterval(() => {
        if (parseFloat(document.querySelector(".route-travelled").style.width.split('%')[0]) > 100.0) {
          clearInterval(runRef)
        }
        add_travel_distance(RDPPM)

      }, update_rate);
      return () => clearInterval(runRef);
    }
    else {
      clearInterval(runRef)
    }
  }, [runState, pause_state, busStopState]);

  const pause_for_stop_1 = () => {

    var actual_b1_distance = 600
    var relative_b1_distance_percentage = actual_b1_distance / totalDistance * 100
    var relative_b1_distance = route_bar_width * relative_b1_distance_percentage / 100
    bus_stop_1.current.style.left = relative_b1_distance + "px";

    pause_for_stop_ref_1 = setInterval(() => {

      var route_bar_width = parseFloat(travelRef.current.style.width.split('%')[0]);
      if (route_bar_width >= relative_b1_distance_percentage) {
        setBusStopState(true)
        setTimeout(() => {
          setBusStopState(false);
          clearInterval(pause_for_stop_ref_1);
        }, 1000);
      }

    }, update_rate);
  }

  const pause_for_stop_2 = () => {

    var actual_b2_distance = 1000
    var relative_b2_distance_percentage = actual_b2_distance / totalDistance * 100
    var relative_b2_distance = route_bar_width * relative_b2_distance_percentage / 100
    bus_stop_2.current.style.left = relative_b2_distance + "px";

    pause_for_stop_ref_2 = setInterval(() => {

      var route_bar_width = parseFloat(travelRef.current.style.width.split('%')[0]);
      if (route_bar_width >= relative_b2_distance_percentage) {
        setBusStopState(true)
        setTimeout(() => {
          setBusStopState(false)
          clearInterval(pause_for_stop_ref_2);
        }, 1000);
      }

    }, update_rate);
  }

  const add_travel_distance = (percentage_distance) => {

    if (!pause_state && !busStopState) {
      travelRef.current.style.width = (parseFloat(travelRef.current.style.width.split('%')[0]) + percentage_distance).toString() + "%";
    }

  }

  const run = () => {

    pause_for_stop_1();
    pause_for_stop_2();

    // pause_btn.current.hidden = false;
    pause_btn.current.classList.remove('hidden');
    run_btn.current.classList.add('hidden');
    // stop_btn.current.hidden = false;
    stop_btn.current.classList.remove('hidden');

    var actual_distance_percentage_per_millisecond = busSpeed / 3600 * 1000 / 1000 / totalDistance * 100;
    var relative_distance_percentage_per_millisecond = actual_distance_percentage_per_millisecond * relative_factor;
    setRDPPM(relative_distance_percentage_per_millisecond)

    setRunState(true)

  }

  const pause = () => {

    setPauseState(!pause_state)
    if (pause_state) {
      pause_btn.current.innerHTML = 'Pause';
    }
    else {
      pause_btn.current.innerHTML = 'Unpause';
    }

  }

  const stop = () => {

    setRunState(false)
    setPauseState(false)
    travelRef.current.style.width = "0%";
    // pause_btn.current.hidden = false
    // run_btn.current.hidden = false;
    // stop_btn.current.hidden = true;

    pause_btn.current.classList.add('hidden');
    run_btn.current.classList.remove('hidden');
    stop_btn.current.classList.add('hidden');

  }



  return <div>
    <div className="container">
      <div className="row operations-container">
        <div className="service-route">
          Service Route (Shows the route of the bus service w/ bus stops and traffic lights of relative distance
          to one another )
        </div>
        <div className="bus-operations">
          Bus Operations (Imagine Gantt chart where this component represents the task while the route represents
          the dates)
          <div className="control-panel">
            <div className="">
              <input type="range" id="bus_speed" name="bus_speed" min="10" max="60" onChange={(e) => { setBusSpeed(e.target.value) }} />
              <label for="bus_speed">Bus Speed</label>
              {/* <input type="range" id="total_distance" name="total_distance" min="1000" max="10000" onChange={(e) => { setTotalDistance(e.target.value) }} /> */}
              {/* <label for="total_distance">Total Distance (testing only)</label> */}
            </div>

            <div className="sm:flex">
                <button onClick={run} id="run_simulation" ref={run_btn} type="button" className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Start
                </button>
                <button onClick={stop} id="stop_simulation" ref={stop_btn} type="button" className="hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Stop
                </button>
                <button onClick={pause} id="pause_simulation" ref={pause_btn} type="button" className="hidden inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Pause
                </button>

            </div>
          </div>

          <div className="route-bar">
            <div className="route-travelled" style={{ width: '0%' }} ref={travelRef}>
              &nbsp;
            </div>
            <div className="bus-stop-1" ref={bus_stop_1}>
              &nbsp;
            </div>
            <div className="bus-stop-2" ref={bus_stop_2}>
              &nbsp;
            </div>
            <div className="traffic-light-1">
              &nbsp;
            </div>

          </div>
        </div>
      </div>

      <div className="row statistics-container">
        <div className="statistics">
          Statistics (Shows the statistics of the bus service in card components)
        </div>
      </div>

    </div>

  </div>
};




export default Home;
