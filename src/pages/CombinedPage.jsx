import { useState, useEffect } from "react";
import Journey from "../components/Journey";
import Papa from "papaparse";
import MapsPageRewrite from "../components/mapsPage/MapsPageRewrite";

const defaultIntervalTime = 500;
const defaultStepInterval = defaultIntervalTime / 10;
const defaultInactiveOpacity = 0;
const defaultActiveOpacity = 1;
const defaultCenter = {
  lat: 45.511046,
  lng: -122.553584,
};
const defaultZoom = 13;
const mapContainerStyle = {
  width: "90vw",
  height: "20vw",
  maxWidth: "90vw",
};

const CombinedPage = () => {
  // yixin states
  const [zoom, setZoom] = useState(defaultZoom);
  const [center, setCenter] = useState(defaultCenter);
  const [mapsGlobalTime, setMapsGlobalTime] = useState(0);
  const [stopObjs, setStopObjs] = useState([]);
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
    Papa.parse("./v1_4_poll1_feed.csv", {
      // options
      download: true,
      complete: (res) => {
        const tmpJourneyData = [];
        const data = res.data.slice(1);
        for (let i = 0; i < data.length; i++) {
          const rowData = data[i];
          const [
            timestamp,
            bus_trip_no,
            status,
            bus_stop_no,
            stop_id,
            stop_name,
            latitude,
            longitude,
            distance,
          ] = rowData;
          tmpJourneyData.push({
            timestamp: parseInt(timestamp),
            lat: parseFloat(parseFloat(latitude).toFixed(4)),
            lng: parseFloat(parseFloat(longitude).toFixed(4)),
            opacity: 0,
            stopId: stop_id,
            stopName: stop_name,
            busStopNo: parseInt(bus_stop_no),
            currentStatus: status,
            busTripNo: parseInt(bus_trip_no),
            distance: parseFloat(distance),
          });
        }
        const tmpStopObjs = tmpJourneyData.filter((r) => {
          return (
            r.busTripNo == 1 &&
            (r.currentStatus === "STOPPED_AT" ||
              r.currentStatus === "DISPATCHED_FROM")
          );
        });
        for (const row of tmpStopObjs) {
          row.opacity = 0.8;
        }
        tmpStopObjs.sort((a, b) =>
          a.timestamp < b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0
        );
        setStopObjs(tmpStopObjs);
        setJourneyData(tmpJourneyData);
        if (tmpJourneyData.length > 0) {
          // setGlobalTime(tmpJourneyData[0].timestamp);
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
          stops={stopObjs}
          defaultIntervalTime={defaultIntervalTime}
          defaultStepInterval={defaultStepInterval}
          journeyData={journeyData}
          started={start}
          setEnded={setEnded}
          paused={paused}
          ended={ended}
          globalTime={mapsGlobalTime}
          mapContainerStyle={mapContainerStyle}
        />
      </div>
    </div>
  );
};

export default CombinedPage;
