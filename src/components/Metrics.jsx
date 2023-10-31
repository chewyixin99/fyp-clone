import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { num_trips } from "../../public/actual_input_2710";
import { obj_fn_matrix as obj_fn_matrix_2 } from "../../public/v1_0CVXPY_optimised_output";
import { obj_fn_matrix as obj_fn_matrix_1 } from "../../public/v1_0CVXPY_unoptimised_output";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  SubTitle,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  SubTitle
);

const Metrics = ({
  unoptimisedOF,
  optimisedOF,
  busStopData,
  skipToEndTrigger,
  setOptCumulativeOF,
  setUnoptCumulativeOF,
  setPropsCumulativeOF,
  resetChart
}) => {
  const [processedData, setProcessedData] = useState({});
  const [processedCumulativeData, setProcessedCumulativeData] = useState({});
  const [busStopLabel, setBusStopLabel] = useState([]);

  const processObjectiveFn = (unoptimised, optimised) => {
    var obj = unoptimised;
    var objOptimised = optimised;
    var collectedData = {};

    if (obj != null) {
      var temp1 = {};
      Object.keys(obj).forEach((key) => {
        var tripNo_unoptimised = key.split(",")[0];
        if (tripNo_unoptimised in temp1) {
          temp1[tripNo_unoptimised].push(obj[key]);
        } else {
          temp1[tripNo_unoptimised] = [obj[key]];
        }
      });
      collectedData["1"] = temp1;
    }

    if (objOptimised != null) {
      var temp2 = {};

      Object.keys(objOptimised).forEach((key) => {
        var tripNo_optimised = key.split(",")[0];

        if (tripNo_optimised in temp2) {
          temp2[tripNo_optimised].push(objOptimised[key]);
        } else {
          temp2[tripNo_optimised] = [objOptimised[key]];
        }
      });

      collectedData["2"] = temp2;
    }
    setProcessedData(collectedData);
  };

  const processCumulativeObjectiveFn = (unoptimised, optimised) => {
    var obj = unoptimised;
    var objOptimised = optimised;
    var collectedData = {};

    if (obj != null) {
      var temp = {};
      Object.keys(obj).forEach((key) => {
        var stopNo_unoptimised = key.split(",")[1];
        if (temp[stopNo_unoptimised]) {
          temp[stopNo_unoptimised].push(obj[key]);
        } else {
          temp[stopNo_unoptimised] = [obj[key]];
        }
      });
      var cumulative_output = [];
      var currentCumulative = 0;

      Object.keys(temp).forEach((stopNo_unoptimised) => {
        temp[stopNo_unoptimised].map((OF_value, i) => {
          currentCumulative += OF_value;
        });
        cumulative_output.push(currentCumulative);
      });
      collectedData["1"] = cumulative_output;
    }

    if (objOptimised != null) {
      var tempOptimised = {};
      Object.keys(objOptimised).forEach((key) => {
        var stopNo_optimised = key.split(",")[1];
        if (tempOptimised[stopNo_optimised]) {
          tempOptimised[stopNo_optimised].push(objOptimised[key]);
        } else {
          tempOptimised[stopNo_optimised] = [objOptimised[key]];
        }
      });

      var cumulative_optimised_output = [];
      var currentCumulativeOptimised = 0;
      Object.keys(tempOptimised).forEach((stopNo_optimised) => {
        tempOptimised[stopNo_optimised].map((OF_value, i) => {
          currentCumulativeOptimised += OF_value;
        });
        cumulative_optimised_output.push(currentCumulativeOptimised);
      });

      collectedData["2"] = cumulative_optimised_output;
    }
    if (skipToEndTrigger) {
      setOptCumulativeOF(collectedData["2"][collectedData["2"].length - 1]);
      setUnoptCumulativeOF(collectedData["1"][collectedData["1"].length - 1]);
    }
    setProcessedCumulativeData(collectedData);
    if ("1" in collectedData && "2" in collectedData) {
      setPropsCumulativeOF({
        ["1"]: collectedData["1"][collectedData["1"].length - 1],
        ["2"]: collectedData["2"][collectedData["2"].length - 1],
      });
    }
  };
  const processedChartData = () => {
    var output = [];
    var fillerArr2 = [...Array(num_trips)];
    output.push({
      label: `Unoptimised Cumulative`,
      data: processedCumulativeData["1"],
      pointRadius: 0,
      borderWidth: 5,
      borderColor: "rgb(252, 86, 121)",
      type: "line",
      yAxisID: "y1",
      backgroundColor: "rgb(252, 86, 121)",
    });

    output.push({
      label: `Optimised Cumulative`,
      data: processedCumulativeData["2"],
      pointRadius: 0,
      borderWidth: 5,
      borderColor: "rgb(13, 143, 143)",
      type: "line",
      yAxisID: "y1",
      backgroundColor: "rgb(13, 143, 143)",
    });
    // unoptimised dataset
    fillerArr2.map((x, i) =>
      output.push({
        label: `Trip ${i + 1} Unoptimised`,
        data: processedData["1"] ? processedData["1"][i + 1] : [],
        backgroundColor:
          (i % num_trips) % 2 == 0
            ? "rgb(240, 134, 156)"
            : "rgb(247, 178, 192)",
        stack: `Stack 1`,
        yAxisID: "y",
      })
    );

    // optimised dataset
    fillerArr2.map((x, i) =>
      output.push({
        label: `Trip ${i + 1} Optimised`,
        data: processedData["2"] ? processedData["2"][i + 1] : [],
        backgroundColor:
          (i % num_trips) % 2 == 0 ? "rgb(45, 189, 189)" : "rgb(110, 219, 219)",
        stack: `Stack 2`,
        yAxisID: "y",
      })
    );

    return output;
  };

  useEffect(() => {
    if (busStopData.length > 0) {
      var processedBusStopData = busStopData.map((busStop) => {
        return `${busStop.busStopNo},${busStop.stopId}`;
      });

      setBusStopLabel(processedBusStopData.slice(1));
    }
  }, [busStopData]);

  useEffect(() => {
    processObjectiveFn(unoptimisedOF.obj, optimisedOF.obj);
    processCumulativeObjectiveFn(unoptimisedOF.obj, optimisedOF.obj);
  }, [unoptimisedOF, optimisedOF]);


  useEffect(() => {
    if (skipToEndTrigger) {
      processObjectiveFn(obj_fn_matrix_1, obj_fn_matrix_2);
      processCumulativeObjectiveFn(obj_fn_matrix_1, obj_fn_matrix_2);
    }
  }, [skipToEndTrigger]);

  useEffect(() => {
    if (resetChart) {
      setProcessedData(null);
      setPropsCumulativeOF({});
      setProcessedCumulativeData({});
      setOptCumulativeOF(0);
      processCumulativeObjectiveFn(null, null);
      processObjectiveFn(null, null);
    }
  }, [resetChart]);

  useEffect(() => {
  }, [processedCumulativeData, processedData]);

  const data = {
    labels: busStopLabel,
    datasets: processedChartData(),
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: "Objective Function Bar Chart",
      },
      legend: {
        display: false,
        position: "top",
      },
      subtitle: {
        display: true,
        text: [
          "Description: This mixed chart displays the objective function for each bus stop on the left Y-Axis and the cumulative objective function for each model (optimised & unoptimised) on the right Y-Axis.",
          "The objective function indicates how well the actual headway follows the target headway. The lower the objective function, the less significant bus bunching can be observed.",
          "",
          "Goal: ↓ objective function = ↑ model optimisation = ↓ bus bunching.",
          "",
        ],
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Bus Stops (Bus Stop No., Bus ID)",
          font: {
            size: 12,
          },
        },
      },
      y: {
        stacked: true,
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Objective Function (Bus Stop)",
          font: {
            size: 12,
          },
        },
      },
      y1: {
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Objective Function (Cumulative)",
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <>
      <Bar options={options} data={data} />
    </>
  );
};

Metrics.propTypes = {
  unoptimisedOF: PropTypes.object,
  optimisedOF: PropTypes.object,
  busStopData: PropTypes.array,
  skipToEndTrigger: PropTypes.bool,
  setOptCumulativeOF: PropTypes.func,
  setUnoptCumulativeOF: PropTypes.func,
  setPropsCumulativeOF: PropTypes.func,
  start: PropTypes.bool,
  ended: PropTypes.bool,
  resetChart: PropTypes.bool
};

export default Metrics;
