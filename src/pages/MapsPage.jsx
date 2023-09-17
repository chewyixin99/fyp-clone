import { useState } from "react";
import Map from "../components/mapsPage/Map";
import MultiMapControls from "../components/mapsPage/MultiMapControls";
import {
  stopObjs,
  journeyMarkers,
  defaultBusIndexAfter,
  defaultBusIndexBefore,
} from "../data/constants";

const defaultCenter = {
  lat: 45.488184,
  lng: -122.399686,
};

const defaultZoom = 14;

const MapsPage = () => {
  const stopsBefore = stopObjs.before;
  const journeyBefore = journeyMarkers.before;
  const stopsAfter = stopObjs.after;
  const journeyAfter = journeyMarkers.after;

  const [busIndexBefore, setBusIndexBefore] = useState(defaultBusIndexBefore);
  const [busIndexAfter, setBusIndexAfter] = useState(defaultBusIndexAfter);
  const [numBusCurrBefore, setNumBusCurrBefore] = useState(0);
  const [numBusCurrAfter, setNumBusCurrAfter] = useState(0);

  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [zoom, setZoom] = useState(defaultZoom);
  const [center, setCenter] = useState(defaultCenter);

  return (
    <div>
      {/* Controls below */}
      <MultiMapControls
        busIndexBefore={busIndexBefore}
        busIndexAfter={busIndexAfter}
        numBusCurrBefore={numBusCurrBefore}
        numBusCurrAfter={numBusCurrAfter}
        paused={paused}
        ended={ended}
        setBusIndexBefore={setBusIndexBefore}
        setBusIndexAfter={setBusIndexAfter}
        setNumBusCurrBefore={setNumBusCurrBefore}
        setNumBusCurrAfter={setNumBusCurrAfter}
        setCenter={setCenter}
        setZoom={setZoom}
        setPaused={setPaused}
        setEnded={setEnded}
      />
      {/* Maps below */}
      <div className="flex justify-evenly my-10">
        <div className="w-[40vw] border">
          <Map
            busIndex={busIndexBefore}
            setBusIndex={setBusIndexBefore}
            numBusCurr={numBusCurrBefore}
            setNumBusCurr={setNumBusCurrBefore}
            isOptimized={false}
            stops={stopsBefore}
            journey={journeyBefore}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            setZoom={setZoom}
            center={center}
            setCenter={setCenter}
            ended={ended}
            setEnded={setEnded}
          />
        </div>
        <div className="w-[40vw] border">
          <Map
            busIndex={busIndexAfter}
            setBusIndex={setBusIndexAfter}
            numBusCurr={numBusCurrAfter}
            setNumBusCurr={setNumBusCurrAfter}
            isOptimized={true}
            stops={stopsAfter}
            journey={journeyAfter}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            setZoom={setZoom}
            center={center}
            setCenter={setCenter}
            ended={ended}
            setEnded={setEnded}
          />
        </div>
      </div>
    </div>
  );
};

export default MapsPage;
