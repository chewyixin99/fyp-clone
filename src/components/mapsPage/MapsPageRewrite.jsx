import { useState, useEffect } from "react";
import { getRecordsWithUniqueKey } from "../../util/mapHelper";
import MapsRewrite from "./MapsRewrite";
import PropTypes from "prop-types";

const MapsPageRewrite = ({
  zoom,
  center,
  setCenter,
  setZoom,
  defaultActiveOpacity,
  defaultInactiveOpacity,
  defaultIntervalTime,
  stops,
  journeyData,
  started,
  setEnded,
  paused,
  ended,
}) => {
  const [processedJourneyData, setProcessedJourneyData] = useState({});

  // process journeyData
  useEffect(() => {
    const tmpProcessedJourneyData = {};
    const journeyDataSeparatedByKey = getRecordsWithUniqueKey(
      journeyData,
      "busTripNo"
    );
    for (const busKey in journeyDataSeparatedByKey) {
      if (!isNaN(busKey)) {
        tmpProcessedJourneyData[busKey] = [];
        const busJourneyRecords = journeyDataSeparatedByKey[busKey];
        for (let i = 0; i < busJourneyRecords.length; i += 10) {
          tmpProcessedJourneyData[busKey].push(busJourneyRecords[i]);
        }
      }
    }
    setProcessedJourneyData(tmpProcessedJourneyData);
  }, [journeyData]);

  return (
    <div>
      <div className="flex justify-center mb-5">{/* for future */}</div>
      <div className="flex justify-evenly">
        <MapsRewrite
          title={"Before optimization"}
          zoom={zoom}
          center={center}
          setCenter={setCenter}
          setZoom={setZoom}
          defaultActiveOpacity={defaultActiveOpacity}
          defaultInactiveOpacity={defaultInactiveOpacity}
          stops={stops}
          defaultIntervalTime={defaultIntervalTime}
          journeyData={processedJourneyData}
          started={started}
          setEnded={setEnded}
          paused={paused}
          ended={ended}
        />
        <MapsRewrite
          title={"After optimization"}
          zoom={zoom}
          center={center}
          setCenter={setCenter}
          setZoom={setZoom}
          defaultActiveOpacity={defaultActiveOpacity}
          defaultInactiveOpacity={defaultInactiveOpacity}
          stops={stops}
          defaultIntervalTime={defaultIntervalTime}
          journeyData={processedJourneyData}
          started={started}
          setEnded={setEnded}
          paused={paused}
          ended={ended}
        />
      </div>
    </div>
  );
};

MapsPageRewrite.propTypes = {
  started: PropTypes.bool,
  stops: PropTypes.array,
  journeyData: PropTypes.array,
  paused: PropTypes.bool,
  zoom: PropTypes.number,
  setZoom: PropTypes.func,
  center: PropTypes.object,
  setCenter: PropTypes.func,
  ended: PropTypes.bool,
  setEnded: PropTypes.func,
  defaultIntervalTime: PropTypes.number,
  defaultInactiveOpacity: PropTypes.number,
  defaultActiveOpacity: PropTypes.number,
};

export default MapsPageRewrite;
