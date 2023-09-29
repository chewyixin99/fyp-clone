import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Polyline } from "@react-google-maps/api";
import MarkerWithInfoWindow from "../mapsPage/MarkerWithInfoWindow";
import { resetOpacity } from "../../util/mapHelper";
import PropTypes from "prop-types";
import BusStatus from "./BusStatus";

const containerStyle = {
  width: "40vw",
  height: "30vw",
};

const MapsRewrite = React.memo(
  ({
    title,
    zoom,
    center,
    setCenter,
    setZoom,
    defaultActiveOpacity,
    defaultInactiveOpacity,
    stops,
    defaultIntervalTime,
    journeyData,
    started,
    paused,
    ended,
    setEnded,
    globalTime,
  }) => {
    // create an env variable with name 'VITE_MAPS_API_KEY' in your .env file to load this
    const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;
    const [map, setMap] = useState();
    const [polyPath, setPolyPath] = useState([]);
    const [busesPos, setBusesPos] = useState({});
    const [numBusCurr, setNumBusCurr] = useState(0);
    const [numBusDispatched, setNumBusDispatched] = useState(0);
    const [journeyState, setJourneyState] = useState(journeyData);

    // console.log("rerendering Maps");

    // initialize states
    useEffect(() => {
      const initBusesPos = {};
      for (const bus of Object.keys(journeyData)) {
        initBusesPos[bus] = -1;
      }
      setBusesPos(initBusesPos);
      setJourneyState(journeyData);
    }, [journeyData]);

    // reset map states
    useEffect(() => {}, [ended]);

    useEffect(() => {
      if (started && !paused && !ended) {
        // create a copy and update before setting the new state
        let tmpBusesPos = JSON.parse(JSON.stringify(busesPos));

        // condition only for first bus
        if (tmpBusesPos[0] === -1 && started && numBusCurr === 0) {
          tmpBusesPos[0] += 1;
          setNumBusCurr(numBusCurr + 1);
          setNumBusDispatched(numBusDispatched + 1);
        }

        for (const bus in tmpBusesPos) {
          let currBusStop = tmpBusesPos[bus];
          let currBusJourney = journeyState[bus];

          if (currBusStop === -1) {
            const startTime = currBusJourney[0].timestamp;
            if (globalTime < startTime) {
              // continue next loop if don't satisfy
              continue;
            }
            console.log(`bus dispatch for bus ${bus}, numBusCurr ${numBusCurr + 1}`);
            tmpBusesPos[bus] += 1;
            setNumBusCurr(numBusCurr + 1);
            setNumBusDispatched(numBusDispatched + 1);
          }

          // bus at last stop
          if (currBusStop < 0) {
            // pass
            // -2 = dispatched, started, and ended
            // -1 = not dispatched, not started
          } else if (currBusStop === 0) {
            // bus at first stop
            journeyState[bus][currBusStop].opacity = defaultActiveOpacity;
            tmpBusesPos[bus] += 1;
          } else if (currBusStop >= currBusJourney.length) {
            console.log(`bus ${bus} ending journey... num bus curr ${numBusCurr - 1}`);
            journeyState[bus][currBusStop - 1].opacity = defaultInactiveOpacity;
            tmpBusesPos[bus] = -2;
            // end once last bus reach end
            if (numBusCurr - 1 === 0 && numBusDispatched >= Object.keys(journeyState).length) {
              setEnded(true);
            }
            setNumBusCurr(numBusCurr - 1);
            resetOpacity(journeyState[bus]);
          } else {
            // bus in journey
            journeyState[bus][currBusStop].opacity = defaultActiveOpacity;
            journeyState[bus][currBusStop - 1].opacity = defaultInactiveOpacity;
            tmpBusesPos[bus] += 1;
          }
        }

        const interval = setInterval(() => {
          // set stops to updated stopMarkers
          setBusesPos(tmpBusesPos);
        }, defaultIntervalTime);
        return () => clearInterval(interval);
      } else if (ended) {
        console.log("reset states");
        for (const bus in Object.keys(journeyState)) {
          resetOpacity(journeyState[bus]);
          busesPos[bus] = -1;
        }
        setNumBusCurr(0);
        setNumBusDispatched(0);
      }
    }, [started, paused, ended, busesPos, journeyState]);

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

    // initial render data for stops
    useEffect(() => {
      let tmpPolyPath = [];
      for (const point of stops) {
        tmpPolyPath.push({ lat: point.lat, lng: point.lng });
      }
      setPolyPath(tmpPolyPath);
    }, [stops]);

    const initJourneyMarkers = () => {
      const allJourneyMarkers = [];
      if (Object.keys(journeyState).length !== 0) {
        for (const bus in journeyState) {
          journeyState[bus].map((point, index) => {
            if (point === null) {
              return;
            }
            const markerWithInfoWindow = (
              <MarkerWithInfoWindow
                key={index + bus} // just to make it unique and console won't have errors
                data={journeyState[bus]}
                index={index}
                stop={point}
                map={map}
              />
            );
            allJourneyMarkers.push(markerWithInfoWindow);
          });
        }
      }
      return allJourneyMarkers;
    };

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
              {/* journey markers */}
              {initJourneyMarkers()}
            </GoogleMap>
          </LoadScript>
        </div>
      );
    };

    return (
      <div className="border rounded-md">
        <div className="my-3 px-5">{title}</div>
        <div className="my-3 px-5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">Dispatched</div>
            <div className="px-3 py-1 border rounded-md mr-5 font-bold">{numBusDispatched}</div>
            <div className="mr-3">In journey</div>
            <div className="px-3 py-1 border rounded-md mr-5 font-bold">{numBusCurr}</div>
          </div>
          <div>{/* RHS */}</div>
        </div>
        <div>{renderMap()}</div>
        <div className="grid grid-cols-3 max-w-[100%] mx-auto">
          {Object.keys(busesPos).map((b) => {
            return (
              <BusStatus key={b} busNum={b} currStopDetails={journeyState[b][busesPos[b] - 1]} />
            );
          })}
        </div>
      </div>
    );
  }
);

MapsRewrite.propTypes = {
  started: PropTypes.bool,
  stops: PropTypes.array,
  journeyData: PropTypes.object,
  paused: PropTypes.bool,
  zoom: PropTypes.number,
  setZoom: PropTypes.func,
  center: PropTypes.object,
  setCenter: PropTypes.func,
  ended: PropTypes.bool,
  setEnded: PropTypes.func,
  defaultIntervalTime: PropTypes.number,
  defaultInactiveOpacity: PropTypes.number,
  defaultActiveOpacity: PropTypes.number,
  title: PropTypes.string,
  globalTime: PropTypes.number,
};

MapsRewrite.displayName = "MapsRewrite";

export default MapsRewrite;
