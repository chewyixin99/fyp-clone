import * as fs from "fs";

const stopsTxt = fs.readFileSync("./stops-required-clean.txt", "utf-8");

const convertStopsToArr = (file) => {
  const arr = file.split(/\r?\n/).slice(1);
  const resArr = [];
  for (const row of arr) {
    let tmpObj = {};
    let cleanRow = row.replaceAll('"', "");
    cleanRow = cleanRow.replaceAll("Utrecht, ", "");
    const cols = cleanRow.split(",");
    const stopId = cols[0];
    const stopName = cols[2];
    const stopLat = parseFloat(cols[3]);
    const stopLng = parseFloat(cols[4]);
    tmpObj["lat"] = stopLat;
    tmpObj["lng"] = stopLng;
    tmpObj["stopId"] = stopId;
    tmpObj["stopName"] = stopName;
    resArr.push(tmpObj);
  }
  return resArr;
};

const getStopsData = convertStopsToArr(stopsTxt);
console.log(getStopsData);
