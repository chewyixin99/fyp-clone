import React, { useState } from 'react'
import "../styling/bus-operations.css";



const ChartBusStop = ({busStopNumber, distance, totalDistance, route_bar_width, travelRef}) => {


    var pause_for_stop_ref_1

    const [busHasArrived, setBusHasArrived] = useState(false);
    const [totalDistance, setTotalDistance] = useState(3100);

    const [busStopState, setBusStopState] = useState(false); // if bus is at bus stop, stop adding travel distance


    const pause_for_stop = () => {

        var actual_b1_distance = distance
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

    return (
        <div className="bus-stop-1" ref={bus_stop_1}>
            &nbsp;
        </div>
    )
}

export default ChartBusStop