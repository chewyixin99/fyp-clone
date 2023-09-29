import { useState, useEffect } from "react";
import { stopObjsBefore } from "../data/constants";
import Journey from "../components/Journey";
import Papa from "papaparse";
import MapsPageRewrite from "../components/mapsPage/MapsPageRewrite";

const defaultIntervalTime = 100;
const defaultInactiveOpacity = 0;
const defaultActiveOpacity = 1;
const defaultCenter = {
  lat: 45.488184,
  lng: -122.399686,
};
const defaultZoom = 13;
const defaultStepInterval = defaultIntervalTime / 10;

const stops = stopObjsBefore;

const CombinedPage = () => {
  // yixin states
  const [zoom, setZoom] = useState(defaultZoom);
  const [center, setCenter] = useState(defaultCenter);
  const [mapsGlobalTime, setMapsGlobalTime] = useState(0);
  // end of yixin states

  // jianlin states
  const [start, setStart] = useState(false);
  // end of jianlin states

  // combined
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [journeyData, setJourneyData] = useState([]);
  const [globalTime, setGlobalTime] = useState(0);

  const fetchData = async () => {
    Papa.parse("./v1.1_output.csv", {
      // options
      download: true,
      complete: (res) => {
        const tmpJourneyData = [];
        const data = res.data.slice(1);
        for (let i = 0; i < data.length; i++) {
          const rowData = data[i];
          tmpJourneyData.push({
            timestamp: parseFloat(rowData[0]),
            lat: parseFloat(rowData[4]),
            lng: parseFloat(rowData[5]),
            opacity: 0,
            stopId: "to be filled",
            stopName: "to be filled",
            busStopNo: parseInt(rowData[3]),
            currentStatus: rowData[2],
            busTripNo: parseInt(rowData[1]),
            distance: parseFloat(rowData[6]),
          });
        }
        setJourneyData(tmpJourneyData);
        if (tmpJourneyData.length > 0) {
          setGlobalTime(tmpJourneyData[0].timestamp);
          setMapsGlobalTime(tmpJourneyData[0].timestamp);
        }
      },
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onStartClick = () => {
    console.log("start clicked");
    setEnded(false);
    setStart(true);
  };

  const onPauseClick = () => {
    setPaused(!paused);
  };

  const onEndClick = () => {
    setStart(false);
    setEnded(true);
    setPaused(false);
  };

  const onResetZoomAndCenterClick = () => {
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  // global time to sync between both maps and line component
  useEffect(() => {
    if (start && !paused && !ended) {
      // iterate time
      const interval = setInterval(() => {
        if ((globalTime + 1 - mapsGlobalTime) % defaultStepInterval === 0) {
          // pass
          setMapsGlobalTime(globalTime + 1);
          // console.log(`update, currTime is ${globalTime + 1}`);
        }
        setGlobalTime(globalTime + 1);
        // console.log(`currTime is ${globalTime + 1}`);
      }, 10);
      return () => clearInterval(interval);
    } else if (paused) {
      // pass
      console.log("paused");
    } else if (ended) {
      // reset to the start time of the first bus
      setGlobalTime(journeyData[0].timestamp);
      console.log("ended");
    }
  }, [start, paused, ended, globalTime]);

  return (
    <div>
      {/* test buttons to test logic */}
      <div className="flex justify-center items-center py-5">
        <button
          onClick={onStartClick}
          type="button"
          className={paused ? "control-button-disabled" : "control-button"}
          disabled={paused}
        >
          start
        </button>
        <button
          onClick={onPauseClick}
          type="button"
          className={ended ? `control-button-disabled` : `control-button`}
        >
          {paused ? "resume" : "pause"}
        </button>
        <button onClick={onEndClick} type="button" className={`control-button`}>
          end
        </button>
        <button onClick={onResetZoomAndCenterClick} type="button" className="control-button">
          reset zoom and center map
        </button>
      </div>
      {/* JianLin's component */}
      <div className="">
        <Journey 
        paused={paused}
        ended={ended}
        start={start}
        data={journeyData}
        globalTime={globalTime}
         />
      </div>
      {/* Yixin's component */}
      <div className="m-10">
        <MapsPageRewrite
          zoom={zoom}
          center={center}
          setZoom={setZoom}
          setCenter={setCenter}
          defaultActiveOpacity={defaultActiveOpacity}
          defaultInactiveOpacity={defaultInactiveOpacity}
          stops={stops}
          defaultIntervalTime={defaultIntervalTime}
          journeyData={journeyData}
          started={start}
          setEnded={setEnded}
          paused={paused}
          ended={ended}
          globalTime={mapsGlobalTime}
        />
      </div>
    </div>
  );
};

export default CombinedPage;
