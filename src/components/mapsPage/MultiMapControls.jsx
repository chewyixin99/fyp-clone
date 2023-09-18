import { busesCurrentlyInJourney, isBusInJourney } from "../../util/mapHelper";
import PropTypes from "prop-types";

const defaultCenter = {
  lat: 45.488184,
  lng: -122.399686,
};

const defaultZoom = 14;

const MultiMapControls = ({
  busIndexBefore,
  numBusCurrBefore,
  busIndexAfter,
  numBusCurrAfter,
  paused,
  setBusIndexBefore,
  setNumBusCurrBefore,
  setBusIndexAfter,
  setNumBusCurrAfter,
  setEnded,
  setPaused,
  setCenter,
  setZoom,
}) => {
  const onDispatchBusesClick = () => {
    setEnded(false);
    let busIndexBeforeCopy = JSON.parse(JSON.stringify(busIndexBefore));
    for (const bus in busIndexBeforeCopy) {
      if (busIndexBeforeCopy[bus].currStop === -1) {
        busIndexBeforeCopy[bus].currStop = 0;
        console.log(
          `add 1 bus to loop: numBuses now = ${numBusCurrBefore + 1}`
        );
        setNumBusCurrBefore(numBusCurrBefore + 1);
        setBusIndexBefore(busIndexBeforeCopy);
        break;
      }
    }
    let busIndexAfterCopy = JSON.parse(JSON.stringify(busIndexAfter));
    for (const bus in busIndexAfterCopy) {
      if (busIndexAfterCopy[bus].currStop === -1) {
        busIndexAfterCopy[bus].currStop = 0;
        console.log(`add 1 bus to loop: numBuses now = ${numBusCurrAfter + 1}`);
        setNumBusCurrAfter(numBusCurrAfter + 1);
        setBusIndexAfter(busIndexAfterCopy);
        break;
      }
    }
  };

  const onPauseClick = () => {
    if (busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])) {
      if (!paused) {
        // Before
        let tmpBusIndexBefore = JSON.parse(JSON.stringify(busIndexBefore));
        for (const bus in tmpBusIndexBefore) {
          if (isBusInJourney(tmpBusIndexBefore[bus])) {
            tmpBusIndexBefore[bus].currStop += 1;
          }
        }
        setBusIndexBefore(tmpBusIndexBefore);
        // After
        let tmpBusIndexAfter = JSON.parse(JSON.stringify(busIndexAfter));
        for (const bus in tmpBusIndexAfter) {
          if (isBusInJourney(tmpBusIndexAfter[bus])) {
            tmpBusIndexAfter[bus].currStop += 1;
          }
        }
        setBusIndexAfter(tmpBusIndexAfter);
      }
      setPaused(!paused);
    }
  };

  const resetZoomAndCenter = () => {
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  const onSkipToEndClick = () => {
    if (busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])) {
      // update all buses to -1, to signify that all has ended their journey
      // before
      let tmpBusIndexCopyBefore = JSON.parse(JSON.stringify(busIndexBefore));
      for (const bus in tmpBusIndexCopyBefore) {
        tmpBusIndexCopyBefore[bus].currStop = -1;
      }
      setBusIndexBefore(tmpBusIndexCopyBefore);
      // after
      let tmpBusIndexCopyAfter = JSON.parse(JSON.stringify(busIndexAfter));
      for (const bus in tmpBusIndexCopyAfter) {
        tmpBusIndexCopyAfter[bus].currStop = -1;
      }
      setBusIndexAfter(tmpBusIndexCopyAfter);
      setEnded(true);
    }
  };

  return (
    <div>
      <div className="text-center mb-5">Controls</div>
      <div className="flex justify-center">
        <button
          className={paused ? `control-button-disabled` : `control-button`}
          type="button"
          disabled={paused}
          onClick={onDispatchBusesClick}
        >
          dispatch buses
        </button>
        <button
          onClick={onPauseClick}
          className={
            !busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])
              ? `control-button-disabled`
              : `control-button`
          }
          type="button"
          disabled={
            !busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])
          }
        >
          {paused ? "resume" : "pause"}
        </button>
        <button
          onClick={onSkipToEndClick}
          className={
            !busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])
              ? `control-button-disabled`
              : `control-button`
          }
          type="button"
          disabled={
            !busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])
          }
        >
          skip to end / reset
        </button>
        <button
          onClick={resetZoomAndCenter}
          className={`control-button`}
          type="button"
        >
          reset zoom and center
        </button>
      </div>
    </div>
  );
};

MultiMapControls.propTypes = {
  busIndexBefore: PropTypes.object,
  numBusCurrBefore: PropTypes.number,
  busIndexAfter: PropTypes.object,
  numBusCurrAfter: PropTypes.number,
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  setBusIndexBefore: PropTypes.func,
  setNumBusCurrBefore: PropTypes.func,
  setBusIndexAfter: PropTypes.func,
  setNumBusCurrAfter: PropTypes.func,
  setCenter: PropTypes.func,
  setZoom: PropTypes.func,
  setPaused: PropTypes.func,
  setEnded: PropTypes.func,
};

export default MultiMapControls;
