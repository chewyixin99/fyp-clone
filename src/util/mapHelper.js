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
