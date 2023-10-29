import { useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import PropTypes from "prop-types";
import busStopPng from "../../assets/maps/busStopPng.png";
import bus1 from "../../assets/maps/num1.png";
import bus2 from "../../assets/maps/num2.png";
import bus3 from "../../assets/maps/num3.png";
import bus4 from "../../assets/maps/num4.png";
import bus5 from "../../assets/maps/num5.png";
import bus6 from "../../assets/maps/num6.png";
import bus7 from "../../assets/maps/num7.png";
import bus8 from "../../assets/maps/num8.png";
import bus9 from "../../assets/maps/num9.png";
import bus10 from "../../assets/maps/num10.png";
import bus11 from "../../assets/maps/num11.png";
import bus12 from "../../assets/maps/num12.png";
import bus13 from "../../assets/maps/num13.png";
import bus14 from "../../assets/maps/num14.png";
import bus15 from "../../assets/maps/num15.png";
import bus16 from "../../assets/maps/num16.png";
import bus17 from "../../assets/maps/num17.png";
import bus18 from "../../assets/maps/num18.png";
import bus19 from "../../assets/maps/num19.png";
import bus20 from "../../assets/maps/num20.png";

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
  10: bus11,
  11: bus12,
  12: bus13,
  13: bus14,
  14: bus15,
  15: bus16,
  16: bus17,
  17: bus18,
  18: bus19,
  19: bus20,
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
      iconUrl = iconMap[busNum % Object.keys(iconMap).length];
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
