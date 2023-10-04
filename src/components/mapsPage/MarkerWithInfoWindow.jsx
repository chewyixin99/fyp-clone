import { useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import PropTypes from "prop-types";
import busStopPng from "../../assets/busStopPng.png";
import bus1 from "../../assets/num1.png";
import bus2 from "../../assets/num2.png";
import bus3 from "../../assets/num3.png";
import bus4 from "../../assets/num4.png";
import bus5 from "../../assets/num5.png";
import bus6 from "../../assets/num6.png";
import bus7 from "../../assets/num7.png";
import bus8 from "../../assets/num8.png";
import bus9 from "../../assets/num9.png";
import bus10 from "../../assets/num10.png";

const iconMap = {
  0: bus1,
  1: bus2,
  2: bus3,
  3: bus4,
  4: bus5,
  5: bus6,
  6: bus7,
  7: bus8,
  8: bus9,
  9: bus10,
};

const MarkerWithInfoWindow = ({ stop, map, busNum = -1 }) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const onMarkerClick = () => {
    setInfoOpen(true);
  };
  const onCloseClick = () => {
    setInfoOpen(false);
  };

  let iconUrl;
  let anchorValue;
  let scaledSizeValue;

  if (stop.opacity !== 1) {
    iconUrl = busStopPng;
    anchorValue = new window.google.maps.Point(15, 30);
    scaledSizeValue = new window.google.maps.Size(30, 30);
  } else if (stop.opacity === 1) {
    if (busNum !== -1) {
      iconUrl = iconMap[busNum];
      anchorValue = new window.google.maps.Point(25, 50);
      scaledSizeValue = new window.google.maps.Size(50, 50);
    } else {
      iconUrl = busStopPng;
      anchorValue = new window.google.maps.Point(15, 30);
      scaledSizeValue = new window.google.maps.Size(30, 30);
    }
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
        anchor: anchorValue,
        origin: new window.google.maps.Point(0, 0),
        scaledSize: scaledSizeValue,
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
  busNum: PropTypes.number,
};

export default MarkerWithInfoWindow;
