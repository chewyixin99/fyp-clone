import React, { useState } from "react";
import Papa from "papaparse";
import { PuffLoader } from "react-spinners";
import PropTypes from "prop-types";
import { processCsvData } from "../util/mapHelper";

const DispatchTimings = React.memo(({ dispatchTimes }) => {
  const [dispatchInput, setDispatchInput] = useState({});
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [errorFetch, setErrorFetch] = useState(false);
  const [errorMsgFetch, setErrorMsgFetch] = useState("");

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
    const tmpDispatchInput = dispatchInput;
    for (const trip of Object.keys(tmpDispatchInput)) {
      if (tmpDispatchInput[trip] == dispatchTimes[trip]) {
        delete tmpDispatchInput[trip];
      }
    }
    // send tmpDispatchInput to backend
    console.log(tmpDispatchInput);
    fetchFromEndpoint(dispatchInput);
  };

  const fetchFromEndpoint = async (dispatchInput) => {
    setLoadingFetch(true);
    setErrorFetch(false);
    setErrorMsgFetch("");
    const url = "http://127.0.0.1:8000/mm/result_feed_stream";
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

    await fetch(url, options)
      .then((response) => {
        if (response.ok) {
          setLoadingFetch(false);
          return response.text();
        }
      })
      .then((csvData) => {
        const parsed = Papa.parse(csvData).data.slice(1);
        const processedData = processCsvData(parsed);
        // continue
      })
      .catch((e) => {
        setLoadingFetch(false);
        setErrorFetch(true);
        console.log(e);
        setErrorMsgFetch(e.message);
      });
  };

  const renderFetchButton = () => {
    return (
      <div className="my-3 flex justify-end mr-3 items-center">
        <div>{errorMsgFetch}</div>
        <button onClick={handleSubmit} className="control-button">
          run model
        </button>
        <PuffLoader color="rgb(234, 88, 12)" loading={loadingFetch} size={15} />
      </div>
    );
  };

  return (
    <div>
      <div className="pb-3">Dispatch timings (sec)</div>
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
          {Object.keys(dispatchTimes).map((trip) => {
            const plannedTime = parseInt(dispatchTimes[trip].planned);
            const optimizedTime = parseInt(dispatchTimes[trip].optimized);
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
                  placeholder={optimizedTime}
                />
              </div>
            );
          })}
        </div>
      </div>
      {renderFetchButton()}
    </div>
  );
});

DispatchTimings.propTypes = {
  dispatchTimes: PropTypes.object,
};

DispatchTimings.displayName = "DispatchTimings";

export default DispatchTimings;
