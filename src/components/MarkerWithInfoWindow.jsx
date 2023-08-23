import { useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import PropTypes from "prop-types";

const MarkerWithInfoWindow = ({ stop, map }) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const onMarkerClick = () => {
    setInfoOpen(true);
  };
  const onCloseClick = () => {
    setInfoOpen(false);
  };

  const infoWindow = (
    <InfoWindow onCloseClick={onCloseClick}>
      <div>
        <p>stopName: {stop.stopName}</p>
        <p>stopId: {stop.stopId}</p>
        <p>lat: {stop.lat}</p>
        <p>lng: {stop.lng}</p>
      </div>
    </InfoWindow>
  );
  const marker = (
    <Marker
      key={stop.stopId}
      title={stop.stopName}
      map={map}
      position={{
        lat: stop.lat,
        lng: stop.lng,
      }}
      onClick={onMarkerClick}
      options={{
        opacity: stop.opacity,
      }}
    >
      {infoOpen && infoWindow}
    </Marker>
  );

  return marker;
};

MarkerWithInfoWindow.propTypes = {
  stop: PropTypes.object,
  map: PropTypes.object,
};

export default MarkerWithInfoWindow;
