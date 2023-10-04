import { useState, useEffect } from "react";
import Journey from "../components/Journey";
import Papa from "papaparse";
import MapsPageRewrite from "../components/mapsPage/MapsPageRewrite";
import { normalizeStartEndTimes } from "../util/mapHelper";

const defaultIntervalTime = 100;
const defaultStepInterval = Math.floor(defaultIntervalTime / 10);
const defaultCenter = {
  lat: 45.515,
  lng: -122.553584,
};
const defaultZoom = 12;
const mapContainerStyle = {
  width: "100%",
  height: "20vw",
  maxWidth: "100%",
};

const optimizedFile = "./v1_4_poll1_feed.csv";
const unoptimizedFile = "./v1_4_poll1_unoptimised_feed.csv";

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
  const [journeyDataUnoptimized, setJourneyDataUnoptimized] = useState([]);
  const [globalTime, setGlobalTime] = useState(0);

  const fetchData = async () => {
    Papa.parse(optimizedFile, {
      // options
      download: true,
      complete: (res) => {
        let tmpJourneyData = [];
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
            lat: parseFloat(parseFloat(latitude).toFixed(6)),
            lng: parseFloat(parseFloat(longitude).toFixed(6)),
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
        tmpStopObjs.sort((a, b) => a.timestamp - b.timestamp);
        setStopObjs(tmpStopObjs);
        tmpJourneyData = tmpJourneyData.filter((r) => !isNaN(r.timestamp));
        setJourneyData(tmpJourneyData);
      },
    });

    Papa.parse(unoptimizedFile, {
      // options
      download: true,
      complete: (res) => {
        let tmpJourneyDataUnoptimized = [];
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
          tmpJourneyDataUnoptimized.push({
            timestamp: parseInt(timestamp),
            lat: parseFloat(parseFloat(latitude).toFixed(6)),
            lng: parseFloat(parseFloat(longitude).toFixed(6)),
            opacity: 0,
            stopId: stop_id,
            stopName: stop_name,
            busStopNo: parseInt(bus_stop_no),
            currentStatus: status,
            busTripNo: parseInt(bus_trip_no),
            distance: parseFloat(distance),
          });
        }
        tmpJourneyDataUnoptimized = tmpJourneyDataUnoptimized.filter(
          (r) => !isNaN(r.timestamp)
        );
        setJourneyDataUnoptimized(tmpJourneyDataUnoptimized);
      },
    });
  };

  // load initial data
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (journeyData.length !== 0 && journeyDataUnoptimized.length !== 0) {
      // make it such that both optimized and unoptimized start and end at the same time
      const { normalizedOptimizedData, normalizedUnoptimizedData } =
        normalizeStartEndTimes({
          optimizedData: journeyData,
          unoptimizedData: journeyDataUnoptimized,
        });
      // set states for time and journey datas
      setJourneyData(normalizedOptimizedData);
      setJourneyDataUnoptimized(normalizedUnoptimizedData);
      setGlobalTime(normalizedOptimizedData[0].timestamp);
      setMapsGlobalTime(normalizedOptimizedData[0].timestamp);
    }
  }, [journeyData, journeyDataUnoptimized]);

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
      if (journeyData.length !== 0) {
        setGlobalTime(journeyData[0].timestamp);
        setMapsGlobalTime(journeyData[0].timestamp);
      }
      console.log("ended");
    }
  }, [start, paused, ended, globalTime, journeyData]);

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
          disabled={ended}
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
        <h1 className="ms-24 mb-8 text-2xl font-extrabold leading-none tracking-tight text-gray-900 md:text-2xl lg:text-2xl dark:text-white">
          Baseline Model
        </h1>
        <Journey
          id={"1"}
          paused={paused}
          ended={ended}
          start={start}
          data={journeyDataUnoptimized}
          globalTime={globalTime}
        />
      </div>
      <div className="divider"></div>
      <h1 className="ms-24 mt-2 text-2xl font-extrabold leading-none tracking-tight text-gray-900 md:text-2xl lg:text-2xl dark:text-white">
        Optimized Model
      </h1>

      <div className="mt-10">
        <Journey
          id={"2"}
          key={"optimized"}
          paused={paused}
          ended={ended}
          start={start}
          data={journeyData}
          globalTime={globalTime}
        />
      </div>
      {/* Yixin's component */}
      <div className="m-10 mt-0">
        <MapsPageRewrite
          zoom={zoom}
          center={center}
          setZoom={setZoom}
          setCenter={setCenter}
          stops={stopObjs}
          defaultStepInterval={defaultStepInterval}
          optimizedData={journeyData}
          unoptimizedData={journeyDataUnoptimized}
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
