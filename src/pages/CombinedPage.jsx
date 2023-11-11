import { useState, useEffect } from "react";
import Journey from "../components/Journey";
import Papa from "papaparse";
import MapsPageRewrite from "../components/mapsPage/MapsPageRewrite";
import { normalizeStartTime, processCsvData } from "../util/mapHelper";
import {
  BsFillPlayFill,
  BsFillPauseFill,
  BsFillStopFill,
  BsQuestionCircle,
} from "react-icons/bs";
import { BiRun } from "react-icons/bi";
import { MdFilterCenterFocus } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import { RxReload } from "react-icons/rx";
import { PuffLoader } from "react-spinners";
import { AiOutlineSwap, AiOutlineForward } from "react-icons/ai";
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
  const [dataInUse, setDataInUse] = useState("");

  // visualisation toggle states
  const [toggle, setToggle] = useState({
    maps: false,
    line: true,
  });
  const [toggleStates, setToggleStates] = useState({
    output: false,
    dispatch: true,
  });

  // dispatch timing states
  const [dispatchTimes, setDispatchTimes] = useState({});
  const [updatedOutputJson, setUpdatedOutputJson] = useState({});
  const [dispatchUpdated, setDispatchUpdated] = useState(false);

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
  const [performanceComponentLoaded, setPerformanceComponentLoaded] = useState(false);

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
    if (
      journeyData.length !== 0 &&
      journeyDataUnoptimized.length !== 0 &&
      dataInUse !== "UPDATED"
    ) {
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
  }, [journeyData, journeyDataUnoptimized, dataInUse]);

  const toggleVisibility = () => {
    setToggle({
      maps: !toggle.maps,
      line: !toggle.line,
    });
  };

  const toggleStatisticsVisibility = () => {
    setToggleStates({
      output: !toggleStates.output,
      dispatch: !toggleStates.dispatch,
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
              load
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

  const renderTooltip = (title, key, direction, size) => {
    const toolTipPosition = direction == "right" ? "left-full" : "right-1/4";
    const contentObj = {
      dataType: [
        `ORIGINAL = Optimised dispatch timings from the model`,
        `UPDATED = Re-rendered optimised dispatch timings based on uploaded file`,
      ],
      OFchart: [
        `This mixed chart displays the objective function for each bus stop on the left Y-Axis and the cumulative objective function for each model (optimised & unoptimised) on the right Y-Axis.`,
        `The objective function indicates how well the actual headway follows the target headway. The lower the objective function, the less significant bus bunching can be observed.`,
      ],
      dispatchTimings: [
        `Planned = Unoptimised or real-life dispatch timings`,
        `Optimised = Model-optimised dispatch timings`,
        `Actual = Dispatch timings for the visualiser that is defaulted to Optimised values.
        Update to Actual values will re-render the model.`,
      ],
      performanceResults: [
        `Headway Deviation = Squared differences between the target headway and the actual headway that are accumulated throughout the bus service.`,
        `Objective Function = Headway Deviation + Slack Penalty`,
        `Updated = Re-rendered optimised model performance based on user input. Default value is optimised output.`,
        `Excess Wait Time = Average aggregation of the actual wait times for each bus stop beyond stipulation. E.g., Given a bus stop, if the stipulated wait time is 10 minutes, and the actual wait time is 12 minutes, the excess wait time is 2 minutes.`,
        `Slack Penalty = The slack penalty accounts for the excess deviation of the last bus dispatched at the bus depot. This slack provides extra buffer for the mathematical model to optimise.`,
      ],
      line: [
        `The line journey chart illustrates bus operations based on the model dispatch timings.`,
        `The cyan blue dots represent the bus stops and the bus stop distances are relative to the actual distance between the bus stops. Upon hovering on the bus stop dots, information regarding the bus stop will be displayed.`,
        `The dialogue-shaped box represents a bus in operation. The trip number represents the order of buses dispatched.`,
      ],
      map: [
        `The map journey chart illustrates bus operations based on the model dispatch timings.`,
        `The markers on the map represent the bus stops in the real-world while the purple line represents the bus route.`,
        `When the visualisation is running, the moving red icon is a bus in operation. The number within this icon represents the order of buses dispatched.`,
      ],
      uploadFile: [
        `Upload a JSON file containing inputs to the model. JSON file format:`,
        `data (dict): Input data for the validation, expected to contain key-value pairs such as:`,
        `- "num_trips" (int): Number of bus trips.`,
        `- "num_stops" (int): Number of bus stops.`,
        `- "original_dispatch_list" (list[int]): List of original dispatch timings. Length: num_trips.`,
        `- "coordinates_list" (list[list[float]]): List of coordinates for each stop. Length: num_stops.`,
        `- "stop_ids_list" (list[str]): List of stop identifiers. Length: num_stops.`,
        `- "stop_names_list" (list[str]): List of stop names. Length: num_stops.`,
        `- "prev_arrival_list" (list[int]): List of previous arrival times. Length: num_stops.`,
        `- "prev_dwell_list" (list[int]): List of previous dwell times. Length: num_stops - 1.`,
        `- "arrival_rate_list" (list[float]): List of arrival rates at each stop. Length: num_stops.`,
        `- "alighting_percentage_list" (list[float]): List of alighting percentages. Length: num_stops - 1.`,
        `- "boarding_duration" (int): Duration for boarding at each stop.`,
        `- "alighting_duration" (int): Duration for alighting at each stop.`,
        `- "weights_list" (list[float]): List of weights for each stop. Length: num_stops.`,
        `- "bus_availability_list" (list[int]): List indicating the availability of buses. Length: num_trips.`,
        `- "max_allowed_deviation" (int): Maximum allowed deviation for dispatch times.`,
        `- "target_headway_2dlist" (list[list[int]]): 2D list of target headways. Shape: num_trips x num_stops.`,
        `- "interstation_travel_2dlist" (list[list[int]]): 2D list of interstation travel times. Shape: num_trips x (num_stops - 1).`,
      ],
    };
    return (
      <>
        <div className="group relative w-max ms-1 flex items-center ">
          {title && (
            <span className="z-10 text-xl text-bold leading-none tracking-tight text-gray-900 md:text-xl lg:text-xl dark:text-white me-2">
              {title}
            </span>
          )}
          <BsQuestionCircle className={`text-${size ? size : "sm"}`} />
          <div
            className={`z-20 text-white text-[11px] max-w-[30vw] p-2 pointer-events-none absolute -top-24 
            ${toolTipPosition} w-max opacity-0 transition-opacity group-hover:opacity-100 bg-slate-700 rounded-lg`}
          >
            {contentObj[key].map((item, index) => {
              return (
                <p key={index}>
                  {item}
                  {index === contentObj[key].length - 1 ? (
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
        </div>
        {/* row 2 */}
        <div className="flex justify-center items-center py-2 text-xs">
          <div className="mx-3 border-r-2">{renderFetchStatus()}</div>
          <UploadFile
            setStopObjs={setStopObjs}
            setJourneyData={setJourneyData}
            setJourneyDataUnoptimized={setJourneyDataUnoptimized}
            setDispatchTimes={setDispatchTimes}
            setDataInUse={setDataInUse}
            setOptimizedOutputJson={setOptimizedOutputJson}
            setUnoptimizedOutputJson={setUnoptimizedOutputJson}
            setGlobalTime={setGlobalTime}
            setMapsGlobalTime={setMapsGlobalTime}
            renderTooltip={renderTooltip}
          />
        </div>
        {/* row 3 */}
        <div className="flex justify-center items-center pt-4 text-xs">
          <div>
            Currently viewing <span className="underline">{dataInUse}</span>{" "}
            data
          </div>
          {renderTooltip("", "dataType", "right", "xs")}
        </div>
      </div>
      {/* Metrics */}
      <div className="border-t-2 border-b-2 xl:py-[1%] md:pb-[10%] md:pt-[2%] my-[1%] px-[1%] flex justify-center items-center min-h-[45vh]">
        <div className="grid 2xl:grid-cols-12 xl:grid-cols-8 grid-rows-12 w-full">
          <div
            className="2xl:col-span-8 xl:col-span-8 ms-12 flex justify-center ms-8 xl:mb-12 md:mb-24"
            style={{
              minWidth: "100%",
              maxWidth: "100%",
              height: "40vh",
            }}
          >
            <div className="grid grid-cols-12 grid-rows-12 w-full">
              <div className="col-span-12 flex justify-center items-center mb-4 ms-24">
                {renderTooltip(
                  "Objective Function Mixed Chart",
                  "OFchart",
                  "right",
                  ""
                )}
              </div>
              <div className="row-start-2 col-span-12">
                <Metrics
                  unoptimisedOF={unoptimisedOF}
                  optimisedOF={optimisedOF}
                  stopObjs={stopObjs}
                  skipToEndTrigger={skipToEndTrigger}
                  setOptCumulativeOF={setOptCumulativeOF}
                  setUnoptCumulativeOF={setUnoptCumulativeOF}
                  setPropsCumulativeOF={setPropsCumulativeOF}
                  resetChart={resetChart}
                  optimizedOutputJson={optimizedOutputJson}
                  unoptimizedOutputJson={unoptimizedOutputJson}
                />
              </div>
            </div>
          </div>
          <div
            className="2xl:col-span-4 xl:col-span-8 flex justify-center ms-8 mb-12"
            style={{ height: "30vh" }}
          >
            {performanceComponentLoaded ? <div className="grid grid-cols-12 grid-rows-12 w-full">
              <div className="col-span-12 flex justify-center items-center mb-4">
                {renderTooltip(
                  !toggleStates.dispatch
                    ? "Dispatch Timings"
                    : "Performance Results",
                  !toggleStates.dispatch
                    ? "dispatchTimings"
                    : "performanceResults",
                  "left",
                  ""
                )}
                <div className="absolute right-36">
                  <button
                    onClick={toggleStatisticsVisibility}
                    type="button"
                    className="control-button bg-lime-100"
                  >
                    <AiOutlineSwap />
                  </button>
                </div>
              </div>
              <div className="col-span-12 row-start-2 flex justify-center items-center mb-4">
                <div
                  style={{ display: !toggleStates.dispatch ? "block" : "none" }}
                >
                  <div className="my-5 w-20vw mr-auto">
                    <DispatchTimings
                      dispatchTimes={dispatchTimes}
                      setUpdatedOutputJson={setUpdatedOutputJson}
                      setDispatchUpdated={setDispatchUpdated}
                    />
                  </div>
                </div>
                <div
                  style={{ display: !toggleStates.dispatch ? "none" : "block" }}
                >
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
                    dispatchUpdated={dispatchUpdated}
                    setPerformanceComponentLoaded={setPerformanceComponentLoaded}
                  />
                </div>
              </div>
            </div> : "Loading..."}
          </div>
        </div>
      </div>
      {/* Line */}
      <div className="flex justify-center items-center mb-4">
        {renderTooltip(
          toggle.line ? "Journey Chart (Line)" : "Journey Chart (Map)",
          toggle.line ? "line" : "map",
          "right",
          ""
        )}
        <div className="absolute right-1/4">
          <button
            onClick={toggleVisibility}
            type="button"
            className="control-button bg-lime-100"
          >
            <AiOutlineSwap />
          </button>
        </div>
      </div>
      <div
        className={`${
          toggle.line ? "block" : "hidden"
        } flex justify-center mb-4`}
      >
        <div className="my-8 absolute left-20 pb-8">
          <div className="flex items-baseline gap-8">
            <h1 className="text-end text-xl leading-none tracking-tight text-gray-900 md:text-xl lg:text-xl dark:text-white">
              Baseline Model
            </h1>
            <div className="mb-12">
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
                resetChart={resetChart}
                optimizedOutputJson={optimizedOutputJson}
                unoptimizedOutputJson={unoptimizedOutputJson}
                stopObjs={stopObjs}
              />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl leading-none tracking-tight text-gray-900 md:text-xl lg:text-xl dark:text-white">
              Optimised Model
            </h1>
            <div className="">
              <Journey
                id={"2"}
                key={"optimized"}
                paused={paused}
                ended={ended}
                start={start}
                data={journeyData}
                globalTime={globalTime}
                skipToEndTrigger={skipToEndTrigger}
                setOptimisedOF={setOptimisedOF}
                setUnoptimisedOF={setUnoptimisedOF}
                resetChart={resetChart}
                optimizedOutputJson={optimizedOutputJson}
                unoptimizedOutputJson={unoptimizedOutputJson}
                stopObjs={stopObjs}
              />
            </div>
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
