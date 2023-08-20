import { useCallback, useState, useEffect } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import { stopObjs } from "../data/constants";
import MarkerWithInfoWindow from "../components/MarkerWithInfoWindow";

const containerStyle = {
  width: "750px",
  height: "750px",
};

const defaultCenter = {
  lat: 52.111523,
  lng: 5.101634,
};

const defaultZoom = 14;

const classes = {
  button: "border hover:shadow-md px-3 py-1 rounded-md mx-3",
};

const Maps = () => {
  // map states
  // create an env variable with name 'VITE_MAPS_API_KEY' in your .env file to load this
  const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);
  // bus progress state
  const [markerIndex, setMarkerIndex] = useState(0);
  // stops
  const stops = stopObjs;

  const onLoad = useCallback((map) => {
    map.setZoom(zoom);
    setMap(map);
  }, []);

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

  // TODO: listen for bus location and do some action
  useEffect(() => {
    if (markerIndex >= stops.length) {
      return;
    }
    const interval = setInterval(() => {
      setMarkerIndex(markerIndex + 1);
      console.log("update bus location");
    }, 200);
    console.log(`bus location updated! ${markerIndex}`);
    stops[markerIndex].opacity = 0.4;
    // clear interval
    return () => clearInterval(interval);
  }, [markerIndex]);

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
            {stops.map((stop) => {
              if (stop === null) {
                return;
              }
              const markerWithInfoWindow = (
                <MarkerWithInfoWindow key={stop.stopId} stop={stop} map={map} />
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
    <div>
      <div className="flex justify-center py-3">
        Maps is currently loaded for this&nbsp;
        <Link
          className="text-blue-600 hover:underline"
          to="https://moovitapp.com/netherlands-101/lines/3/756601/3334111/en?ref=2&poiType=line&customerId=4908&af_sub8=%2Findex%2Fen%2Fpublic_transit-line-3-Netherlands-101-1210496-756601-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          bus route
        </Link>
      </div>
      <div className="flex justify-center py-3">
        <button
          onClick={resetZoomAndCenter}
          className={classes.button}
          type="button"
        >
          reset zoom and center
        </button>
      </div>
      {/* button controls */}
      <div className="flex justify-center py-3">{renderMap()}</div>
    </div>
  );
};

export default Maps;
