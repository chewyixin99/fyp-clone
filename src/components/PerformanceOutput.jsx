import optimizedOutputJson from "../../public/v1_0CVXPY_optimised_output.json";
import unoptimizedOutputJson from "../../public/v1_0CVXPY_unoptimised_output.json";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";

const PerformanceOutput = React.memo(
  ({
    skipToEndTrigger,
    propsCumulativeOF, // 1 = unopt, 2 = opt cumulative OF value
    optCumulativeOF,
    unoptCumulativeOF,
  }) => {
    const [localPerformanceValues, setLocalPerformanceValues] = useState({});
    const [staticValues, setStaticValues] = useState({});
    const [performanceImprovement, setPerformanceImprovement] = useState(0);

    const getPerformanceImprovement = () => {
      let tmpUnoptCumulativeOF;
      let tmpOptCumulativeOF;
      let tmpOptCumulativeHD;
      let tmpUnoptCumulativeHD;
      let tmpPerfImprovement;
      if (skipToEndTrigger) {
        tmpUnoptCumulativeOF = (
          unoptCumulativeOF + unoptimizedOutputJson.slack_penalty
        ).toFixed(2);
        tmpOptCumulativeOF = (
          optCumulativeOF + optimizedOutputJson.slack_penalty
        ).toFixed(2);
        tmpOptCumulativeHD = optCumulativeOF.toFixed(2);
        tmpUnoptCumulativeHD = unoptCumulativeOF.toFixed(2);
      } else {
        tmpUnoptCumulativeOF = propsCumulativeOF["1"]
          ? propsCumulativeOF["1"].toFixed(2)
          : (0).toFixed(2);
        tmpOptCumulativeOF = propsCumulativeOF["2"]
          ? propsCumulativeOF["2"].toFixed(2)
          : (0).toFixed(2);
        tmpUnoptCumulativeHD = propsCumulativeOF["1"]
          ? propsCumulativeOF["1"].toFixed(2)
          : (0).toFixed(2);
        tmpOptCumulativeHD = propsCumulativeOF["2"]
          ? propsCumulativeOF["2"].toFixed(2)
          : (0).toFixed(2);
      }

      let result =
        ((tmpUnoptCumulativeOF - tmpOptCumulativeOF) / tmpUnoptCumulativeOF) *
        100;
      if (!isNaN(result) && result != null && isFinite(result)) {
        tmpPerfImprovement = result.toFixed(2);
      } else {
        tmpPerfImprovement = (0).toFixed(2);
      }

      setPerformanceImprovement(tmpPerfImprovement);
      setLocalPerformanceValues({
        headwayDeviation: {
          title: "Headway Deviation",
          opt: tmpOptCumulativeHD,
          unopt: tmpUnoptCumulativeHD,
        },
        objectiveFunction: {
          title: "Objective Function",
          opt: tmpOptCumulativeOF,
          unopt: tmpUnoptCumulativeOF,
        },
      });
      setStaticValues({
        excessWaitTime: {
          title: "Excess Wait Time",
          opt: optimizedOutputJson.ewt_value.toFixed(2),
          unopt: unoptimizedOutputJson.ewt_value.toFixed(2),
        },
        slackPenalty: {
          title: "Slack Penalty",
          opt: optimizedOutputJson.slack_penalty.toFixed(2),
          unopt: unoptimizedOutputJson.slack_penalty.toFixed(2),
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

    const renderMetrics = (performanceValues, showDelta = false) => {
      if (Object.keys(performanceValues).length === 0) {
        return;
      }
      const tableRows = [];
      const cellWidth = showDelta ? "w-[100px]" : "w-[135px]";
      tableRows.push(
        <div className="flex font-semibold" key="header">
          <div className="text-center w-[125px] border"></div>
          <div className={`text-center border ${cellWidth}`}>Unoptimised</div>
          <div className={`text-center border ${cellWidth}`}>Optimised</div>
          {showDelta ? (
            <div className="text-center w-[70px] border">Δ</div>
          ) : (
            ""
          )}
        </div>
      );
      for (const metric of Object.keys(performanceValues)) {
        const delta =
          ((parseFloat(performanceValues[metric].unopt) -
            parseFloat(performanceValues[metric].opt)) /
            parseFloat(performanceValues[metric].unopt)) *
          100;
        let textColor = getTextColor(delta);
        const deltaText =
          isNaN(delta) || !isFinite(delta) ? "-" : delta.toFixed(2) + "%";
        tableRows.push(
          <div className="flex" key={metric}>
            <div className="font-semibold text-center w-[125px] border">
              {performanceValues[metric].title}
            </div>
            <div className={`text-center border ${cellWidth}`}>
              {performanceValues[metric].unopt}
            </div>
            <div className={`text-center border ${cellWidth}`}>
              {performanceValues[metric].opt}
            </div>
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
      getPerformanceImprovement();
    }, [optCumulativeOF, unoptCumulativeOF, propsCumulativeOF]);

    return (
      <div className="w-20vw mr-auto text-xs">
        <div className="my-5">
          <div className="mb-3 pb-1 border-b-2">Performance results</div>
          {renderMetrics(localPerformanceValues, true)}
        </div>
        <div className="my-5">
          <div className="mb-3 pb-1 border-b-2">Static results</div>
          <div>{renderMetrics(staticValues, false)}</div>
        </div>
        <div className="my-5">
          <div className="mb-3 pb-1 border-b-2">
            Overall performance results
          </div>
          <div className={`${getTextColor(performanceImprovement)}`}>
            {performanceImprovement} %
          </div>
        </div>
      </div>
    );
  }
);

PerformanceOutput.propTypes = {
  skipToEndTrigger: PropTypes.boolean,
  propsCumulativeOF: PropTypes.object,
  optCumulativeOF: PropTypes.number,
  unoptCumulativeOF: PropTypes.number,
};

PerformanceOutput.displayName = "PerformanceOutput";

export default PerformanceOutput;
