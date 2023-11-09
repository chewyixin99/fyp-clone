import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { BsQuestionCircle } from "react-icons/bs";

const PerformanceOutput = React.memo(
  ({
    skipToEndTrigger,
    propsCumulativeOF, // 1 = unopt, 2 = opt cumulative OF value
    optCumulativeOF,
    unoptCumulativeOF,
    updatedOutputJson,
    optimizedOutputJson,
    unoptimizedOutputJson,
    loadingOptimizedOutputJSON,
    loadingUnoptimizedOutputJSON,
    errorOutputJSON,
    errorMsgOutputJSON,
    dispatchUpdated,
  }) => {
    const [localPerformanceValues, setLocalPerformanceValues] = useState({});
    const [staticValues, setStaticValues] = useState({});
    const [performanceImprovement, setPerformanceImprovement] = useState(0);

    const getPerformanceImprovement = () => {
      let tmpUnoptCumulativeOF;
      let tmpOptCumulativeOF;
      let tmpUpdatedCumulativeOF;
      let tmpOptCumulativeHD;
      let tmpUnoptCumulativeHD;
      let tmpUpdatedCumulativeHD;
      let tmpPerfImprovement;
      if (skipToEndTrigger) {
        // opt
        tmpOptCumulativeHD = optCumulativeOF;
        tmpOptCumulativeOF =
          optCumulativeOF + optimizedOutputJson.slack_penalty;
        // unopt
        tmpUnoptCumulativeHD = unoptCumulativeOF;
        tmpUnoptCumulativeOF =
          unoptCumulativeOF + unoptimizedOutputJson.slack_penalty;
        // updated
        tmpUpdatedCumulativeHD = updatedOutputJson.objective_value
          ? updatedOutputJson.objective_value - updatedOutputJson.slack_penalty
          : tmpOptCumulativeHD;
        tmpUpdatedCumulativeOF = updatedOutputJson.objective_value
          ? updatedOutputJson.objective_value
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
          updated:
            updatedOutputJson.slack_penalty === undefined
              ? optimizedOutputJson.slack_penalty
              : updatedOutputJson.slack_penalty,
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
      if (errorOutputJSON) {
        return <div className="text-red-500">{errorMsgOutputJSON}</div>;
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

    const renderTooltip = (text, direction) => {
      var toolTipPosition = direction == "left" ? "left-full" : "right-1/4";
      const contentObj = {
        "Performance Results": [
          `Headway Deviation = Squared differences between the target headway and the actual headway that are accumulated throughout the bus service.`,
          `Objective Function = Headway Deviation + Slack Penalty`,
          `Updated = Re-rendered optimised model performance based on user input. Default value is optimised output.`,
        ],
        "Static Results": [
          `Excess Wait Time = Average aggregation of the actual wait times for each bus stop beyond stipulation.`,
          `E.g., Given a bus stop, if the stipulated wait time is 10 minutes, and the actual wait time is 12 minutes, the excess wait time is 2 minutes.`,
          `Slack Penalty = The slack penalty accounts for the excess deviation of the last bus dispatched at the bus depot. 
          This slack provides extra buffer for the mathematical model to optimise.`,
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
      optimizedOutputJson,
      unoptimizedOutputJson,
      loadingOptimizedOutputJSON,
      loadingUnoptimizedOutputJSON,
      errorOutputJSON,
      errorMsgOutputJSON,
      skipToEndTrigger,
    ]);

    return (
      <div className="w-20vw mr-auto text-xs">
        <div className="my-5">
          <span className="text-base tracking-tight leading-8">
            Key Metrics
          </span>
          {renderMetrics(localPerformanceValues, true, dispatchUpdated)}
        </div>
        <div className="my-5">
          <span className="text-base tracking-tight leading-8">
            Secondary Metrics
          </span>
          <div>
            {loadingOptimizedOutputJSON || loadingUnoptimizedOutputJSON
              ? ""
              : renderMetrics(staticValues, false, dispatchUpdated)}
          </div>
        </div>
        <div className="my-5">
          <div className="mb-3 pb-1 border-b-2 text-base mb-2 leading-none tracking-tight">
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
  optimizedOutputJson: PropTypes.object,
  unoptimizedOutputJson: PropTypes.object,
  loadingOptimizedOutputJSON: PropTypes.bool,
  loadingUnoptimizedOutputJSON: PropTypes.bool,
  errorOutputJSON: PropTypes.bool,
  errorMsgOutputJSON: PropTypes.string,
  dispatchUpdated: PropTypes.bool,
};

PerformanceOutput.displayName = "PerformanceOutput";

export default PerformanceOutput;
