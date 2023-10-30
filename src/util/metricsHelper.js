export const processObjectiveFn = (unoptimised, optimised) => {
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
  return collectedData;
};

export const processCumulativeObjectiveFn = (unoptimised, optimised) => {
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

  return collectedData

};
