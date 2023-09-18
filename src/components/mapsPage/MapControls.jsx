import PropTypes from "prop-types";
import { isBusInJourney } from "../../util/mapHelper";

const MapControls = ({
  busIndex,
  setBusIndex,
  defaultCenter,
  setCenter,
  defaultZoom,
  setZoom,
  numBusCurr,
  setNumBusCurr,
  paused,
  setPaused,
  setEnded,
}) => {
  const resetZoomAndCenter = () => {
    setCenter(defaultCenter);
    setZoom(defaultZoom);
    console.log("reset clicked");
  };

  const onStartBusClick = () => {
    // on click, check if there are any buses running
    // if yes, set the first free bus to 0 (from -1) to start the loop
    setEnded(false);
    for (const bus in busIndex) {
      if (!isBusInJourney(busIndex[bus])) {
        setBusIndex({
          ...busIndex,
          [bus]: {
            ...busIndex[bus],
            currStop: 0,
          },
        });
        console.log(`add 1 bus to loop: numBuses now = ${numBusCurr + 1}`);
        // update num buses currently in loop
        setNumBusCurr(numBusCurr + 1);
        break;
      }
    }
  };

  const onPauseClick = () => {
    if (numBusCurr !== 0) {
      // if resume
      if (!paused) {
        // update all buses to -1, to signify that all has ended their journey
        let tmpBusIndex = JSON.parse(JSON.stringify(busIndex));
        for (const bus in tmpBusIndex) {
          if (isBusInJourney(tmpBusIndex[bus])) {
            tmpBusIndex[bus].currStop += 1;
          }
        }
        setBusIndex(tmpBusIndex);
      }
      setPaused(!paused);
    }
  };

  const onSkipToEndClick = () => {
    if (numBusCurr !== 0) {
      // update all buses to -1, to signify that all has ended their journey
      let tmpBusIndexCopy = JSON.parse(JSON.stringify(busIndex));
      for (const bus in tmpBusIndexCopy) {
        tmpBusIndexCopy[bus].currStop = -1;
      }
      setBusIndex(tmpBusIndexCopy);
      setEnded(true);
    }
  };
  return (
    <div className="flex justify-center py-3">
      <button
        onClick={resetZoomAndCenter}
        className={`control-button`}
        type="button"
      >
        reset zoom and center
      </button>
      <button
        onClick={onStartBusClick}
        className={paused ? `control-button-disabled` : `control-button`}
        type="button"
        disabled={paused}
      >
        dispatch new bus
      </button>
      <button
        onClick={onPauseClick}
        className={
          numBusCurr === 0 ? `control-button-disabled` : `control-button`
        }
        type="button"
        disabled={numBusCurr === 0}
      >
        {paused ? "resume" : "pause"}
      </button>
      <button
        onClick={onSkipToEndClick}
        className={
          numBusCurr === 0 ? `control-button-disabled` : `control-button`
        }
        type="button"
        disabled={numBusCurr === 0}
      >
        skip to end / reset
      </button>
    </div>
  );
};

MapControls.propTypes = {
  busIndex: PropTypes.object,
  defaultCenter: PropTypes.object,
  defaultZoom: PropTypes.number,
  numBusCurr: PropTypes.number,
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  setBusIndex: PropTypes.func,
  setCenter: PropTypes.func,
  setZoom: PropTypes.func,
  setNumBusCurr: PropTypes.func,
  setPaused: PropTypes.func,
  setEnded: PropTypes.func,
};

export default MapControls;
