import { useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import PropTypes from "prop-types";

const MarkerWithInfoWindow = ({ stop, map }) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const onMarkerClick = () => {
    setInfoOpen(true);
  };

  const infoWindow = (
    <InfoWindow
      onCloseClick={() => {
        setInfoOpen(false);
      }}
    >
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
      map={map}
      position={{
        lat: stop.lat,
        lng: stop.lng,
      }}
      onClick={onMarkerClick}
    >
      {infoOpen && infoWindow}
    </Marker>
  );

  return marker;
};

MarkerWithInfoWindow.propTypes = {
  stop: PropTypes.object,
};

export default MarkerWithInfoWindow;
