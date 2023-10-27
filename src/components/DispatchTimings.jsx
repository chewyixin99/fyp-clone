import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const DispatchTimings = React.memo(({ dispatchTimes }) => {
  const [dispatchInput, setDispatchInput] = useState({});

  useEffect(() => {
    const tmpDispatchInput = {};
    for (const trip of Object.keys(dispatchTimes)) {
      tmpDispatchInput[trip] = dispatchTimes[trip];
    }
    setDispatchInput(tmpDispatchInput);
  }, [dispatchTimes]);

  const handleInputChange = (e) => {
    const trip = e.target.id;
    const val = e.target.value.length < 1 ? 0 : parseInt(e.target.value);
    setDispatchInput({
      ...dispatchInput,
      [trip]: val,
    });
  };

  const handleSubmit = () => {
    console.log(dispatchInput);
  };

  return (
    <div>
      <div className="overflow-y-scroll h-[300px] pr-3">
        <div className="px-3 mx-3 pb-3">
          Dispatch timings (sec) (mock values)
        </div>
        <div>
          <div className="flex font-semibold">
            <div className="text-center w-[50px] border">#</div>
            <div className="text-center w-[100px] border">Planned</div>
            <div className="text-center w-[100px] border">
              <span>Optimized</span>
            </div>
            <div className="text-center w-[100px] border">
              <span>Actual</span>
            </div>
          </div>
        </div>
        <div>
          {Object.keys(dispatchTimes).map((trip) => {
            const plannedTime = parseInt(dispatchTimes[trip]);
            const optimizedTime = parseInt(
              dispatchTimes[trip] - 100 + Math.floor(Math.random() * 200)
            );
            return (
              <div className="flex" key={trip}>
                <div className="text-center w-[50px] border">
                  {parseInt(trip) + 1}
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
                  placeholder={dispatchInput[trip]}
                  type="number"
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
