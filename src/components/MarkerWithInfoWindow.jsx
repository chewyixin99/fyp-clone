import { useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import PropTypes from "prop-types";
import busStopPng from "../assets/busStopPng.png";

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
      icon={{
        url: busStopPng,
        anchor: new window.google.maps.Point(25, 50),
        origin: new window.google.maps.Point(0, 0),
        scaledSize: new window.google.maps.Size(50, 50),
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
