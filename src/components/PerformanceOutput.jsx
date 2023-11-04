import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

const PerformanceOutput = React.memo(
  ({
    skipToEndTrigger,
    propsCumulativeOF, // 1 = unopt, 2 = opt cumulative OF value
    optCumulativeOF,
    unoptCumulativeOF,
    updatedOutputJson,
  }) => {
    const [localPerformanceValues, setLocalPerformanceValues] = useState({});
    const [staticValues, setStaticValues] = useState({});
    const [performanceImprovement, setPerformanceImprovement] = useState(0);
    const [optimizedOutputJson, setOptimizedOutputJson] = useState({});
    const [unoptimizedOutputJson, setUnoptimizedOutputJson] = useState({});
    const [loadingOptimized, setLoadingOptimized] = useState(false);
    const [loadingUnoptimized, setLoadingUnoptimized] = useState(false);
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const initOutputJson = async () => {
      setLoadingOptimized(true);
      setLoadingUnoptimized(true);
      setError(false);
      setErrorMsg("");
      const url = "http://127.0.0.1:8000/mm_default/result_matrices";
      const requestBodyOptimized = {
        unoptimised: false,
        deviated_dispatch_dict: {},
        regenerate_results: false,
      };
      const requestBodyUnoptimized = {
        unoptimised: true,
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
      // fetch optimized json
      await fetch(url, {
        ...options,
        body: JSON.stringify(requestBodyOptimized),
      })
        .then((response) => {
          return response.json();
        })
        .then((responseJson) => {
          setLoadingOptimized(false);
          setOptimizedOutputJson(responseJson.data);
        })
        .catch((e) => {
          setError(true);
          setErrorMsg(`Optimised error: ${e.message}`);
          setLoadingOptimized(false);
          console.log(e);
        });
      // fetch unoptimized json
      await fetch(url, {
        ...options,
        body: JSON.stringify(requestBodyUnoptimized),
      })
        .then((response) => {
          return response.json();
        })
        .then((responseJson) => {
          setLoadingUnoptimized(false);
          setUnoptimizedOutputJson(responseJson.data);
        })
        .catch((e) => {
          setError(true);
          setErrorMsg(`Unoptimised error: ${e.message}`);
          setLoadingUnoptimized(false);
          console.log(e);
        });
    };

    useEffect(() => {
      initOutputJson();
    }, []);

    const getPerformanceImprovement = () => {
      let tmpUnoptCumulativeOF;
      let tmpOptCumulativeOF;
      let tmpUpdatedCumulativeOF;
      let tmpOptCumulativeHD;
      let tmpUnoptCumulativeHD;
      let tmpUpdatedCumulativeHD;
      let tmpPerfImprovement;
      if (skipToEndTrigger) {
        tmpOptCumulativeHD = optCumulativeOF;
        tmpUnoptCumulativeHD = unoptCumulativeOF;

        tmpOptCumulativeOF =
          optCumulativeOF + optimizedOutputJson.slack_penalty;
        tmpUnoptCumulativeOF =
          unoptCumulativeOF + unoptimizedOutputJson.slack_penalty;

        tmpUpdatedCumulativeHD = optCumulativeOF;
        tmpUpdatedCumulativeOF = updatedOutputJson.slack_penalty
          ? optCumulativeOF + updatedOutputJson.slack_penalty
          : tmpOptCumulativeOF;
      } else {
        tmpUnoptCumulativeOF = propsCumulativeOF["1"]
          ? propsCumulativeOF["1"]
          : 0;
        tmpOptCumulativeOF = propsCumulativeOF["2"]
          ? propsCumulativeOF["2"]
          : 0;
        tmpUpdatedCumulativeOF = tmpOptCumulativeOF;
        tmpUnoptCumulativeHD = propsCumulativeOF["1"]
          ? propsCumulativeOF["1"]
          : 0;
        tmpOptCumulativeHD = propsCumulativeOF["2"]
          ? propsCumulativeOF["2"]
          : 0;
        tmpUpdatedCumulativeHD = tmpOptCumulativeHD;
      }

      let result =
        ((tmpUnoptCumulativeOF - tmpUpdatedCumulativeOF) /
          tmpUnoptCumulativeOF) *
        100;
      if (!isNaN(result) && result != null && isFinite(result)) {
        tmpPerfImprovement = result;
      } else {
        tmpPerfImprovement = 0;
      }
      setPerformanceImprovement(tmpPerfImprovement);
      setLocalPerformanceValues({
        headwayDeviation: {
          title: "Headway Deviation",
          opt: tmpOptCumulativeHD,
          unopt: tmpUnoptCumulativeHD,
          updated: tmpUpdatedCumulativeHD,
        },
        objectiveFunction: {
          title: "Objective Function",
          opt: tmpOptCumulativeOF,
          unopt: tmpUnoptCumulativeOF,
          updated: tmpUpdatedCumulativeOF,
        },
      });
      setStaticValues({
        excessWaitTime: {
          title: "Excess Wait Time",
          opt: optimizedOutputJson.ewt_value,
          unopt: unoptimizedOutputJson.ewt_value,
          updated: updatedOutputJson.ewt_value
            ? updatedOutputJson.ewt_value
            : optimizedOutputJson.ewt_value,
        },
        slackPenalty: {
          title: "Slack Penalty",
          opt: optimizedOutputJson.slack_penalty,
          unopt: unoptimizedOutputJson.slack_penalty,
          updated: updatedOutputJson.slack_penalty
            ? updatedOutputJson.slack_penalty
            : optimizedOutputJson.slack_penalty,
        },
      });
    };

    const getTextColor = (val) => {
      if (val > 0) {
        return "text-green-500";
      } else {
        return val === 0 ? "" : "text-red-500";
      }
    };

    const calculateDelta = (obj) => {
      // obj has opt and unopt value
      return ((obj.unopt - obj.updated) / obj.unopt) * 100;
    };

    const renderMetrics = (
      performanceValues,
      showDelta = false,
      showUpdated = false
    ) => {
      if (error) {
        return <div className="text-red-500">{errorMsg}</div>;
      }
      if (Object.keys(performanceValues).length === 0) {
        return;
      }
      const tableRows = [];
      let cellWidth;
      if (showDelta && showUpdated) {
        cellWidth = "w-[100px]";
      } else if (showDelta) {
        cellWidth = "w-[150px]";
      } else if (showUpdated) {
        cellWidth = "w-[123px]";
      } else {
        cellWidth = "w-[185px]";
      }
      tableRows.push(
        <div className="flex font-semibold" key="header">
          <div className="text-center w-[125px] border"></div>
          <div className={`text-center border ${cellWidth}`}>Unoptimised</div>
          <div className={`text-center border ${cellWidth}`}>Optimised</div>
          {showUpdated ? (
            <div className={`text-center border ${cellWidth}`}>Updated</div>
          ) : (
            ""
          )}
          {showDelta ? (
            <div className="text-center w-[70px] border">Δ</div>
          ) : (
            ""
          )}
        </div>
      );
      for (const metric of Object.keys(performanceValues)) {
        const delta = calculateDelta(performanceValues[metric]);
        let textColor = getTextColor(delta);
        const deltaText =
          isNaN(delta) || !isFinite(delta) ? "-" : delta.toFixed(2) + "%";
        tableRows.push(
          <div className="flex" key={metric}>
            <div className="font-semibold text-center w-[125px] border">
              {performanceValues[metric].title}
            </div>
            <div className={`text-center border ${cellWidth}`}>
              {performanceValues[metric].unopt.toFixed(2)}
            </div>
            <div className={`text-center border ${cellWidth}`}>
              {performanceValues[metric].opt.toFixed(2)}
            </div>
            {showUpdated ? (
              <div className={`text-center border ${cellWidth}`}>
                {performanceValues[metric].updated.toFixed(2)}
              </div>
            ) : (
              ""
            )}
            {showDelta ? (
              <div className={`text-center w-[70px] border ${textColor}`}>
                {metric === "slackPenalty" ? "-" : deltaText}
              </div>
            ) : (
              ""
            )}
          </div>
        );
      }
      return tableRows;
    };

    useEffect(() => {
      if (
        Object.keys(unoptimizedOutputJson).length !== 0 &&
        Object.keys(optimizedOutputJson).length !== 0
      ) {
        getPerformanceImprovement();
      }
    }, [
      optCumulativeOF,
      unoptCumulativeOF,
      propsCumulativeOF,
      optimizedOutputJson,
      unoptimizedOutputJson,
    ]);

    return (
      <div className="w-20vw mr-auto text-xs">
        <div className="my-5">
          <div className="mb-3 pb-1 border-b-2">Performance Results</div>
          {renderMetrics(localPerformanceValues, true, true)}
        </div>
        <div className="my-5">
          <div className="mb-3 pb-1 border-b-2">Static Results</div>
          <div>
            {loadingOptimized || loadingUnoptimized
              ? ""
              : renderMetrics(staticValues, false, true)}
          </div>
        </div>
        <div className="my-5">
          <div className="mb-3 pb-1 border-b-2">
            Overall Performance Results
          </div>
          <div className="flex my-1">
            <div>Objective Function:</div>
            <div className={`mx-2 ${getTextColor(performanceImprovement)}`}>
              {performanceImprovement.toFixed(2)} %
            </div>
          </div>
          {Object.keys(staticValues).length === 0 || !skipToEndTrigger ? (
            ""
          ) : (
            <div className="flex my-1">
              <div>Excess Wait Time:</div>
              <div
                className={`mx-2 ${getTextColor(
                  calculateDelta(staticValues.excessWaitTime)
                )}`}
              >
                {calculateDelta(staticValues.excessWaitTime).toFixed(2)} %
              </div>
            </div>
          )}
        </div>
        <div className="text-gray-400 text-[10px]">
          <p>Headway Deviation + Slack Penalty* = Objective Function</p>
          <br/>
          <p>Slack Penalty* accounts for the deviation of the last bus at the last stop when compared to the</p>
          <p>unoptimised model. This slack provides extra buffer for the mathematical model to optimise. </p>
        </div>
      </div>
    );
  }
);

PerformanceOutput.propTypes = {
  skipToEndTrigger: PropTypes.bool,
  propsCumulativeOF: PropTypes.object,
  optCumulativeOF: PropTypes.number,
  unoptCumulativeOF: PropTypes.number,
  updatedOutputJson: PropTypes.object,
};

PerformanceOutput.displayName = "PerformanceOutput";

export default PerformanceOutput;
