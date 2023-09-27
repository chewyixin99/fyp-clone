import { useCallback, useState, useEffect } from "react";
import { GoogleMap, LoadScript, Polyline } from "@react-google-maps/api";
import PropTypes from "prop-types";
// custom imports
import MarkerWithInfoWindow from "./MarkerWithInfoWindow";
import BusStatus from "./BusStatus";
import {
  resetOpacity,
  startBusIfTime,
  updateBusCurrStop,
} from "../../util/mapHelper";

const containerStyle = {
  width: "40vw",
  height: "30vw",
};

const Map = ({
  started,
  isOptimized,
  stops,
  journey,
  // * todo: replace once full data in, for now its just to test
  journeyNew,
  busIndex,
  setBusIndex,
  numBusCurr,
  setNumBusCurr,
  paused,
  setPaused,
  zoom,
  setZoom,
  center,
  setCenter,
  ended,
  setEnded,
  defaultIntervalTime,
  defaultInactiveOpacity,
  defaultActiveOpacity,
  // * todo: uncomment once full data out
  // polyPath,
}) => {
  // map states
  // create an env variable with name 'VITE_MAPS_API_KEY' in your .env file to load this
  const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;
  const [map, setMap] = useState(null);
  // polypath
  // * todo: delete once full data out
  const [polyPath, setPolyPath] = useState([]);
  // to keep track of global time so that bus can be automatically dispatched
  const startTime =
    Object.keys(journeyNew).length === 0 ? 0 : journeyNew[0][0].timestamp; // hardcoded
  const [globalTime, setGlobalTime] = useState(0);
  // keep track total number of buses dispatched
  const [numBusDispatched, setNumBusDispatched] = useState(1);

  const onLoad = useCallback(
    (map) => {
      map.setZoom(zoom);
      setMap(map);
    },
    [zoom]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onTilesLoaded = useCallback(() => {
    setCenter(null);
    setZoom(null);
  }, [setCenter, setZoom]);

  // initial render data
  useEffect(() => {
    // calculate polyline path once on
    let tmpPolyPath = [];
    for (const point of stops) {
      tmpPolyPath.push({ lat: point.lat, lng: point.lng });
    }
    // * todo: delete once full data out
    setPolyPath(tmpPolyPath);
    setGlobalTime(startTime);
  }, [stops, journeyNew]);

  // bus update logic
  // TODO: listen for bus location and do some action
  useEffect(() => {
    // only enter code if there is
    // 1. at least 1 bus running 2. not paused 3. not ended
    if (
      // numBusCurr !== 0 &&
      started &&
      !paused &&
      !ended
    ) {
      // create a copy and update before setting the new state
      let busIndexCopy = JSON.parse(JSON.stringify(busIndex));
      const interval = setInterval(() => {
        for (const bus in busIndexCopy) {
          const busJourney = journeyNew[bus];
          console.log(
            `globalTime is ${globalTime}, numBusDispatched is ${numBusDispatched}`
          );
          const toStartBus = startBusIfTime(busJourney, globalTime);
          // only update if a journey is started and index is <= total num stops
          if (updateBusCurrStop(busIndexCopy[bus], busJourney.length)) {
            busIndexCopy[bus].currStop += 1;
          } else if (
            toStartBus &&
            Object.keys(busIndex).length > numBusDispatched
          ) {
            busIndexCopy[bus].currStop += 1;
            setNumBusCurr(numBusCurr + 1);
            setNumBusDispatched(numBusDispatched + 1);
          }
        }
        // set stops to updated stopMarkers
        setBusIndex({ ...busIndexCopy });
        // update global time
        // ! todo: arbitrarily set for now
        setGlobalTime(globalTime + defaultIntervalTime / 20);
      }, defaultIntervalTime);
      // loop through every bus to check if there is a need to update markers
      for (const bus in busIndex) {
        // find the curr stop that this bus is at
        const currStop = busIndex[bus].currStop;
        const busJourney = journeyNew[bus];
        // only update buses who is currently out i.e., currStop !== -1
        if (currStop !== -1) {
          // condition not in use for now, but have to take note of currStop === 0 case
          if (currStop === 0) {
            busJourney[busJourney.length - 1].opacity = defaultInactiveOpacity;
          } else if (currStop === busJourney.length) {
            // check if this bus is on its last stop, set to -1 to stop the journey
            setBusIndex({
              ...busIndex,
              [bus]: {
                ...busIndex[bus],
                currStop: -1,
              },
            });
            console.log(
              `remove 1 bus from loop: numBuses now = ${numBusCurr - 1}`
            );
            resetOpacity(busJourney);
            // * todo: new
            resetOpacity(busJourney);
            // reset opacity after last station
            busJourney[currStop - 1].opacity = defaultInactiveOpacity;
            // use this to signify that all buses have concluded their journey
            if (numBusCurr - 1 === 0) {
              console.log("ending journey...");
              // reset numBusDispatched
              setNumBusDispatched(0);
              setGlobalTime(startTime);
              setEnded(true);
            }
            // keep track of buses that are still in journey
            setNumBusCurr(numBusCurr - 1);
            return () => clearInterval(interval);
          } else {
            // reset prev stop's opacity
            busJourney[currStop - 1].opacity = defaultInactiveOpacity;
            // set curr stop's opacity
            busJourney[currStop].opacity = defaultActiveOpacity;
          }
        }
      }
      return () => clearInterval(interval);
    } else if (ended) {
      console.log("journey ended");
      // reset globalTime
      setGlobalTime(startTime);
      // reset buses
      setNumBusCurr(0);
      // reset numBusDispatched
      setNumBusDispatched(0);
      // reset pause state
      setPaused(false);
      for (const bus in journeyNew) {
        for (const point of journeyNew[bus]) {
          point.opacity = defaultInactiveOpacity;
        }
      }
    }
  }, [busIndex, journeyNew, numBusCurr, started, paused, ended]);

  const renderMap = () => {
    if (Object.keys(journeyNew).length === 0 || journeyNew === undefined) {
      return;
    }
    return (
      <div>
        <LoadScript googleMapsApiKey={MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            zoom={zoom}
            center={center}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onTilesLoaded={onTilesLoaded}
          >
            <Polyline
              map={map}
              path={polyPath}
              geodesic={true}
              options={{
                geodesic: true,
                strokeColor: "#5729ce",
                strokeOpacity: 0.75,
                strokeWeight: 4,
              }}
            />
            {/* Child components, such as markers, info windows, etc. */}
            {stops.map((stop, index) => {
              if (stop === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow
                  key={index}
                  data={stops}
                  index={index}
                  stop={stop}
                  map={map}
                />
              );
              // store marker for manipulation later
              return markerWithInfoWindow;
            })}
            {/* * todo: change journey to journeyNew */}
            {journeyNew[0].map((point, index) => {
              if (point === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow
                  key={index}
                  data={journeyNew[0]}
                  index={index}
                  stop={point}
                  map={map}
                />
              );
              // store marker for manipulation later
              return markerWithInfoWindow;
            })}
            {journeyNew[1].map((point, index) => {
              if (point === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow
                  key={index}
                  data={journeyNew[1]}
                  index={index}
                  stop={point}
                  map={map}
                />
              );
              // store marker for manipulation later
              return markerWithInfoWindow;
            })}
            {journeyNew[2].map((point, index) => {
              if (point === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow
                  key={index}
                  data={journeyNew[2]}
                  index={index}
                  stop={point}
                  map={map}
                />
              );
              // store marker for manipulation later
              return markerWithInfoWindow;
            })}
            {journeyNew[3].map((point, index) => {
              if (point === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow
                  key={index}
                  data={journeyNew[3]}
                  index={index}
                  stop={point}
                  map={map}
                />
              );
              // store marker for manipulation later
              return markerWithInfoWindow;
            })}
            {journeyNew[4].map((point, index) => {
              if (point === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow
                  key={index}
                  data={journeyNew[4]}
                  index={index}
                  stop={point}
                  map={map}
                />
              );
              // store marker for manipulation later
              return markerWithInfoWindow;
            })}
          </GoogleMap>
        </LoadScript>
      </div>
    );
  };

  return (
    <div className="text-center">
      <div className="flex justify-center py-3">
        {isOptimized ? "After" : "Before"} optimization
      </div>
      <hr />
      <div className="pt-5 pb-3">
        There are currently
        <span className="px-3 py-1 border mx-2 bg-gray-100 font-bold">
          {numBusCurr}
        </span>
        buses dispatched.
      </div>
      {/* button controls */}
      <div className="flex justify-center py-3">{renderMap()}</div>
      <div className="grid grid-cols-3 max-w-[100%] mx-auto">
        {Object.keys(busIndex).map((bus) => {
          return (
            <BusStatus
              key={bus}
              busNum={bus}
              busDetails={busIndex[bus]}
              currStopDetails={journeyNew[bus][busIndex[bus].currStop - 1]}
            />
          );
        })}
      </div>
    </div>
  );
};

Map.propTypes = {
  started: PropTypes.bool,
  isOptimized: PropTypes.bool,
  stops: PropTypes.array,
  journey: PropTypes.array,
  // * todo: replace once full data in, for now its just to test
  journeyNew: PropTypes.object,
  busIndex: PropTypes.object,
  setBusIndex: PropTypes.func,
  numBusCurr: PropTypes.number,
  setNumBusCurr: PropTypes.func,
  paused: PropTypes.bool,
  setPaused: PropTypes.func,
  zoom: PropTypes.number,
  setZoom: PropTypes.func,
  center: PropTypes.object,
  setCenter: PropTypes.func,
  ended: PropTypes.bool,
  setEnded: PropTypes.func,
  defaultIntervalTime: PropTypes.number,
  defaultInactiveOpacity: PropTypes.number,
  defaultActiveOpacity: PropTypes.number,
  // * todo: uncomment once full data out
  // polyPath: PropTypes.array,
};

export default Map;
