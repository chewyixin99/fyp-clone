import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Map from "../components/mapsPage/Map";
import { stopObjs, journeyMarkers } from "../data/constants";
import { getRecordsWithUniqueKey } from "../util/mapHelper";

const MapsPage = ({
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
}) => {
  const stopsBefore = stopObjs.before;
  const stopsAfter = stopObjs.after;

  const journeyBefore = journeyMarkers.before;
  const journeyAfter = journeyMarkers.after;
  // * todo: unomment once full data out
  // const [journeyBefore, setJourneyBefore] = useState([]);
  // const [journeyAfter, setJourneyAfter] = useState([]);

  // * todo: unomment once full data out
  // const [polyPath, setPolyPath] = useState();

  // process journey data
  useEffect(() => {
    // todo: uncomment below once full data in
    let processedJourneyData = [];
    for (let i = 0; i < allJourneyData.length; i += 20) {
      processedJourneyData.push(allJourneyData[i]);
    }

    const tripData = getRecordsWithUniqueKey(processedJourneyData, "busTripNo");
    console.log(tripData);
    // * todo: unomment once full data out
    // setJourneyBefore(processedJourneyData);
    // setJourneyAfter(processedJourneyData);

    // * todo: unomment once full data out
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
            // * todo: unomment once full data out
            // polyPath={polyPath}
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
            // * todo: unomment once full data out
            // polyPath={polyPath}
          />
        </div>
      </div>
    </div>
  );
};

MapsPage.propTypes = {
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
};

export default MapsPage;
