// return all unique values present within the array
export const getAllUniqueValues = (objsArr, keyName) => {
  let resValues = [];
  for (const obj of objsArr) {
    resValues.push(obj[keyName]);
  }
  resValues = Array.from(new Set(resValues));
  return resValues;
};

// separate original array by key
export const getRecordsWithUniqueKey = (objsArr, keyName, step = 1) => {
  const uniqueValues = getAllUniqueValues(objsArr, keyName);
  let resValues = {};
  for (let i = 0; i < uniqueValues.length; i += step) {
    resValues[uniqueValues[i]] = [];
  }
  for (const row of objsArr) {
    if (resValues[row[keyName]]) {
      resValues[row[keyName]].push(row);
    }
  }
  return resValues;
};

export const normalizeStartTime = ({ optimizedData, unoptimizedData }) => {
  const optimizedFirstRec = optimizedData[0];
  const unoptimizedFirstRec = unoptimizedData[0];
  let tmpOptimized = optimizedData;
  let tmpUnoptimized = unoptimizedData;
  // normalize start
  if (optimizedFirstRec.timestamp > unoptimizedFirstRec.timestamp) {
    // optimized file start later > bigger first time, normalize optimized
    for (
      let i = unoptimizedFirstRec.timestamp;
      i < optimizedFirstRec.timestamp;
      i++
    ) {
      let tmpRec = JSON.parse(JSON.stringify(optimizedFirstRec));
      tmpRec.timestamp = i;
      tmpOptimized.push(tmpRec);
    }
  } else {
    // unoptimized file start later > bigger first time, normalize unoptimized
    for (
      let i = optimizedFirstRec.timestamp;
      i < unoptimizedFirstRec.timestamp;
      i++
    ) {
      let tmpRec = JSON.parse(JSON.stringify(unoptimizedFirstRec));
      tmpRec.timestamp = i;
      tmpUnoptimized.push(tmpRec);
    }
  }
  // sort by timestamp
  tmpOptimized.sort((a, b) => a.timestamp - b.timestamp);
  tmpUnoptimized.sort((a, b) => a.timestamp - b.timestamp);
  return {
    normalizedOptimizedData: tmpOptimized,
    normalizedUnoptimizedData: tmpUnoptimized,
  };
};

export const processCsvData = (data) => {
  let tmpJourneyData = [];
  for (let i = 0; i < data.length; i++) {
    const rowData = data[i];
    const [
      timestamp,
      bus_trip_no,
      status,
      bus_stop_no,
      stop_id,
      stop_name,
      latitude,
      longitude,
      distance,
    ] = rowData;
    tmpJourneyData.push({
      timestamp: parseInt(timestamp),
      lat: parseFloat(parseFloat(latitude).toFixed(6)),
      lng: parseFloat(parseFloat(longitude).toFixed(6)),
      opacity: 0,
      stopId: stop_id,
      stopName: stop_name,
      busStopNo: parseInt(bus_stop_no),
      currentStatus: status,
      busTripNo: parseInt(bus_trip_no),
      distance: parseFloat(distance),
    });
  }
  const tmpStopObjs = tmpJourneyData.filter((r) => {
    return (
      r.busTripNo == 1 &&
      (r.currentStatus === "STOPPED_AT" ||
        r.currentStatus === "DISPATCHED_FROM")
    );
  });
  for (const row of tmpStopObjs) {
    row.opacity = 0.8;
  }
  tmpStopObjs.sort((a, b) => a.timestamp - b.timestamp);
  tmpJourneyData = tmpJourneyData.filter((r) => !isNaN(r.timestamp));
  return {
    journeyData: tmpJourneyData,
    stopObjs: tmpStopObjs,
  };
};
