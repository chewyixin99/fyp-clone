export const convert_seconds_to_time = (seconds) => {
  if (isNaN(seconds) || seconds == null) return "-";
  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return min + "m " + sec + "s";

};
export const formatDistance = (data, totalDistance) => {
  return parseFloat(((data / totalDistance) * 100).toFixed(2));
};

export const createDataObj = (data) => {
  var dataObj = {};
  data.map((item) => {
    if (item.timestamp in dataObj) {
      dataObj[item.timestamp].push(item);
    } else {
      dataObj[item.timestamp] = [item];
    }
  });

  return dataObj;
};

export const getOF = (currentStop, matrix_1, matrix_2, id) => {
  var { busTripNo, busStopNo } = currentStop
  var temp_key = busTripNo + ',' + busStopNo
  if (id == '1') {
    // unoptimised
    return matrix_1[temp_key]
  }
  return matrix_2[temp_key]
}

export const updateObjectiveFunction = (currentStop,OFObj) => {
  var { busTripNo, busStopNo } = currentStop
  var currentOF = getOF(currentStop)
  var currentSave = OFObj;
  currentSave[[busTripNo, busStopNo]] = currentOF;
  return currentSave;
};