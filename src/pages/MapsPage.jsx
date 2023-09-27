import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Map from "../components/mapsPage/Map";
import { stopObjs, journeyMarkers } from "../data/constants";
import { getAllUniqueValues, getRecordsWithUniqueKey } from "../util/mapHelper";

const MapsPage = ({
  started,
  paused,
  ended,
  setPaused,
  setEnded,
  busIndexBefore,
  busIndexAfter,
  setBusIndexBefore,
  setBusIndexAfter,
  numBusCurrBefore,
  numBusCurrAfter,
  setNumBusCurrBefore,
  setNumBusCurrAfter,
  zoom,
  setZoom,
  center,
  setCenter,
  allJourneyData,
  defaultIntervalTime,
  defaultInactiveOpacity,
  defaultActiveOpacity,
}) => {
  // used for polyLine and stop markers, static
  const stopsBefore = stopObjs.before;
  const stopsAfter = stopObjs.after;

  // used to display bus journey
  const journeyBefore = journeyMarkers.before;
  const journeyAfter = journeyMarkers.after;
  // * todo: uncomment once full data out
  const [journeyBeforeNew, setJourneyBeforeNew] = useState({});
  const [journeyAfterNew, setJourneyAfterNew] = useState({});

  // * todo: uncomment once full data out
  // const [polyPath, setPolyPath] = useState();

  // process journey data
  useEffect(() => {
    // todo: uncomment below once full data in
    let processedJourneyData = [];
    for (let i = 0; i < allJourneyData.length; i += 10) {
      processedJourneyData.push(allJourneyData[i]);
    }
    const tripData = getRecordsWithUniqueKey(processedJourneyData, "busTripNo");
    console.log(tripData);
    // * todo: uncomment once full data out
    setJourneyBeforeNew(tripData);
    setJourneyAfterNew(tripData);

    // initialize bus index dynamically
    let tmpBusIndexBefore = {};
    let tmpBusIndexAfter = {};
    for (const busIndex of getAllUniqueValues(
      processedJourneyData,
      "busTripNo"
    )) {
      tmpBusIndexBefore[busIndex - 1] = { currStop: -1 };
      tmpBusIndexAfter[busIndex - 1] = { currStop: -1 };
    }
    setBusIndexBefore(tmpBusIndexBefore);
    setBusIndexAfter(tmpBusIndexAfter);

    // * todo: uncomment once full data out
    // let tmpPolyPath = [];
    // for (const r of processedJourneyData) {
    //   if (r.lat !== undefined && r.lng !== undefined) {
    //     tmpPolyPath.push({ lat: r.lat, lng: r.lng });
    //   }
    // }
    // setPolyPath(tmpPolyPath);
    // console.log(tmpPolyPath);
  }, [allJourneyData]);

  return (
    <div>
      {/* Maps below */}
      <div className="flex justify-evenly my-10">
        <div className="w-[40vw] border">
          <Map
            started={started}
            busIndex={busIndexBefore}
            setBusIndex={setBusIndexBefore}
            numBusCurr={numBusCurrBefore}
            setNumBusCurr={setNumBusCurrBefore}
            isOptimized={false}
            stops={stopsBefore}
            journey={journeyBefore}
            // * todo: replace once full data in, for now its just to test
            journeyNew={journeyBeforeNew}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            setZoom={setZoom}
            center={center}
            setCenter={setCenter}
            ended={ended}
            setEnded={setEnded}
            defaultIntervalTime={defaultIntervalTime}
            defaultInactiveOpacity={defaultInactiveOpacity}
            defaultActiveOpacity={defaultActiveOpacity}
            // * todo: uncomment once full data out
            // polyPath={polyPath}
          />
        </div>
        <div className="w-[40vw] border">
          <Map
            started={started}
            busIndex={busIndexAfter}
            setBusIndex={setBusIndexAfter}
            numBusCurr={numBusCurrAfter}
            setNumBusCurr={setNumBusCurrAfter}
            isOptimized={true}
            stops={stopsAfter}
            journey={journeyAfter}
            // * todo: replace once full data in, for now its just to test
            journeyNew={journeyAfterNew}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            setZoom={setZoom}
            center={center}
            setCenter={setCenter}
            ended={ended}
            setEnded={setEnded}
            defaultIntervalTime={defaultIntervalTime}
            defaultInactiveOpacity={defaultInactiveOpacity}
            defaultActiveOpacity={defaultActiveOpacity}
            // * todo: uncomment once full data out
            // polyPath={polyPath}
          />
        </div>
      </div>
    </div>
  );
};

MapsPage.propTypes = {
  started: PropTypes.bool,
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  setPaused: PropTypes.func,
  setEnded: PropTypes.func,
  busIndexBefore: PropTypes.object,
  numBusCurrBefore: PropTypes.number,
  busIndexAfter: PropTypes.object,
  numBusCurrAfter: PropTypes.number,
  setBusIndexBefore: PropTypes.func,
  setNumBusCurrBefore: PropTypes.func,
  setBusIndexAfter: PropTypes.func,
  setNumBusCurrAfter: PropTypes.func,
  setCenter: PropTypes.func,
  setZoom: PropTypes.func,
  zoom: PropTypes.number,
  center: PropTypes.object,
  allJourneyData: PropTypes.array,
  defaultIntervalTime: PropTypes.number,
  defaultInactiveOpacity: PropTypes.number,
  defaultActiveOpacity: PropTypes.number,
};

export default MapsPage;
