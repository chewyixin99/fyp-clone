// return all unique values present within the array
export const getAllUniqueValues = (objsArr, keyName) => {
  const resValues = [];
  for (const obj of objsArr) {
    if (!resValues.includes(obj[keyName])) {
      resValues.push(obj[keyName]);
    }
  }
  return resValues;
};

// separate original array by key
export const getRecordsWithUniqueKey = (objsArr, keyName, step = 1) => {
  const uniqueValues = getAllUniqueValues(objsArr, keyName);
  let resValues = {};
  for (let i = 0; i < uniqueValues.length; i += step) {
    const val = uniqueValues[i];
    const recordsWithVal = objsArr.filter((r) => {
      return r[keyName] === val;
    });
    resValues[val] = recordsWithVal;
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
