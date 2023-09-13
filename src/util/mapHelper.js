export const isBusInJourney = (busObj) => {
  return busObj.currStop === -1 ? false : true;
};

export const updateBusCurrStop = (busObj, last) => {
  // only update if a journey is started and index is <= total num stops
  return isBusInJourney(busObj) && busObj.currStop !== last ? true : false;
};
