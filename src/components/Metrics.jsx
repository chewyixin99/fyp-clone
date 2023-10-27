import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  num_trips,
  weights_list,
  target_headway_2dlist,
} from "../../public/actual_input_2710";
import { headway_matrix as headway_matrix_optimised } from "../../public/v1_0CVXPY_optimised_output";
import { headway_matrix as headway_matrix_unoptimised } from "../../public/v1_0CVXPY_unoptimised_output";

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
import { Bar, Line } from "react-chartjs-2";

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

const Metrics = ({ saveHeadwayObj, saveHeadwayObjOptimised, busStopData }) => {
  const [processedData, setProcessedData] = useState({});
  const [processedCumulativeData, setProcessedCumulativeData] = useState({});
  const [numberOfBusTrips, setNumberOfBusTrips] = useState(0);
  const [busStopLabel, setBusStopLabel] = useState([]);
  const [sumOfWeights, setSumOfWeights] = useState(0);
  const [beta, setBeta] = useState(0);

  const convertToObjFn = (headway, stopNo, tripNo) => {
    var output = Math.round(
      beta *
      // target_headway_2dlist[tripNo][stopNo]
        (Math.pow(headway - 720, 2) *
          0.5),
      0
    );

    if (output){
      return output;
    }
    else {
      return 0;
    }
  };

  const sumOfWeightsFn = () => {
    var sum = 0;
    for (var i = 0; i < weights_list.length; i++) {
      sum += weights_list[i];
    }
    setSumOfWeights(sum);
  };

  const processObjectiveFn = (unoptimised, optimised) => {
    var obj = unoptimised.obj;
    var objOptimised = optimised.obj;

    var collectedData = {};

    if (obj != null) {
      var temp = {};
      Object.keys(obj).forEach((key) => {
        var tripNo_unoptimised = key.split(",")[0];
        if (temp[tripNo_unoptimised]) {
          var len = temp[tripNo_unoptimised].length;
          temp[tripNo_unoptimised].push(
            convertToObjFn(obj[key], len, tripNo_unoptimised)
          );
        } else {
          temp[tripNo_unoptimised] = [
            convertToObjFn(obj[key], 0, tripNo_unoptimised),
          ];
        }
      });
      temp["1"] = addPreTrip(headway_matrix_unoptimised);
      collectedData["1"] = temp;
      setNumberOfBusTrips(num_trips);
    }

    if (objOptimised != null) {
      var tempOptimised = {};
      Object.keys(objOptimised).forEach((key) => {
        var tripNo_optimised = key.split(",")[0];
        if (tempOptimised[tripNo_optimised]) {
          var len = tempOptimised[tripNo_optimised].length;
          tempOptimised[tripNo_optimised].push(
            convertToObjFn(objOptimised[key], len, tripNo_optimised)
          );
        } else {
          tempOptimised[tripNo_optimised] = [
            convertToObjFn(objOptimised[key], 0, tripNo_optimised),
          ];
        }
      });
      tempOptimised["1"] = addPreTrip(headway_matrix_optimised);
      collectedData["2"] = tempOptimised;
    }
    // console.log(collectedData);
    setProcessedData(collectedData);
  };
  useEffect(() => {
    sumOfWeightsFn();
    if (busStopData.length > 0) {
      setBusStopLabel(
        busStopData.slice(1).map((busStop) => {
          return `No. ${busStop[0]}, ${busStop[1]}`;
        })
      );
    }
    setBeta(1 / ((num_trips - 1) * sumOfWeights));
  }, [busStopData]);

  const processCumulativeObjectiveFn = (unoptimised, optimised) => {
    var obj = unoptimised.obj;
    var objOptimised = optimised.obj;
    // console.log(obj);
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
      // console.log(temp);
      var cumulative_output = []
      var currentCumulative = 0;
      Object.keys(temp).forEach((stopNo_unoptimised) => {

        temp[stopNo_unoptimised].map((headway, i) => {
          // console.log(headway,convertToObjFn(headway,stopNo_unoptimised,i),stopNo_unoptimised,i);
          currentCumulative += convertToObjFn(headway,stopNo_unoptimised,i)
       })
       cumulative_output.push(parseInt(currentCumulative))
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

      var cumulative_optimised_output = []
      var currentCumulativeOptimised = 0;
      Object.keys(tempOptimised).forEach((stopNo_optimised) => {
        tempOptimised[stopNo_optimised].map((headway, i) => {
          currentCumulativeOptimised += convertToObjFn(headway,stopNo_optimised,i)
       })
       cumulative_optimised_output.push(parseInt(currentCumulativeOptimised))
      });
      collectedData["2"] = cumulative_optimised_output;
    }
    setProcessedCumulativeData(collectedData);

  }

  const addPreTrip = (headway) => {
    var output = [];
    Object.keys(headway).forEach((key) => {
      var tripNo = key.split(",")[0];
      var stop_no = key.split(",")[1];
      if (tripNo == 1) {
        output.push(convertToObjFn(headway[key], stop_no - 2, tripNo));
      }
    });

    return output;
  };
  useEffect(() => {
    processObjectiveFn(saveHeadwayObj, saveHeadwayObjOptimised);
    processCumulativeObjectiveFn(saveHeadwayObj, saveHeadwayObjOptimised);
  }, [saveHeadwayObj, saveHeadwayObjOptimised, beta, sumOfWeights]);

  useEffect(() => {
    // console.log(processedCumulativeData);
  }, [processedCumulativeData]);

  const processedChartData = () => {
    var output = [];
    var fillerArr1 = [...Array(numberOfBusTrips * 2)];
    var fillerArr2 = [...Array(numberOfBusTrips)];

    // unoptimised dataset
    fillerArr2.map((x, i) =>
      output.push({
        label: `Trip ${i + 1} Unoptimised`,
        data: processedData["1"][i + 1],
        backgroundColor:
          (i % numberOfBusTrips) % 2 == 0
            ? "rgb(255, 99, 132)"
            : "rgb(250, 152, 173)",
        stack: `Stack 1`,
        yAxisID: "y",
      })
    );

    // optimised dataset
    fillerArr2.map((x, i) =>
      output.push({
        label: `Trip ${i + 1} Optimised`,
        data: processedData["2"][i + 1],
        backgroundColor:
          (i % numberOfBusTrips) % 2 == 0
            ? "rgb(13, 143, 143)"
            : "rgb(75, 192, 192)",
        stack: `Stack 2`,
        yAxisID: "y",
      })
    );
    output.push({
      label: `Unoptimised Cummulative Objective Function`,
      data: processedCumulativeData["1"],
      type: "line",
      yAxisID: "y1",
      backgroundColor:"rgb(250, 152, 173)",
    });

    output.push({
      label: `Optimised Cummulative Objective Function`,
      data: processedCumulativeData["2"],
      type: "line",
      yAxisID: "y1",
      backgroundColor: "rgb(75, 192, 192)",
    });
    return output;

    // (i > numberOfBusTrips - 1 ? "2" : "1") == "2"
    //         ? (i % numberOfBusTrips) % 2 == 0
    //           ? "rgb(13, 143, 143)"
    //           : "rgb(75, 192, 192)"
    //         : (i % numberOfBusTrips) % 2 == 0
    //         ? "rgb(255, 99, 132)"
    //         : "rgb(250, 152, 173)",
  };
  const data = {
    labels: busStopLabel,
    // [[...Array(numberOfBusTrips * 2)].map((x, i) => ({
    //   label: `Trip ${(i % numberOfBusTrips) + 2} ${
    //     i > numberOfBusTrips - 1 ? "Optimised" : "Unoptimised"
    //   }`, // +2 because only 3 headways for 4 trips so first headway trip is 0+2
    //   data: processedData[i > numberOfBusTrips - 1 ? "2" : "1"][
    //     (i % numberOfBusTrips) + 1
    //   ],
    //   backgroundColor:
    //     (i > numberOfBusTrips - 1 ? "2" : "1") == "2"
    //       ? (i % numberOfBusTrips) % 2 == 0
    //         ? "rgb(13, 143, 143)"
    //         : "rgb(75, 192, 192)"
    //       : (i % numberOfBusTrips) % 2 == 0
    //       ? "rgb(255, 99, 132)"
    //       : "rgb(250, 152, 173)",
    //   stack: `Stack ${i > numberOfBusTrips - 1 ? "2" : "1"}`,
    //   yAxisID: 'y',
    // }),{
    //   label: "Line value",
    //   data: [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5],
    //   borderColor: `rgba(255,200,100, 0.1)`,
    //   backgroundColor: `rgba(255,200,100,0.5)`,
    //   yAxisID: 'y1',
    // })]
    // multiply by 2 for optimised and unoptimised trips
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
          "Description: This mixed chart displays the objective function for each bus stop on the left Y-Axis and the cummulative objective function for each model (optimised & unoptimised) on the right Y-Axis.",
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
          text: "Objective Function (Cummulative)",
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

  return <Bar options={options} data={data} />;
};

Metrics.propTypes = {
  saveHeadwayObj: PropTypes.object,
  saveHeadwayObjOptimised: PropTypes.object,
  busStopData: PropTypes.array,
};

export default Metrics;
