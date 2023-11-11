import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  Title,
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
  Legend,
  SubTitle
);

const Metrics = React.memo(
  ({
    unoptimisedOF,
    optimisedOF,
    skipToEndTrigger,
    setOptCumulativeOF,
    setUnoptCumulativeOF,
    setPropsCumulativeOF,
    resetChart,
    optimizedOutputJson,
    unoptimizedOutputJson,
    stopObjs
  }) => {
    const [processedData, setProcessedData] = useState({});
    const [processedCumulativeData, setProcessedCumulativeData] = useState({});
    const [busStopLabel, setBusStopLabel] = useState([]);
    const [numTrips, setNumTrips] = useState(0);

    // process objective function per bus stop
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

    // process cumulative objective function over the visualisation timeframe
    const processCumulativeObjectiveFn1 = (unoptimised, optimised) => {
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
    // process cumulative objective function immediately upon page load
    const processCumulativeObjectiveFn2 = (unoptimised, optimised) => {

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

      if (collectedData["2"]) {
        setOptCumulativeOF(collectedData["2"][collectedData["2"].length - 1]);
      }
      if (collectedData["1"]) {
        setUnoptCumulativeOF(collectedData["1"][collectedData["1"].length - 1]);
      }
    };

    // process data for chart
    const processedChartData = () => {
      var output = [];
      var fillerArr2 = [...Array(numTrips)];

      // cumulative line unoptimised line chart
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
      // cumulative line optimised line chart
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
      // unoptimised stacked bar chart (stacked because everytime a bus reaches a bus stop, it adds onto its objective function value)
      fillerArr2.map((x, i) =>
        output.push({
          label: `Trip ${i + 1} Unoptimised`,
          data: processedData["1"] ? processedData["1"][i + 1] : [],
          backgroundColor: "rgb(240, 134, 156)",
          stack: `Stack 1`,
          yAxisID: "y",
        })
      );
      // optimised stacked bar chart 
      fillerArr2.map((x, i) =>
        output.push({
          label: `Trip ${i + 1} Optimised`,
          data: processedData["2"] ? processedData["2"][i + 1] : [],
          backgroundColor: "rgb(45, 189, 189)",
          stack: `Stack 2`,
          yAxisID: "y",
        })
      );

      return output;
    };

    useEffect(() => {
      if (stopObjs.length > 0) {
        var processedBusStopData = stopObjs.map((busStop) => {
          return `[${busStop.busStopNo}]  ${busStop.stopId}`;
        });
        setBusStopLabel(processedBusStopData.slice(1));
      }
    }, [stopObjs]);

    useEffect(() => {
      processObjectiveFn(unoptimisedOF.obj, optimisedOF.obj);
      processCumulativeObjectiveFn1(unoptimisedOF.obj, optimisedOF.obj);
    }, [unoptimisedOF, optimisedOF]);

    useEffect(() => {
      setNumTrips(unoptimizedOutputJson.num_trips)
      if (skipToEndTrigger) {
        processObjectiveFn(unoptimizedOutputJson.obj_fn_matrix, optimizedOutputJson.obj_fn_matrix);
        processCumulativeObjectiveFn1(unoptimizedOutputJson.obj_fn_matrix, optimizedOutputJson.obj_fn_matrix);
      }
      processCumulativeObjectiveFn2(unoptimizedOutputJson.obj_fn_matrix, optimizedOutputJson.obj_fn_matrix);
    }, [skipToEndTrigger, optimizedOutputJson, unoptimizedOutputJson]);

    useEffect(() => {
      if (resetChart) {
        setProcessedData(null);
        setPropsCumulativeOF({});
        setProcessedCumulativeData({});
        setOptCumulativeOF(0);
        processCumulativeObjectiveFn1(null, null);
        processObjectiveFn(null, null);
      }
    }, [resetChart]);

    useEffect(() => { }, [processedCumulativeData, processedData]);

    const data = {
      labels: busStopLabel,
      datasets: processedChartData(),
    };

    const options = {
      plugins: {
        title: {
          display: false,
          text: "Objective Function Mixed Chart",
        },
        legend: {
          display: false,
          position: "top",
        },
        subtitle: {
          display: true,
          text: [
            "Goal: The shorter/lower the bar/line, the better.",
            "Colors: Green (optimised); Red (unoptimised)",
            "Type: Line (Cumulative Objective Function); Bar (Bus Stop Objective Function)"

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
            text: "Bus Stops <[Bus Stop No.]  Bus Stop ID>",
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
  }
);

Metrics.propTypes = {
  unoptimisedOF: PropTypes.object,
  optimisedOF: PropTypes.object,
  skipToEndTrigger: PropTypes.bool,
  setOptCumulativeOF: PropTypes.func,
  setUnoptCumulativeOF: PropTypes.func,
  setPropsCumulativeOF: PropTypes.func,
  start: PropTypes.bool,
  ended: PropTypes.bool,
  resetChart: PropTypes.bool,
  optimizedOutputJson: PropTypes.object,
  unoptimizedOutputJson: PropTypes.object,
  stopObjs: PropTypes.array
};

Metrics.displayName = "Metrics";

export default Metrics;
