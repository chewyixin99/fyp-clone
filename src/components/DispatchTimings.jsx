import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { PuffLoader } from "react-spinners";
import PropTypes from "prop-types";
import { processCsvData } from "../util/mapHelper";
import { TiTick } from "react-icons/ti";

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
            {errorMsgFetch}
          </div>
          <div className="my-3 flex justify-end items-center">
            <button
              onClick={handleSubmit}
              className={`${
                loadingFetch ? "control-button-disabled" : "control-button"
              }`}
            >
              {loadingFetch ? "running model" : "update timings"}
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

    return (
      <div className="text-xs my-5">
        <div className="pb-3">Dispatch timings (sec)</div>
        {errorFetch && Object.keys(dispatchTimes).length === 0 ? (
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
