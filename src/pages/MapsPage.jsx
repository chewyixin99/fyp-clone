import { useCallback, useState } from "react";
import Map from "../components/mapsPage/Map";
import {
  stopObjs,
  journeyMarkers,
  defaultBusIndexAfter,
  defaultBusIndexBefore,
} from "../data/constants";

const MapsPage = () => {
  const stopsBefore = stopObjs.before;
  const journeyBefore = journeyMarkers.before;
  const stopsAfter = stopObjs.after;
  const journeyAfter = journeyMarkers.after;

  const [busIndexBefore, setBusIndexBefore] = useState(defaultBusIndexBefore);
  const [busIndexAfter, setBusIndexAfter] = useState(defaultBusIndexAfter);
  const [numBusCurrBefore, setNumBusCurrBefore] = useState(0);
  const [numBusCurrAfter, setNumBusCurrAfter] = useState(0);

  const onDispatchBusesClick = () => {
    dispatchBusBefore();
    dispatchBusAfter();
  };

  const dispatchBusBefore = useCallback(() => {
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
  }, [busIndexBefore, numBusCurrBefore]);

  const dispatchBusAfter = useCallback(() => {
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
  }, [busIndexAfter, numBusCurrAfter]);

  const renderMapBefore = useCallback(() => {
    return (
      <Map
        busIndex={busIndexBefore}
        setBusIndex={setBusIndexBefore}
        numBusCurr={numBusCurrBefore}
        setNumBusCurr={setNumBusCurrBefore}
        isOptimized={false}
        stops={stopsBefore}
        journey={journeyBefore}
      />
    );
  }, [
    busIndexBefore,
    setBusIndexBefore,
    numBusCurrBefore,
    setNumBusCurrBefore,
    journeyBefore,
    stopsBefore,
  ]);

  const renderMapAfter = useCallback(() => {
    return (
      <Map
        busIndex={busIndexAfter}
        setBusIndex={setBusIndexAfter}
        numBusCurr={numBusCurrAfter}
        setNumBusCurr={setNumBusCurrAfter}
        isOptimized={true}
        stops={stopsAfter}
        journey={journeyAfter}
      />
    );
  }, [
    busIndexAfter,
    setBusIndexAfter,
    numBusCurrAfter,
    setNumBusCurrAfter,
    stopsAfter,
    journeyAfter,
  ]);

  return (
    <div>
      {/* Controls below */}
      <div>
        <div className="text-center mb-5">Controls</div>
        <div className="flex justify-center">
          <button
            type="button"
            className="control-button"
            onClick={onDispatchBusesClick}
          >
            dispatch buses
          </button>
        </div>
      </div>
      {/* Maps below */}
      <div className="flex justify-evenly my-10">
        <div className="w-[40vw] border">{renderMapBefore()}</div>
        <div className="w-[40vw] border">{renderMapAfter()}</div>
      </div>
    </div>
  );
};

export default MapsPage;
