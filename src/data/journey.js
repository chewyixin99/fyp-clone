import * as fs from "fs";
import * as util from "util";

const journeyCSV = fs.readFileSync("./trimet-mock.csv", "utf-8");

const extractDetailsFromCSV = (file) => {
  // slice 1 to remove headers
  const arr = file.split(/\r?\n/).slice(1);
  const resObj = {};
  const journeyLatLngs = [];
  // clean rows to make sure they all have the same num of cols
  for (const row of arr) {
    let tmpObj = {};
    const rowArr = row.split(",");
    if (rowArr.length > 13) {
      console.log("enter");
    }
    const [
      timeStamp,
      tripId,
      routeId,
      directionId,
      startTime,
      startDate,
      label,
      lat,
      long,
      stopSequence,
      stopId,
      currentStatus,
      stopName,
    ] = rowArr;
    // add details as and when needed
    tmpObj["tripId"] = tripId;
    tmpObj["timeStamp"] = timeStamp;
    tmpObj["lat"] = parseFloat(lat);
    tmpObj["lng"] = parseFloat(long);
    tmpObj["stopSequence"] = parseInt(stopSequence);
    tmpObj["stopId"] = stopId;
    tmpObj["stopName"] = stopName;
    tmpObj["currentStatus"] = currentStatus;
    // take up to x number for each stopSequence
    if (tmpObj.tripId !== undefined) {
      if (resObj[stopSequence] === undefined) {
        resObj[stopSequence] = { hasStop: false, paths: [tmpObj] };
      } else if (
        // resObj[stopSequence]["paths"].length < 10 &&
        tmpObj["currentStatus"] !== "STOPPED_AT"
      ) {
        resObj[stopSequence]["paths"].push(tmpObj);
      } else if (
        tmpObj["currentStatus"] === "STOPPED_AT" &&
        !resObj[stopSequence]["hasStop"]
      ) {
        resObj[stopSequence]["hasStop"] = true;
        resObj[stopSequence]["paths"].push(tmpObj);
      }
    }
  }
  for (const key in resObj) {
    for (const item of resObj[key]["paths"]) {
      journeyLatLngs.push({
        timeStamp: parseInt(item.timeStamp),
        lat: item.lat,
        lng: item.lng,
        opacity: 0,
        stopId: item.stopId,
        stopName: item.stopName,
        stopSequence: item.stopSequence,
        currentStatus: item.currentStatus,
      });
    }
  }
  // sort by timestamp
  journeyLatLngs.sort(function (a, b) {
    const keyA = a.timeStamp;
    const keyB = b.timeStamp;
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  // get one full loop, by taking reference of the first stop
  const finalJourneyInOrder = [];
  const firstStop = journeyLatLngs[0].stopSequence;
  let checkForRepeat = false;
  for (let i = 0; i < journeyLatLngs.length; i++) {
    const item = journeyLatLngs[i];
    if (item.stopSequence === firstStop && i === finalJourneyInOrder.length) {
      finalJourneyInOrder.push(item);
    } else if (item.stopSequence !== firstStop && !checkForRepeat) {
      checkForRepeat = true;
    }

    if (item.stopSequence === firstStop && checkForRepeat) {
      break;
    }

    finalJourneyInOrder.push(item);
  }
  // final sort by stopsequence
  finalJourneyInOrder.sort(function (a, b) {
    const keyA = a.stopSequence;
    const keyB = b.stopSequence;
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  return finalJourneyInOrder;
};

const journeyDetails = extractDetailsFromCSV(journeyCSV);
console.log(util.inspect(journeyDetails, { maxArrayLength: null }));