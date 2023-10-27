import React, { useState, useEffect } from "react";
import { getRecordsWithUniqueKey } from "../../util/mapHelper";
import MapsRewrite from "./MapsRewrite";
import PropTypes from "prop-types";

const MapsPageRewrite = React.memo(
  ({
    zoom,
    center,
    setCenter,
    setZoom,
    defaultStepInterval,
    stops,
    optimizedData,
    unoptimizedData,
    started,
    paused,
    ended,
    globalTime,
    mapContainerStyle,
  }) => {
    const [optimizedProcessed, setOptimizedProcessed] = useState({});
    const [unoptimizedProcessed, setUnoptimizedProcessed] = useState({});

    // console.log(`rerender MapsPage`);

    // process journeyData
    useEffect(() => {
      if (optimizedData !== 0 && unoptimizedData !== 0) {
        const optimizedSeparatedByKey = getRecordsWithUniqueKey(
          optimizedData,
          "timestamp",
          defaultStepInterval
        );
        const unoptimizedSeparatedByKey = getRecordsWithUniqueKey(
          unoptimizedData,
          "timestamp",
          defaultStepInterval
        );
        setOptimizedProcessed(optimizedSeparatedByKey);
        setUnoptimizedProcessed(unoptimizedSeparatedByKey);
      }
    }, [optimizedData.length, unoptimizedData.length, defaultStepInterval]);

    return (
      <div>
        <div className="flex justify-center mb-5">{/* for future */}</div>
        <div className="flex justify-evenly">
          <div className="w-full mx-5">
            <MapsRewrite
              title={"Baseline Model"}
              zoom={zoom}
              center={center}
              setCenter={setCenter}
              setZoom={setZoom}
              stops={stops}
              journeyData={unoptimizedProcessed}
              started={started}
              paused={paused}
              ended={ended}
              globalTime={globalTime}
              mapContainerStyle={mapContainerStyle}
            />
          </div>
          <div className="w-full mx-5">
            <MapsRewrite
              title={"Optimised Model"}
              zoom={zoom}
              center={center}
              setCenter={setCenter}
              setZoom={setZoom}
              stops={stops}
              journeyData={optimizedProcessed}
              started={started}
              paused={paused}
              ended={ended}
              globalTime={globalTime}
              mapContainerStyle={mapContainerStyle}
            />
          </div>
        </div>
      </div>
    );
  }
);

MapsPageRewrite.propTypes = {
  zoom: PropTypes.number,
  center: PropTypes.object,
  setCenter: PropTypes.func,
  setZoom: PropTypes.func,
  defaultStepInterval: PropTypes.number,
  stops: PropTypes.array,
  optimizedData: PropTypes.array,
  unoptimizedData: PropTypes.array,
  started: PropTypes.bool,
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  globalTime: PropTypes.number,
  mapContainerStyle: PropTypes.object,
};

MapsPageRewrite.displayName = "MapsPageRewrite";

export default MapsPageRewrite;
