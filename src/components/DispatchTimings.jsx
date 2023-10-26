import React from "react";
import PropTypes from "prop-types";

const DispatchTimings = React.memo(({ dispatchTimes }) => {
  return (
    <div className="flex justify-center">
      <div className="border-r-2 px-3 mx-3">
        Dispatch timings (sec) (mock values)
      </div>
      <div>
        {Object.keys(dispatchTimes).map((trip) => {
          const plannedTime = dispatchTimes[trip];
          const newTime = parseInt(
            dispatchTimes[trip] - 50 + Math.floor(Math.random() * 100)
          );
          const textColor =
            newTime > plannedTime ? "text-orange-500" : "text-green-500";
          return (
            <div className="flex" key={trip}>
              <div className="mr-3 pr-3 border-r-2">
                Trip {parseInt(trip) + 1}
              </div>
              <div className="mr-3 pr-3 border-r-2">
                Planned = {plannedTime}
              </div>
              <div className="mr-3 pr-3 border-r-2">
                Actual = <span className={`${textColor}`}>{newTime}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

DispatchTimings.propTypes = {
  dispatchTimes: PropTypes.object,
};

DispatchTimings.displayName = "DispatchTimings";

export default DispatchTimings;
