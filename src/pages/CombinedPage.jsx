import { useState, useEffect } from "react";
import Journey from "../components/Journey";
import Papa from "papaparse";
import MapsPageRewrite from "../components/mapsPage/MapsPageRewrite";
import { normalizeStartTime, processCsvData } from "../util/mapHelper";
import { BsFillPlayFill, BsFillPauseFill, BsRepeat } from "react-icons/bs";
import { BiRun } from "react-icons/bi";
import { MdFilterCenterFocus } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import { RxReload } from "react-icons/rx";
import { PuffLoader } from "react-spinners";
import Metrics from "../components/Metrics";

const defaultIntervalTime = 300;
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

// const optimizedFile = "./v1_4_poll1_feed.csv";
// const unoptimizedFile = "./v1_4_poll1_unoptimised_feed.csv";
const optimizedFile = "./v1_0CVXPY_poll1_optimised_feed.csv";
const unoptimizedFile = "./v1_0CVXPY_poll1_unoptimised_feed.csv";

const CombinedPage = () => {
  // yixin states
  const [zoom, setZoom] = useState(defaultZoom);
  const [center, setCenter] = useState(defaultCenter);
  const [mapsGlobalTime, setMapsGlobalTime] = useState(0);
  const [stopObjs, setStopObjs] = useState([]);
  // end of yixin states

  // jianlin states
  const [start, setStart] = useState(false);
  const [saveHeadwayObj, setSaveHeadwayObj] = useState("");
  const [saveHeadwayObjOptimised, setSaveHeadwayObjOptimised] = useState("");
  const [busStopData, setBusStopData] = useState([]);
  
  const triggerParentSave = (obj,id) => {

    if (id == 1){
      setSaveHeadwayObj({['string']:JSON.stringify(obj), ['obj']:obj})
    }
    else {
      setSaveHeadwayObjOptimised({['string']:JSON.stringify(obj), ['obj']:obj})
    }

  }

  // end of jianlin states

  // combined
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(true);
  const [journeyData, setJourneyData] = useState([]);
  const [journeyDataUnoptimized, setJourneyDataUnoptimized] = useState([]);
  const [globalTime, setGlobalTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchFromEndpoint = async () => {
    setLoading(true);
    setError(false);
    const url = "http://127.0.0.1:8000/mm/result_feed";
    const requestBody = {
      polling_rate: 1,
      horizon_length: "string",
      horizon_interval: "string",
      actual_trip_timings: [0],
    };
    const options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    };

    await fetch(url, options)
      .then((response) => {
        // response.body is a ReadableStream
        // return response.body.getReader().read();
        if (response.ok) {
          setLoading(false);
          return response.text();
        }
      })
      .then((csvData) => {
        const parsed = Papa.parse(csvData).data.slice(1);
        const processedData = processCsvData(parsed);
        console.log(processedData);
        // set journey and stops after
      })
      .catch((e) => {
        setLoading(false);
        setError(true);
        console.log(e);
        setErrorMsg(e.message);
      });
  };

  const fetchData = async () => {
    Papa.parse(optimizedFile, {
      // options
      download: true,
      complete: (res) => {
        const data = res.data.slice(1);
        const processedData = processCsvData(data);
        setStopObjs(processedData.stopObjs);
        setJourneyData(processedData.journeyData);
      },
    });

    Papa.parse(unoptimizedFile, {
      // options
      download: true,
      complete: (res) => {
        const data = res.data.slice(1);
        const processedData = processCsvData(data);
        setJourneyDataUnoptimized(processedData.journeyData);
      },
    });
  };

  // load initial data
  useEffect(() => {
    fetchData();
    fetchFromEndpoint();
  }, []);

  useEffect(() => {
    if (journeyData.length !== 0 && journeyDataUnoptimized.length !== 0) {
      // make it such that both optimized and unoptimized start and end at the same time
      const { normalizedOptimizedData, normalizedUnoptimizedData } =
        normalizeStartTime({
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

  const onRefetchDataClick = () => {
    fetchFromEndpoint();
  };

  const renderFetchStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center text-orange-600">
          <div className="mr-3">Model is running</div>
          <PuffLoader color="rgb(234, 88, 12)" loading={loading} size={15} />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center text-red-600">
          <div>{errorMsg}</div>
          <button onClick={onRefetchDataClick} className="control-button">
            <RxReload />
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center text-green-500">
        <div>Data loaded</div>
        <TiTick className="ml-3" />
      </div>
    );
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
  }, [start, paused, ended, globalTime, journeyData, mapsGlobalTime]);

  return (
    <div>
      {/* test buttons to test logic */}
      <div className="flex justify-center items-center py-5">
        <button
          onClick={onStartClick}
          type="button"
          className={
            paused || start ? "control-button-disabled" : "control-button"
          }
          disabled={paused}
        >
          <BiRun />
        </button>
        <button
          onClick={onPauseClick}
          type="button"
          className={ended ? `control-button-disabled` : `control-button`}
          disabled={ended}
        >
          {paused ? <BsFillPlayFill /> : <BsFillPauseFill />}
        </button>
        <button onClick={onEndClick} type="button" className={`control-button`}>
          <BsRepeat />
        </button>
        <button
          onClick={onResetZoomAndCenterClick}
          type="button"
          className="control-button"
        >
          <MdFilterCenterFocus />
        </button>
        <div className="border-l-2 pl-3">{renderFetchStatus()}</div>
      </div>
      {/* JianLin's component */}
      <div className="divider"></div>
      <div className="my-2">
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
          triggerParentSave={triggerParentSave}
          setBusStopData={setBusStopData}
          busStopData={busStopData}
        />
      </div>
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
          triggerParentSave={triggerParentSave}
          setBusStopData={setBusStopData}
          busStopData={busStopData}
        />
      </div>
      <div className="divider"></div>

      <div className="mx-auto my-2" style={{height: "400px",width: "80vw", justifyContent: "center", display: "flex"}}> 
        <Metrics 
          saveHeadwayObj={saveHeadwayObj}
          saveHeadwayObjOptimised={saveHeadwayObjOptimised}
          busStopData={busStopData}
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
