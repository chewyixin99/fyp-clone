import React from "react";
import PropTypes from "prop-types";

const DispatchTimings = React.memo(({ dispatchTimes }) => {
  return (
    <div className="overflow-y-scroll h-[300px]">
      <div className="px-3 mx-3 pb-3">
        Dispatch timings (sec) (mock values)
      </div>
      <div>
        <div className="flex font-semibold">
          <div className="text-center w-[50px] border">#</div>
          <div className="text-center w-[100px] border">Planned</div>
          <div className="text-center w-[100px] border">
            <span>Actual</span>
          </div>
          <div className="text-center w-[100px] border">
            <span>Δ</span>
          </div>
        </div>
      </div>
      <div>
        {Object.keys(dispatchTimes).map((trip) => {
          const plannedTime = parseInt(dispatchTimes[trip]);
          const newTime = parseInt(
            dispatchTimes[trip] - 100 + Math.floor(Math.random() * 200)
          );
          const diff = plannedTime - newTime;
          const textColor =
            newTime > plannedTime ? "text-orange-500" : "text-green-500";
          return (
            <div className="flex" key={trip}>
              <div className="text-center w-[50px] border">
                {parseInt(trip) + 1}
              </div>
              <div className="text-center w-[100px] border">
                {plannedTime}
              </div>
              <div className="text-center w-[100px] border">
                <span className={`${textColor}`}>{newTime}</span>
              </div>
              <div className="text-center w-[100px] border">
                <span className={`${textColor}`}>{diff}</span>
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
