import { useState } from "react";
import {
  defaultBusIndexAfter,
  defaultBusIndexBefore,
  defaultCenter,
  defaultZoom,
} from "../data/constants";
import { busesCurrentlyInJourney, isBusInJourney } from "../util/mapHelper";
import MapsPage from "./MapsPage";

const CombinedPage = () => {
  // yixin states
  const [zoom, setZoom] = useState(defaultZoom);
  const [center, setCenter] = useState(defaultCenter);
  const [busIndexBefore, setBusIndexBefore] = useState(defaultBusIndexBefore);
  const [busIndexAfter, setBusIndexAfter] = useState(defaultBusIndexAfter);
  const [numBusCurrBefore, setNumBusCurrBefore] = useState(0);
  const [numBusCurrAfter, setNumBusCurrAfter] = useState(0);
  // end of yixin states
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);

  const onStartClick = () => {
    // yixin logic
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
    // end of yixin logic
  };

  const onPauseClick = () => {
    // start of yixin logic
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
    // end of yixin logic
  };

  const onEndClick = () => {
    // start of yixin logic
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
    // end of yixin logic
  };

  const onResetZoomAndCenterClick = () => {
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  return (
    <div>
      {/* test buttons to test logic */}
      <div className="flex justify-center items-center py-5">
        <button
          onClick={onStartClick}
          type="button"
          className={paused ? "control-button-disabled" : "control-button"}
        >
          start
        </button>
        <button
          onClick={onPauseClick}
          type="button"
          className={
            !busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])
              ? `control-button-disabled`
              : `control-button`
          }
        >
          {paused ? "resume" : "pause"}
        </button>
        <button
          onClick={onEndClick}
          type="button"
          className={
            !busesCurrentlyInJourney([numBusCurrBefore, numBusCurrAfter])
              ? `control-button-disabled`
              : `control-button`
          }
        >
          end
        </button>
        <button
          onClick={onResetZoomAndCenterClick}
          type="button"
          className="control-button"
        >
          reset zoom and center map
        </button>
      </div>
      {/* JianLin's component */}
      <div className=""></div>
      {/* Yixin's component */}
      <div className="">
        <MapsPage
          paused={paused}
          ended={ended}
          setPaused={setPaused}
          setEnded={setEnded}
          zoom={zoom}
          setZoom={setZoom}
          center={center}
          setCenter={setCenter}
          busIndexBefore={busIndexBefore}
          setBusIndexBefore={setBusIndexBefore}
          busIndexAfter={busIndexAfter}
          setBusIndexAfter={setBusIndexAfter}
          numBusCurrBefore={numBusCurrBefore}
          numBusCurrAfter={numBusCurrAfter}
          setNumBusCurrBefore={setNumBusCurrBefore}
          setNumBusCurrAfter={setNumBusCurrAfter}
        />
      </div>
    </div>
  );
};

export default CombinedPage;
