import { useState, useEffect } from "react";
import Journey from "../components/Journey";
import Papa from "papaparse";
import MapsPageRewrite from "../components/mapsPage/MapsPageRewrite";
import { normalizeStartTime, processCsvData } from "../util/mapHelper";
import {
  BsFillPlayFill,
  BsFillPauseFill,
  BsFillStopFill,
} from "react-icons/bs";
import { BiRun } from "react-icons/bi";
import { MdFilterCenterFocus } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import { RxReload } from "react-icons/rx";
import { PuffLoader } from "react-spinners";
import { AiOutlineSwap, AiOutlineForward } from "react-icons/ai";
import { BsQuestionCircle } from "react-icons/bs";
import Metrics from "../components/Metrics";
import DispatchTimings from "../components/DispatchTimings";
import PerformanceOutput from "../components/PerformanceOutput";
import UploadFile from "../components/UploadFile";

const defaultIntervalTime = 1000;
const defaultStepInterval = Math.floor(defaultIntervalTime / 10);
const defaultCenter = {
  lat: 45.515,
  lng: -122.553584,
};
const defaultZoom = 12;
const mapContainerStyle = {
  width: "100%",
  height: "30vh",
  maxWidth: "100%",
};

const optimizedFile = "./v1_0CVXPY_poll1_optimised_feed.csv";
const unoptimizedFile = "./v1_0CVXPY_poll1_unoptimised_feed.csv";
// const optimizedFile = "";
// const unoptimizedFile = "";

