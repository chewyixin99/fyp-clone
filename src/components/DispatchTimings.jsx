import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { PuffLoader } from "react-spinners";
import PropTypes from "prop-types";
import { processCsvData } from "../util/mapHelper";
import { TiTick } from "react-icons/ti";
import { BsQuestionCircle } from "react-icons/bs";

const DispatchTimings = React.memo(
  ({ dispatchTimes, setUpdatedOutputJson }) => {
    const [localDispatchTimes, setLocalDispatchTimes] = useState(dispatchTimes);
    const [dispatchInput, setDispatchInput] = useState({});
    const [loadingFetch, setLoadingFetch] = useState(false);
    const [errorFetch, setErrorFetch] = useState(false);
    const [errorMsgFetch, setErrorMsgFetch] = useState("");
    const [updatedData, setUpdatedData] = useState({});
    const [updatedDispatchTimes, setUpdatedDispatchTimes] = useState({});

    useEffect(() => {
      setLocalDispatchTimes(dispatchTimes);
      if (Object.keys(dispatchTimes).length === 0) {
        setErrorFetch(true);
        setErrorMsgFetch("Something went wrong. Unable to load data.");
      } else {
        setErrorFetch(false);
        setErrorMsgFetch("");
      }
    }, [dispatchTimes]);

    const computeDispatchTimes = (data) => {
      const newDispatchTimes = {};
      const allDispatchTimes = data.journeyData.filter((r) => {
        return r.currentStatus === "DISPATCHED_FROM";
      });
      for (const rec of allDispatchTimes) {
        newDispatchTimes[rec.busTripNo] = rec.timestamp;
      }
      return newDispatchTimes;
    };

    const handleInputChange = (e) => {
      const trip = e.target.id;
      const val = e.target.value.length < 1 ? 0 : parseInt(e.target.value);
      if (val === 0) {
        const tmpDispatchInput = dispatchInput;
        delete tmpDispatchInput[trip];
        setDispatchInput(tmpDispatchInput);
      } else {
        setDispatchInput({
          ...dispatchInput,
          [trip]: val,
        });
      }
    };

    const handleSubmit = () => {
      setErrorFetch(false);
      setErrorFetch("");
      const tmpDispatchInput = dispatchInput;
      for (const trip of Object.keys(tmpDispatchInput)) {
        if (tmpDispatchInput[trip] == dispatchTimes[trip]) {
          delete tmpDispatchInput[trip];
        }
      }
      // send tmpDispatchInput to backend
      const validInput = validateInput(dispatchInput);
      if (validInput > 0) {
        setErrorFetch(true);
        setErrorMsgFetch(
          `Input is invalid for trip ${validInput}, inputs must be in ascending order.`
        );
      } else {
        fetchFromEndpoint(dispatchInput);
      }
    };

    const fetchFromEndpoint = async (dispatchInput) => {
      setLoadingFetch(true);
      const urlCsv = "http://127.0.0.1:8000/mm_default/result_feed";
      const urlResultMatrice =
        "http://127.0.0.1:8000/mm_default/result_matrices";
      const requestBody = {
        unoptimised: false,
        polling_rate: 1,
        deviated_dispatch_dict: dispatchInput,
        regenerate_results: false,
      };
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      };
      console.log(requestBody);

      await fetch(urlCsv, options)
        .then((response) => {
          if (response.ok) {
            setLoadingFetch(false);
            return response.text();
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        })
        .then((csvData) => {
          const parsed = Papa.parse(csvData).data.slice(1);
          const processedData = processCsvData(parsed);
          setUpdatedData(processedData);
          const newDispatchTimes = computeDispatchTimes(processedData);
          setUpdatedDispatchTimes(newDispatchTimes);
        })
        .catch((e) => {
          setLoadingFetch(false);
          setErrorFetch(true);
          console.log(e);
          setErrorMsgFetch(e.message);
        });

      await fetch(urlResultMatrice, options)
        .then((response) => {
          if (response.ok) {
            setLoadingFetch(false);
            return response.json();
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        })
        .then((responseJson) => {
          setUpdatedOutputJson(responseJson.data);
        })
        .catch((e) => {
          setLoadingFetch(false);
          setErrorFetch(true);
          console.log(e);
          setErrorMsgFetch(e.message);
        });
    };

    const validateInput = (dispatchInput) => {
      console.log(dispatchInput);
      let prevKey;
      for (const key of Object.keys(dispatchInput)) {
        if (!prevKey) {
          prevKey = key;
          continue;
        }
        if (dispatchInput[key] < dispatchInput[prevKey]) {
          return parseInt(key);
        }
        prevKey = key;
      }
      return -1;
    };

    const renderFetchButton = () => {
      return (
        <div>
          <div className="text-orange-500 mt-3 text-center">
            {errorFetch ? errorMsgFetch : ""}
          </div>
          <div className="my-3 flex justify-end items-center">
            <button
              onClick={handleSubmit}
              className={`${
                loadingFetch ? "control-button-disabled" : "control-button"
              }`}
            >
              {loadingFetch ? "optimising" : "reoptimise"}
            </button>
            <PuffLoader
              color="rgb(234, 88, 12)"
              loading={loadingFetch}
              size={15}
            />
            {!loadingFetch &&
            !errorFetch &&
            Object.keys(updatedData).length !== 0 ? (
              <TiTick className="text-green-500" />
            ) : (
              ""
            )}
          </div>
        </div>
      );
    };

    const renderTooltip = (text, direction) => {
      const toolTipPosition = direction == "left" ? "left-full" : "right-1/4";
      const contentObj = {
        "Dispatch Timings (sec)": [
          `Planned = Unoptimised or real-life dispatch timings`,
          `Optimised = Model-optimised dispatch timings`,
          `Actual = Dispatch timings for the visualiser that is defaulted to Optimised values.
          Update to Actual values will re-render the model.`,
        ],
      };

      return (
        <>
          <div className="group relative w-max ms-2 flex items-baseline">
            <span className="text-base mb-2 leading-none tracking-tight">
              {text}
            </span>
            <BsQuestionCircle className="text-xs ms-1" />
            <div
              className={`text-white text-[11px] max-w-[30vw] p-2 pointer-events-none absolute -top-24 ${toolTipPosition} w-max opacity-0 transition-opacity group-hover:opacity-100 bg-slate-700 rounded-lg`}
            >
              {contentObj[text].map((item, index) => {
                return (
                  <p key={index}>
                    {item}
                    {index === contentObj[text].length - 1 ? (
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

    return (
      <div className="text-xs my-5">
        <div className="pb-2 flex">
          {renderTooltip("Dispatch Timings (sec)", "right")}
        </div>
        {errorFetch &&
        loadingFetch &&
        Object.keys(dispatchTimes).length === 0 ? (
          <div className="text-orange-500">{errorMsgFetch}</div>
        ) : (
          <div className="overflow-y-scroll h-[30vh] border-2">
            <div>
              <div className="flex font-semibold">
                <div className="text-center w-[50px] border">#</div>
                <div className="text-center w-[100px] border">Planned</div>
                <div className="text-center w-[100px] border">
                  <span>Optimised</span>
                </div>
                <div className="text-center w-[100px] border">
                  <span>Actual</span>
                </div>
              </div>
            </div>
            <div>
              {Object.keys(localDispatchTimes).map((trip) => {
                const plannedTime = parseInt(localDispatchTimes[trip].planned);
                const optimizedTime = parseInt(
                  localDispatchTimes[trip].optimized
                );
                return (
                  <div className="flex" key={trip}>
                    <div className="text-center w-[50px] border">
                      {parseInt(trip)}
                    </div>
                    <div className="text-center w-[100px] border">
                      {plannedTime}
                    </div>
                    <div className="text-center w-[100px] border">
                      <span>{optimizedTime}</span>
                    </div>
                    <input
                      id={trip}
                      onChange={handleInputChange}
                      className="text-center w-[100px] border"
                      type="number"
                      placeholder={
                        Object.keys(updatedDispatchTimes).length === 0
                          ? optimizedTime
                          : updatedDispatchTimes[trip]
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {renderFetchButton()}
      </div>
    );
  }
);

DispatchTimings.propTypes = {
  dispatchTimes: PropTypes.object,
  setUpdatedOutputJson: PropTypes.func,
};

DispatchTimings.displayName = "DispatchTimings";

export default DispatchTimings;
