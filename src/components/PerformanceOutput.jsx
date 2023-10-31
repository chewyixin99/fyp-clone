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
        slackPenalty: {
          title: "Slack Penalty",
          opt: optimizedOutputJson.slack_penalty.toFixed(2),
          unopt: unoptimizedOutputJson.slack_penalty.toFixed(2),
        },
        objectiveFunction: {
          title: "Objective Function",
          opt: tmpOptCumulativeOF,
          unopt: tmpUnoptCumulativeOF,
        },
        excessWaitTime: {
          title: "Excess Wait Time",
          opt: optimizedOutputJson.ewt_value.toFixed(2),
          unopt: unoptimizedOutputJson.ewt_value.toFixed(2),
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

    const renderMetrics = () => {
      if (Object.keys(localPerformanceValues).length === 0) {
        return;
      }
      const tableRows = [];
      for (const metric of Object.keys(localPerformanceValues)) {
        const delta =
          ((parseFloat(localPerformanceValues[metric].unopt) -
            parseFloat(localPerformanceValues[metric].opt)) /
            parseFloat(localPerformanceValues[metric].unopt)) *
          100;
        let textColor = getTextColor(delta);
        const deltaText =
          isNaN(delta) || !isFinite(delta) ? "-" : delta.toFixed(2) + "%";
        tableRows.push(
          <div className="flex" key={metric}>
            <div className="font-semibold text-center w-[125px] border">
              {localPerformanceValues[metric].title}
            </div>
            <div className="text-center w-[100px] border">
              {localPerformanceValues[metric].unopt}
            </div>
            <div className="text-center w-[100px] border">
              {localPerformanceValues[metric].opt}
            </div>
            <div className={`text-center w-[70px] border ${textColor}`}>
              {metric === "slackPenalty" ? "-" : deltaText}
            </div>
          </div>
        );
      }
      return tableRows;
    };

    useEffect(() => {
      getPerformanceImprovement();
    }, [optCumulativeOF, unoptCumulativeOF, propsCumulativeOF]);

    return (
      <div className="my-5 w-20vw mx-auto text-xs">
        <div className="pb-3 text-center">Performance results</div>
        {/* Headings */}
        <div className="flex font-semibold">
          <div className="text-center w-[125px] border"></div>
          <div className="text-center w-[100px] border">Unoptimised</div>
          <div className="text-center w-[100px] border">Optimised</div>
          <div className="text-center w-[70px] border">
            <span>Δ</span>
          </div>
        </div>
        {renderMetrics()}
        <div className="flex">
          <div className="text-center w-[125px] border font-semibold">
            Perf improvement
          </div>
          <div
            className={`text-center w-[270px] border ${getTextColor(
              parseFloat(performanceImprovement)
            )}`}
          >
            {performanceImprovement + "%"}
          </div>
        </div>
      </div>
    );
  }
);

PerformanceOutput.propTypes = {
  skipToEndTrigger: PropTypes.boolean,
  propsCumulativeOF: PropTypes.object,
  optCumulativeOF: PropTypes.object,
  unoptCumulativeOF: PropTypes.object,
};

PerformanceOutput.displayName = "PerformanceOutput";

export default PerformanceOutput;