const CombinedPage = () => {
  // map states
  const [zoom, setZoom] = useState(defaultZoom);
  const [center, setCenter] = useState(defaultCenter);
  const [mapsGlobalTime, setMapsGlobalTime] = useState(0);
  const [stopObjs, setStopObjs] = useState([]);

  // metrics, line journey , performance result states
  const [start, setStart] = useState(false);
  const [unoptimisedOF, setUnoptimisedOF] = useState({});
  const [optimisedOF, setOptimisedOF] = useState({});
  const [busStopData, setBusStopData] = useState([]);
  const [skipToEndTrigger, setSkipToEndTrigger] = useState(false);
  const [optCumulativeOF, setOptCumulativeOF] = useState(0);
  const [unoptCumulativeOF, setUnoptCumulativeOF] = useState(0);
  const [propsCumulativeOF, setPropsCumulativeOF] = useState({});
  const [resetChart, setResetChart] = useState(false);

  // combined
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(true);
  const [journeyData, setJourneyData] = useState([]);
  const [journeyDataUnoptimized, setJourneyDataUnoptimized] = useState([]);
  const [globalTime, setGlobalTime] = useState(0);
  const [dataInUse, setDataInUse] = useState("ORIGINAL");

  // visualisation toggle states
  const [toggle, setToggle] = useState({
    maps: false,
    line: true,
  });
  const [toggleStats, setToggleStates] = useState({
    output: false,
    dispatch: true,
  });

  // dispatch timing states
  const [dispatchTimes, setDispatchTimes] = useState({});
  const [updatedOutputJson, setUpdatedOutputJson] = useState({});

  // loading states
  const [loadingFetchOptimized, setLoadingFetchOptimized] = useState(false);
  const [loadingFetchUnoptimized, setLoadingFetchUnoptimized] = useState(false);
  const [errorFetch, setErrorFetch] = useState(false);
  const [errorMsgFetch, setErrorMsgFetch] = useState("");
  const [loadingOptimizedOutputJSON, setLoadingOptimizedOutputJSON] =
    useState(false);
  const [loadingUnoptimizedOutputJSON, setLoadingUnoptimizedOutputJSON] =
    useState(false);
  const [errorOutputJSON, setErrorOutputJSON] = useState(false);
  const [errorMsgOutputJSON, setErrorMsgOutputJSON] = useState("");

  // output json states
  const [optimizedOutputJson, setOptimizedOutputJson] = useState({});
  const [unoptimizedOutputJson, setUnoptimizedOutputJson] = useState({});

  const initDispatchTimes = (retrievedData) => {
    const originalTimesArr = retrievedData.original_dispatch_list;
    const optimizedDispatchTimes = retrievedData.dispatch_list;
    const tmpDispatchTimes = {};
    const originalDispatchTimes = {};
    ``;
    for (let i = 0; i < originalTimesArr.length; i++) {
      originalDispatchTimes[i + 1] = parseInt(originalTimesArr[i]);
    }
    for (const key of Object.keys(optimizedDispatchTimes)) {
      tmpDispatchTimes[key] = {
        planned: originalDispatchTimes[key],
        optimized: optimizedDispatchTimes[key],
      };
    }
    setDispatchTimes(tmpDispatchTimes);
  };

  const initOutputJson = async () => {
    setLoadingOptimizedOutputJSON(true);
    setLoadingUnoptimizedOutputJSON(true);
    setErrorOutputJSON(false);
    setErrorMsgOutputJSON("");
    const url = "http://127.0.0.1:8000/mm_default/result_matrices";
    const requestBodyUnoptimized = {
      unoptimised: true,
      deviated_dispatch_dict: {},
      regenerate_results: false,
    };
    const requestBodyOptimized = {
      unoptimised: false,
      deviated_dispatch_dict: {},
      regenerate_results: false,
    };
    const options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    };
    await fetch(url, {
      ...options,
      body: JSON.stringify(requestBodyOptimized),
    })
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        const data = responseJson.data;
        initDispatchTimes(data);
        setOptimizedOutputJson(data);
        setLoadingOptimizedOutputJSON(false);
      })
      .catch((e) => {
        setErrorOutputJSON(true);
        setErrorMsgOutputJSON(`Optimised error: ${e.message}`);
        setLoadingOptimizedOutputJSON(false);
        console.log(e);
      });

    await fetch(url, {
      ...options,
      body: JSON.stringify(requestBodyUnoptimized),
    })
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        const data = responseJson.data;
        setUnoptimizedOutputJson(data);
        setLoadingUnoptimizedOutputJSON(false);
      })
      .catch((e) => {
        setErrorOutputJSON(true);
        setErrorMsgOutputJSON(`Unoptimised error: ${e.message}`);
        setLoadingUnoptimizedOutputJSON(false);
        console.log(e);
      });
  };

  const fetchFromEndpoint = async () => {
    setLoadingFetchOptimized(true);
    setLoadingFetchUnoptimized(true);
    setErrorFetch(false);
    const url = "http://127.0.0.1:8000/mm_default/result_feed";
    const requestBodyOptimised = {
      polling_rate: 1,
      unoptimised: false,
      deviated_dispatch_dict: {},
    };
    const commonOptions = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    };

    // optimised
    await fetch(url, {
      ...commonOptions,
      body: JSON.stringify(requestBodyOptimised),
    })
      .then((response) => {
        // response.body is a ReadableStream
        if (response.ok) {
          setLoadingFetchOptimized(false);
          return response.text();
        }
      })
      .then((csvData) => {
        const parsed = Papa.parse(csvData).data.slice(1);
        const processedDataOptimised = processCsvData(parsed);
        // set journey and stops after
        console.log(
          `fetched data: optimised: ${processedDataOptimised.journeyData.length} rows`
        );
        setDataInUse("ORIGINAL");
        setStopObjs(processedDataOptimised.stopObjs);
        setJourneyData(processedDataOptimised.journeyData);
      })
      .catch((e) => {
        setLoadingFetchOptimized(false);
        setErrorFetch(true);
        console.log(e);
        setErrorMsgFetch(e.message);
      });

    const requestBodyUnoptimised = {
      polling_rate: 1,
      unoptimised: true,
      deviated_dispatch_dict: {},
    };

    await fetch(url, {
      ...commonOptions,
      body: JSON.stringify(requestBodyUnoptimised),
    })
      .then((response) => {
        // response.body is a ReadableStream
        if (response.ok) {
          setLoadingFetchUnoptimized(false);
          return response.text();
        }
      })
      .then((csvData) => {
        const parsed = Papa.parse(csvData).data.slice(1);
        const processedDataUnoptimised = processCsvData(parsed);
        // set journey and stops after
        console.log(
          `fetched data: unoptimised: ${processedDataUnoptimised.journeyData.length} rows`
        );
        setDataInUse("ORIGINAL");
        setJourneyDataUnoptimized(processedDataUnoptimised.journeyData);
      })
      .catch((e) => {
        setLoadingFetchUnoptimized(false);
        setErrorFetch(true);
        console.log(e);
        setErrorMsgFetch(e.message);
      });
  };

  // load initial data
  useEffect(() => {
    initOutputJson();
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

  const toggleVisibility = () => {
    setToggle({
      maps: !toggle.maps,
      line: !toggle.line,
    });
  };

  const toggleStatisticsVisibility = () => {
    setToggleStates({
      output: !toggleStats.output,
      dispatch: !toggleStats.dispatch,
    });
  };

  const onStartClick = () => {
    console.log("start clicked");
    if (loadingFetchUnoptimized || loadingFetchOptimized) {
      return;
    }
    setEnded(false);
    setStart(true);
    setResetChart(false);
    setSkipToEndTrigger(false);
  };

  const onPauseClick = () => {
    setPaused(!paused);
  };

  const onEndClick = () => {
    setStart(false);
    setEnded(true);
    setPaused(false);
    setSkipToEndTrigger(false);
    setResetChart(true);
  };

  const onSkipToEndClick = () => {
    if (loadingOptimizedOutputJSON || loadingUnoptimizedOutputJSON) {
      return;
    }
    setSkipToEndTrigger(true);
    setResetChart(false);
    setEnded(true);
    setPaused(false);
  };

  const onResetZoomAndCenterClick = () => {
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  const onRefetchDataClick = () => {
    initOutputJson();
    fetchFromEndpoint();
    setStart(false);
    setEnded(true);
    setPaused(false);
    setSkipToEndTrigger(false);
    setResetChart(true);
  };

  const renderFetchStatus = () => {
    if (!errorFetch) {
      return (
        <div className="flex items-center">
          <div className="mr-3 flex items-center">
            Original data:
            {loadingFetchOptimized || errorFetch ? (
              <div className="text-orange-600 flex items-center">
                <span className="mx-3">optimised</span>
                <PuffLoader
                  color="rgb(234, 88, 12)"
                  loading={loadingFetchOptimized}
                  size={15}
                />
              </div>
            ) : (
              <div className="text-green-500 flex items-center">
                <span className="mx-3">optimised</span>
                <TiTick />
              </div>
            )}
            {loadingFetchUnoptimized || errorFetch ? (
              <div className="text-orange-500 flex items-center">
                <span className="mx-3">unoptimised</span>
                <PuffLoader
                  color="rgb(234, 88, 12)"
                  loading={loadingFetchUnoptimized}
                  size={15}
                />
              </div>
            ) : (
              <div className="text-green-600 flex items-center">
                <span className="mx-3">unoptimised</span>
                <TiTick />
              </div>
            )}
            <button
              onClick={onRefetchDataClick}
              title="Refetch data"
              className={`${
                loadingFetchOptimized || loadingFetchUnoptimized
                  ? "control-button-disabled"
                  : "control-button"
              }`}
            >
              <RxReload />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center text-red-600">
        <div>{errorMsgFetch}</div>
        <button onClick={onRefetchDataClick} className="control-button">
          <RxReload />
        </button>
      </div>
    );
  };

  const renderTooltipTextless = (direction) => {
    const toolTipPosition = direction == "left" ? "left-full" : "right-1/4";
    const contentArr = [
      `ORIGINAL = Optimised dispatch timings from the model`,
      `UPDATED = Re-rendered optimised dispatch timings based on uploaded file`,
    ];
    return (
      <>
        <div className="group relative w-max ms-1 flex items-center">
          <BsQuestionCircle className="text-xs" />
          <div
            className={`text-white text-[11px] max-w-[30vw] p-2 pointer-events-none absolute -top-24 ${toolTipPosition} w-max opacity-0 transition-opacity group-hover:opacity-100 bg-slate-700 rounded-lg`}
          >
            {contentArr.map((item, index) => {
              return (
                <p key={index}>
                  {item}
                  {index === contentArr.length - 1 ? (
                    ""
                  ) : (
                    <>
                      <br />
                      <br />
                    </>
                  )}
                </p>
              );
            })}
          </div>
        </div>
      </>
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
        }
        setGlobalTime(globalTime + 1);
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
      {/* Control buttons */}
      <div className="">
        {/* row 1 */}
        <div className="flex justify-center items-center py-5 text-xs">
          <button
            onClick={onStartClick}
            type="button"
            title="Start"
            className={
              paused ||
              start ||
              loadingFetchUnoptimized ||
              loadingFetchOptimized
                ? "control-button-disabled"
                : "control-button"
            }
            disabled={
              paused ||
              start ||
              loadingFetchUnoptimized ||
              loadingFetchOptimized
            }
          >
            <BiRun />
          </button>
          <button
            onClick={onPauseClick}
            type="button"
            title="Pause"
            className={ended ? `control-button-disabled` : `control-button`}
            disabled={ended}
          >
            {paused ? <BsFillPlayFill /> : <BsFillPauseFill />}
          </button>
          <button
            onClick={onEndClick}
            type="button"
            title="Stop"
            className={`control-button`}
          >
            <BsFillStopFill />
          </button>
          <button
            onClick={onResetZoomAndCenterClick}
            type="button"
            title="Reset Map Zoom and Center"
            className="control-button"
          >
            <MdFilterCenterFocus />
          </button>
          <button
            onClick={onSkipToEndClick}
            type="button"
            title="Skip to end"
            className={
              loadingOptimizedOutputJSON || loadingUnoptimizedOutputJSON
                ? "control-button-disabled"
                : "control-button"
            }
          >
            <AiOutlineForward />
          </button>
          <div className="ml-3 flex items-center border-l-2 pl-3">
            <div>Viewing {toggle.maps ? "Maps" : "Line"}</div>
            <button
              onClick={toggleVisibility}
              type="button"
              className="control-button"
            >
              <AiOutlineSwap />
            </button>
          </div>
          <div className="ml-3 flex items-center">
            <div>Viewing {toggleStats.dispatch ? "Dispatch" : "Results"}</div>
            <button
              onClick={toggleStatisticsVisibility}
              type="button"
              className="control-button"
            >
              <AiOutlineSwap />
            </button>
          </div>
        </div>
        {/* row 2 */}
        <div className="flex justify-center items-center py-5 text-xs">
          <div className="mx-3 border-r-2">{renderFetchStatus()}</div>
          <UploadFile
            setStopObjs={setStopObjs}
            setJourneyData={setJourneyData}
            setJourneyDataUnoptimized={setJourneyDataUnoptimized}
            setDispatchTimes={setDispatchTimes}
            setDataInUse={setDataInUse}
            setOptimizedOutputJson={setOptimizedOutputJson}
            setUnoptimizedOutputJson={setUnoptimizedOutputJson}
          />
        </div>
        {/* row 3 */}
        <div className="flex justify-center items-center py-5 text-xs">
          <div>
            Currently viewing <span className="underline">{dataInUse}</span>{" "}
            data
          </div>
          {renderTooltipTextless("left")}
        </div>
      </div>
      <div className="border-t-2 border-b-2 py-[1%] my-[1%] flex justify-center items-center min-h-[45vh]">
        {/* Metrics */}
        <div className="grid 2xl:grid-cols-12 xl:grid-cols-8 w-full">
          <div
            className="my-2 2xl:col-span-8 xl:col-span-8 ms-12 flex justify-center"
            style={{
              minWidth: "100%",
              maxWidth: "100%",
              height: "40vh",
            }}
          >
            <Metrics
              unoptimisedOF={unoptimisedOF}
              optimisedOF={optimisedOF}
              busStopData={busStopData}
              skipToEndTrigger={skipToEndTrigger}
              setOptCumulativeOF={setOptCumulativeOF}
              setUnoptCumulativeOF={setUnoptCumulativeOF}
              setPropsCumulativeOF={setPropsCumulativeOF}
              resetChart={resetChart}
              optimizedOutputJson={optimizedOutputJson}
              unoptimizedOutputJson={unoptimizedOutputJson}
            />
          </div>
          <div className="2xl:col-span-4 xl:col-span-8 flex justify-center ms-4">
            <div style={{ display: toggleStats.dispatch ? "block" : "none" }}>
              <div className="my-5 w-20vw mr-auto">
                <DispatchTimings
                  dispatchTimes={dispatchTimes}
                  setUpdatedOutputJson={setUpdatedOutputJson}
                />
              </div>
            </div>
            <div style={{ display: toggleStats.dispatch ? "none" : "block" }}>
              <PerformanceOutput
                skipToEndTrigger={skipToEndTrigger}
                propsCumulativeOF={propsCumulativeOF}
                optCumulativeOF={optCumulativeOF}
                unoptCumulativeOF={unoptCumulativeOF}
                updatedOutputJson={updatedOutputJson}
                optimizedOutputJson={optimizedOutputJson}
                unoptimizedOutputJson={unoptimizedOutputJson}
                loadingOptimizedOutputJSON={loadingOptimizedOutputJSON}
                loadingUnoptimizedOutputJSON={loadingUnoptimizedOutputJSON}
                errorOutputJSON={errorOutputJSON}
                errorMsgOutputJSON={errorMsgOutputJSON}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Line */}
      <div
        className={`${toggle.line ? "block" : "hidden"} flex justify-center`}
      >
        <div>
          <div className="my-2">
            <h1 className="ms-12 mb-16 text-xl leading-none tracking-tight text-gray-900 md:text-xl lg:text-xl dark:text-white">
              Baseline Model
            </h1>
            <Journey
              id={"1"}
              paused={paused}
              ended={ended}
              start={start}
              data={journeyDataUnoptimized}
              globalTime={globalTime}
              skipToEndTrigger={skipToEndTrigger}
              setOptimisedOF={setOptimisedOF}
              setUnoptimisedOF={setUnoptimisedOF}
              setBusStopData={setBusStopData}
              busStopData={busStopData}
              resetChart={resetChart}
              optimizedOutputJson={optimizedOutputJson}
              unoptimizedOutputJson={unoptimizedOutputJson}
            />
          </div>
          <h1 className="ms-12 mt-2 mb-16 text-xl leading-none tracking-tight text-gray-900 md:text-xl lg:text-xl dark:text-white">
            Optimised Model
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
              skipToEndTrigger={skipToEndTrigger}
              setBusStopData={setBusStopData}
              busStopData={busStopData}
              setOptimisedOF={setOptimisedOF}
              setUnoptimisedOF={setUnoptimisedOF}
              resetChart={resetChart}
              optimizedOutputJson={optimizedOutputJson}
              unoptimizedOutputJson={unoptimizedOutputJson}
            />
          </div>
        </div>
      </div>
      {/* Maps */}
      <div className={`${toggle.maps ? "block" : "hidden"} w-[95%] mx-auto`}>
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
    </div>
  );
};

export default CombinedPage;
