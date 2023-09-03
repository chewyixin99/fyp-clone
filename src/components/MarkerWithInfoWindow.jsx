import { useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import PropTypes from "prop-types";
import busStopPng from "../assets/busStopPng.png";
import busFaceRight from "../assets/busFaceRight.png";
import busFaceLeft from "../assets/busFaceLeft.png";

const MarkerWithInfoWindow = ({ stop, map, data, index }) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const onMarkerClick = () => {
    setInfoOpen(true);
  };
  const onCloseClick = () => {
    setInfoOpen(false);
  };

  let iconUrl;
  if (stop.opacity !== 1) {
    iconUrl = busStopPng;
  } else if (stop.opacity === 1) {
    iconUrl = index < data.length / 2 ? busFaceRight : busFaceLeft;
  }

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
        url: iconUrl,
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
  data: PropTypes.array,
  index: PropTypes.number,
};

export default MarkerWithInfoWindow;
