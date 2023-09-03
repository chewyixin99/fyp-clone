import { useCallback, useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import { stopObjs } from "../data/constants";
import MarkerWithInfoWindow from "../components/MarkerWithInfoWindow";
import BusStatus from "../components/BusStatus";

const containerStyle = {
  width: "95vw",
  height: "60vh",
};

const defaultCenter = {
  lat: 45.488184,
  lng: -122.399686,
};

const defaultZoom = 14;

const defaultIntervalTime = 200;

// set to maximum of 12 journeys going on at once
const defaultAllBusIndex = {
  0: -1,
  1: -1,
  2: -1,
  3: -1,
  4: -1,
  5: -1,
  6: -1,
  7: -1,
  8: -1,
  9: -1,
  10: -1,
  11: -1,
};

const classes = {
  button: "border hover:shadow-md px-3 py-1 rounded-md mx-3",
  buttonDisabled: "border px-3 py-1 rounded-md mx-3 bg-gray-200",
};

const Maps = () => {
  // map states
  // create an env variable with name 'VITE_MAPS_API_KEY' in your .env file to load this
  const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);
  // bus progress state
  const [busIndex, setBusIndex] = useState(defaultAllBusIndex);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  // TODO: keep track of bus number currently dispatched
  const [numBusCurr, setNumBusCurr] = useState(0);
  // stops
  const stops = stopObjs;

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
  }, []);

  const resetZoomAndCenter = () => {
    setCenter(defaultCenter);
    setZoom(defaultZoom);
    console.log("reset clicked");
  };

  const onStartBusClick = () => {
    // on click, check if there are any buses running
    // if yes, set the bus index to 0 (from -1) to start the loop
    setEnded(false);
    for (const bus in busIndex) {
      if (busIndex[bus] === -1) {
        setBusIndex({
          ...busIndex,
          [bus]: 0,
        });
        console.log(`add 1 bus to loop: numBuses now = ${numBusCurr + 1}`);
        // update num buses currently in loop
        setNumBusCurr(numBusCurr + 1);
        break;
      }
    }
  };

  const onPauseClick = () => {
    if (numBusCurr !== 0) {
      // if resume
      if (!paused) {
        let tmpBusIndex = JSON.parse(JSON.stringify(busIndex));
        for (const bus in tmpBusIndex) {
          if (tmpBusIndex[bus] !== -1) {
            tmpBusIndex[bus] += 1;
          }
        }
        setBusIndex(tmpBusIndex);
      }
      setPaused(!paused);
    }
  };

  const onSkipToEndClick = () => {
    if (numBusCurr !== 0) {
      let tmpBusIndexCopy = JSON.parse(JSON.stringify(busIndex));
      for (const bus in tmpBusIndexCopy) {
        tmpBusIndexCopy[bus] = -1;
      }
      setBusIndex(tmpBusIndexCopy);
      setEnded(true);
    }
  };

  // TODO: listen for bus location and do some action
  useEffect(() => {
    // only enter code if there is at least 1 bus running
    if (numBusCurr !== 0 && !paused && !ended) {
      // create a copy and update before setting the new state
      let busIndexCopy = JSON.parse(JSON.stringify(busIndex));
      const interval = setInterval(() => {
        for (const bus in busIndexCopy) {
          // only update if a journey is started and index is <= total num stops
          if (busIndexCopy[bus] !== -1 && busIndexCopy[bus] !== stops.length) {
            busIndexCopy[bus] += 1;
          }
        }
        // set stops to updated stopMarkers
        setBusIndex({ ...busIndexCopy });
      }, defaultIntervalTime);
      // loop through every bus to check if there is a need to update markers
      for (const bus in busIndex) {
        // find the curr stop that this bus is at
        const currStop = busIndex[bus];
        // only update buses who is currently out i.e., currStop !== -1
        if (currStop !== -1) {
          // condition not in use for now, but have to take note of currStop === 0 case
          if (currStop === 0) {
            stops[stops.length - 1].opacity = 0.4;
          } else if (currStop === stops.length) {
            // check if this bus is on its last stop, set to -1 to stop the journey
            setBusIndex({
              ...busIndex,
              [bus]: -1,
            });
            console.log(
              `remove 1 bus from loop: numBuses now = ${numBusCurr - 1}`
            );
            if (numBusCurr - 1 === 0) {
              console.log("ending journey...");
              setEnded(false);
            }
            // keep track of buses that have ended their journey
            setNumBusCurr(numBusCurr - 1);
            return () => clearInterval(interval);
          } else {
            // clear prev stop's opacity
            stops[currStop - 1].opacity = 0.4;
          }
          // set curr stop's opacity
          stops[currStop].opacity = 1;
        }
      }
      return () => clearInterval(interval);
    } else if (ended) {
      console.log("journey ended");
      for (const stop of stops) {
        stop.opacity = 0.4;
      }
      // reset buses
      setNumBusCurr(0);
      // reset pause state
      setPaused(false);
    }
  }, [busIndex, stops, numBusCurr, paused, ended]);

  const renderMap = () => {
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
            {/* Child components, such as markers, info windows, etc. */}
            {stops.map((stop, index) => {
              if (stop === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow key={index} stop={stop} map={map} />
              );
              // store marker for manipulation later
              return markerWithInfoWindow;
            })}
            {/* reference point for when map is laoded */}
            {/* <Marker position={defaultCenter} map={map} /> */}
          </GoogleMap>
        </LoadScript>
      </div>
    );
  };

  return (
    <div className="text-center">
      <div className="flex justify-center py-3">
        Maps is currently loaded for this&nbsp;
        <Link
          className="text-blue-600 hover:underline"
          to="https://trimet.org/schedules/r084.htm"
          target="_blank"
          rel="noopener noreferrer"
        >
          bus route
        </Link>
        . (require VPN)
      </div>
      <div className="flex justify-center py-3">
        <button
          onClick={resetZoomAndCenter}
          className={classes.button}
          type="button"
        >
          reset zoom and center
        </button>
        <button
          onClick={onStartBusClick}
          className={paused ? classes.buttonDisabled : classes.button}
          type="button"
          disabled={paused}
        >
          dispatch new bus
        </button>
        <button
          onClick={onPauseClick}
          className={numBusCurr === 0 ? classes.buttonDisabled : classes.button}
          type="button"
          disabled={numBusCurr === 0}
        >
          {paused ? "resume" : "pause"}
        </button>
        <button
          onClick={onSkipToEndClick}
          className={numBusCurr === 0 ? classes.buttonDisabled : classes.button}
          type="button"
          disabled={numBusCurr === 0}
        >
          skip to end
        </button>
      </div>
      {/* button controls */}
      <div className="flex justify-center py-3">{renderMap()}</div>
      <div>There are currently {numBusCurr} buses dispatched.</div>
      <div className="grid grid-cols-3 max-w-[100%] mx-auto">
        {Object.keys(busIndex).map((bus) => {
          return (
            <BusStatus
              key={bus}
              busNum={bus}
              busStopNum={busIndex[bus]}
              currStopDetails={stopObjs[busIndex[bus]]}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Maps;
