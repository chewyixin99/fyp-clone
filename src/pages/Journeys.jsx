// eslint-disable-next-line no-unused-vars
import React from "react";
import "../styling/bus-operations.css";
import Journey from "../components/Journey";

const Journeys = () => {
  return (
    <div className="mx-auto">
      <div className="row operations-container">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          Bus Operations
        </p>

        <div className="bus-operations">
          <p className="text-2md font-bold text-gray-900 dark:text-white">
            Details
          </p>
          <div className="configuration-panel">
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`Bus Number : 84`}
              </label>
            </div>
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`City: Portland`}
              </label>
            </div>
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`Total Distance : 5035m`}
              </label>
            </div>
            <div className="configuration-panel-item">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {`Number of Bus Stops: 39`}
              </label>
            </div>
          </div>
          <Journey />
        </div>
      </div>
    </div>
  );
};

export default Journeys;
