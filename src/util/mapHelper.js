export const isBusInJourney = (busObj) => {
  return busObj.currStop === -1 ? false : true;
};

export const updateBusCurrStop = (busObj, last) => {
  // only update if a journey is started and index is <= total num stops
  return isBusInJourney(busObj) && busObj.currStop !== last ? true : false;
};

export const busesCurrentlyInJourney = (numBusArr) => {
  for (const numBus of numBusArr) {
    if (numBus !== 0) {
      return true;
    }
  }
  return false;
};

export const resetOpacity = (objsArr) => {
  for (const obj of objsArr) {
    obj.opacity = 0;
  }
};

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
export const getRecordsWithUniqueKey = (objsArr, keyName) => {
  const uniqueValues = getAllUniqueValues(objsArr, keyName);
  let resValues = {};
  for (const val of uniqueValues) {
    const recordsWithVal = objsArr.filter((r) => {
      return r[keyName] === val;
    });
    resValues[val - 1] = recordsWithVal;
  }
  return resValues;
};

// check if time exceeds, if yes, return indexes that are required to start
export const startBusIfTime = (busJourney, currTime) => {
  if (busJourney.length !== 0) {
    const firstRecordTime = busJourney[0].timestamp;
    if (currTime >= firstRecordTime) {
      return true;
    }
  }
  return false;
};
