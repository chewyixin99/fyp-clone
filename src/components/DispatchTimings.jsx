import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const DispatchTimings = React.memo(({ dispatchTimes }) => {
  const [dispatchInput, setDispatchInput] = useState({});

  const handleInputChange = (e) => {
    const trip = e.target.id;
    const val = e.target.value.length < 1 ? 0 : parseInt(e.target.value);
    setDispatchInput({
      ...dispatchInput,
      [trip]: val,
    });
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
      <div className="my-3 flex justify-end mr-3">
        <button onClick={handleSubmit} className="control-button">
          submit
        </button>
      </div>
    </div>
  );
});

DispatchTimings.propTypes = {
  dispatchTimes: PropTypes.object,
};

DispatchTimings.displayName = "DispatchTimings";

export default DispatchTimings;
