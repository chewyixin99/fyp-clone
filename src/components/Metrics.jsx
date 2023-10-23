import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {num_trips, weights_list} from "../../public/actual_input_2908"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  plugins: {
    title: {
      display: true,
      text: "Objective Function Bar Chart",
    },
  },
  // responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
  maintainAspectRatio : false,
};

const labels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "Novemeber",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
];

const Metrics = ({ saveHeadwayObj, saveHeadwayObjOptimised, busStopData }) => {
  const [processedData, setProcessedData] = useState({});
  const [numberOfBusTrips, setNumberOfBusTrips] = useState(0);
  const [busStopLabel, setBusStopLabel] = useState([]);
  const [sumOfWeights, setSumOfWeights] = useState(0);
  const [beta, setBeta] = useState(0);

  const convertToObjFn = (headway,i) => {
    return Math.round(beta * (Math.pow((headway - 720),2) * weights_list[i]),0); 
  }

  const sumOfWeightsFn = () => {
    var sum = 0;
    for (var i = 0; i < weights_list.length; i++) {
      sum += weights_list[i];
    }
    setSumOfWeights(sum);
  }

  const processHeadwayData = (unoptimised, optimised) => {
    var obj = unoptimised.obj;
    var objOptimised = optimised.obj;

    var collectedData = {};

    if (obj != null) {
      var temp = {};
      Object.keys(obj).forEach((key) => {
        var tripNo1 = key.split(",")[1];
        if (temp[tripNo1]) {
          var len = temp[tripNo1].length;
          temp[tripNo1].push(convertToObjFn(obj[key],len));
        } else {
          temp[tripNo1] = [convertToObjFn(obj[key],0)];
        }
      });
      collectedData["1"] = temp;
      setNumberOfBusTrips(Object.keys(temp).length);
    }

    if (objOptimised != null){
      var tempOptimised = {};
      Object.keys(objOptimised).forEach((key) => {
        var tripNo2 = key.split(",")[1];
        if (tempOptimised[tripNo2]) {
          var len = tempOptimised[tripNo2].length;
          tempOptimised[tripNo2].push(convertToObjFn(objOptimised[key],len));
        } else {
          tempOptimised[tripNo2] = [convertToObjFn(objOptimised[key],0)];
        }
      });
      collectedData["2"] = tempOptimised;
    }

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
    setBeta(1/((num_trips-1)*sumOfWeights));
  }, [busStopData]);

  useEffect(() => {
    processHeadwayData(saveHeadwayObj,saveHeadwayObjOptimised);
  }, [saveHeadwayObj, saveHeadwayObjOptimised, beta, sumOfWeights]);

  useEffect(() => {
    console.log(processedData);
  }, [processedData]);

  useEffect(() => {
    // console.log(busStopLabel);
  }, [busStopLabel]);

  const data = {
    labels: busStopLabel,
    // datasets represent the trips
    // stack represent the bus stops
    // labels represents the bus stops based on model
    // 0,1,2,3,4,5
    datasets: [...Array(numberOfBusTrips * 2)].map((x, i) => ({
      label: `Trip ${(i % numberOfBusTrips) + 2} ${i > numberOfBusTrips - 1 ? "Optimised" : "Unoptimised"}`, // +2 because only 3 headways for 4 trips so first headway trip is 0+2
      data: processedData[i>(numberOfBusTrips-1) ? "2" : "1"][(i%numberOfBusTrips)+1],
      backgroundColor:
        (i>(numberOfBusTrips-1) ? "2" : "1") == "2" ? ((i % numberOfBusTrips) % 2 == 0
        ? "rgb(13, 143, 143)"
        : "rgb(75, 192, 192)") : ((i % numberOfBusTrips) % 2 == 0
        ? "rgb(255, 99, 132)"
        : "rgb(250, 152, 173)"),
      stack: `Stack ${i>(numberOfBusTrips-1) ? "2" : "1"}`,
    })),

  };

  return <Bar options={options} data={data} />;
};

Metrics.propTypes = {
  saveHeadwayObj: PropTypes.string,
  saveHeadwayObjOptimised: PropTypes.string,
  busStopData: PropTypes.array,
};

export default Metrics;
