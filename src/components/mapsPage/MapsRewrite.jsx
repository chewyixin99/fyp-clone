import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Polyline } from "@react-google-maps/api";
import MarkerWithInfoWindow from "../mapsPage/MarkerWithInfoWindow";
import PropTypes from "prop-types";
import BusStatus from "./BusStatus";

const MapsRewrite = React.memo(
  ({
    title,
    zoom,
    center,
    setCenter,
    setZoom,
    stops,
    journeyData,
    started,
    paused,
    ended,
    setEnded,
    globalTime,
    mapContainerStyle,
  }) => {
    // create an env variable with name 'VITE_MAPS_API_KEY' in your .env file to load this
    const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;
    const [map, setMap] = useState();
    const [polyPath, setPolyPath] = useState([]);
    const [numBusCurr, setNumBusCurr] = useState(0);
    const [numBusDispatched, setNumBusDispatched] = useState(0);
    const [journeyState, setJourneyState] = useState(journeyData);

    // console.log("rerendering Maps");

    useEffect(() => {
      setJourneyState(journeyData);
    }, [journeyData]);

    const renderJourneyMarkers = () => {
      if (ended) {
        return;
      }
      if (Object.keys(journeyState).length === 0) {
        return;
      }
      if (journeyState[globalTime - 1] === undefined) {
        return;
      }
      const allJourneyMarkers = [];
      for (const rec of journeyState[globalTime - 1]) {
        rec.opacity = 1;
        const marker = (
          <MarkerWithInfoWindow
            key={rec.timestamp + rec.busTripNo}
            stop={rec}
            map={map}
            busNum={parseInt(rec.busTripNo) - 1}
          />
        );
        allJourneyMarkers.push(marker);
      }
      return allJourneyMarkers;
    };

    const renderBusStatus = () => {
      const allBusStatus = [];
      if (ended) {
        return <BusStatus busNum={0} />;
      }
      if (Object.keys(journeyState).length === 0) {
        return <BusStatus busNum={0} />;
      }
      if (journeyState[globalTime - 1] === undefined) {
        return <BusStatus busNum={0} />;
      }
      const allStopDetails = journeyState[globalTime - 1];
      allStopDetails.sort((a, b) => a.busTripNo - b.busTripNo);
      for (const stopDetails of allStopDetails) {
        const busStatus = (
          <BusStatus
            key={stopDetails.timestamp + stopDetails.busTripNo}
            busNum={parseInt(stopDetails.busTripNo) - 1}
            currStopDetails={stopDetails}
          />
        );
        allBusStatus.push(busStatus);
      }
      allBusStatus.sort((a, b) => a.busTripNo - b.busTripNo);
      return allBusStatus;
    };

    useEffect(() => {
      if (journeyState[globalTime - 1] !== undefined) {
        if (started && !paused && !ended) {
          // set curr opacity and prev opacity
          const currMarkers = journeyState[globalTime - 1];
          setNumBusCurr(currMarkers.length);
          if (numBusDispatched < currMarkers.length) {
            setNumBusDispatched(currMarkers.length);
          }
        } else if (ended) {
          console.log("reset states");
          setNumBusCurr(0);
          setNumBusDispatched(0);
        }
      } else {
        // setEnded(true);
        setNumBusCurr(0);
      }
    }, [started, paused, ended, journeyState, globalTime]);

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

    const renderMap = () => {
      return (
        <div>
          <LoadScript googleMapsApiKey={MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
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
              {renderJourneyMarkers()}
            </GoogleMap>
          </LoadScript>
        </div>
      );
    };

    return (
      <div className="border rounded-md">
        <h6 className="my-3 px-5 font-extrabold tracking-tight">{title}</h6>
        <hr />
        <div className="my-3 px-5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">Dispatched</div>
            <div className="px-3 py-1 border rounded-md mr-5 font-bold">
              {numBusDispatched}
            </div>
            <div className="mr-3">In journey</div>
            <div className="px-3 py-1 border rounded-md mr-5 font-bold">
              {numBusCurr}
            </div>
          </div>
          <div>{/* RHS */}</div>
        </div>
        <div>{renderMap()}</div>
        <div className="grid grid-cols-3 max-w-[100%] mx-auto">
          {renderBusStatus()}
        </div>
      </div>
    );
  }
);

MapsRewrite.propTypes = {
  title: PropTypes.string,
  zoom: PropTypes.number,
  center: PropTypes.object,
  setCenter: PropTypes.func,
  setZoom: PropTypes.func,
  stops: PropTypes.array,
  journeyData: PropTypes.object,
  started: PropTypes.bool,
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  setEnded: PropTypes.func,
  globalTime: PropTypes.number,
  mapContainerStyle: PropTypes.object,
};

MapsRewrite.displayName = "MapsRewrite";

export default MapsRewrite;
