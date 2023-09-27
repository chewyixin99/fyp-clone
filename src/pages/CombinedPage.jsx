import { useState, useEffect } from "react";
import { defaultCenter, defaultZoom, stopObjsBefore } from "../data/constants";
import Journey from "../components/Journey";
import Papa from "papaparse";
import MapsPageRewrite from "../components/mapsPage/MapsPageRewrite";

const defaultIntervalTime = 200;
const defaultInactiveOpacity = 0;
const defaultActiveOpacity = 1;

const stops = stopObjsBefore;

const CombinedPage = () => {
  // yixin states
  const [zoom, setZoom] = useState(defaultZoom);
  const [center, setCenter] = useState(defaultCenter);
  // end of yixin states

  // jianlin states
  const [start, setStart] = useState(false);
  // end of jianlin states

  // combined
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [journeyData, setJourneyData] = useState([]);

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
      },
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onStartClick = () => {
    console.log("start clicked");
    setEnded(false);
    // yixin logic
    // end of yixin logic

    // jianlin logic
    setStart(true);
    // end of jianlin logic
  };

  const onPauseClick = () => {
    // start of yixin logic
    setPaused(!paused);
    // end of yixin logic
  };

  const onEndClick = () => {
    // start of yixin logic
    // end of yixin logic

    // start of jianlin logic
    setStart(false);
    setEnded(true);
    setPaused(false);
    // end of jianlin logic
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
        <button
          onClick={onResetZoomAndCenterClick}
          type="button"
          className="control-button"
        >
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
        />
      </div>
    </div>
  );
};

export default CombinedPage;
