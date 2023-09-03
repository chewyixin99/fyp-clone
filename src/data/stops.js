import * as fs from "fs";

const stopsTxt = fs.readFileSync("./stops-required-clean.txt", "utf-8");

const convertStopsToArr = (file) => {
  const arr = file.split(/\r?\n/).slice(1);
  const resArr = [];
  for (const row of arr) {
    let tmpObj = {};
    let cleanRow = row.replaceAll('"', "");
    cleanRow = cleanRow.split(",")
    if (cleanRow.length > 13) {
      cleanRow[3] = [cleanRow[3], cleanRow[4]].join(",");
      cleanRow.splice(4, 1)
    }
    const [
      stop_id,
      stop_code,
      stop_name,
      tts_stop_name,
      stop_desc,
      stop_lat,
      stop_lon,
      zone_id,
      stop_url,
      location_type,
      parent_station,
      direction,
      position,
    ] = cleanRow;
    tmpObj["lat"] = parseFloat(stop_lat);
    tmpObj["lng"] = parseFloat(stop_lon);
    tmpObj["stopId"] = stop_id;
    tmpObj["stopName"] = stop_name;
    // // store the rest of the details for ease of retrieval
    // tmpObj.stopObj = {
    //   stop_id: stop_id,
    //   stop_code: stop_code,
    //   stop_name: stop_name,
    //   tts_stop_name: tts_stop_name,
    //   stop_desc: stop_desc,
    //   stop_lat: parseFloat(stop_lat),
    //   stop_lon: parseFloat(stop_lon),
    //   zone_id: zone_id,
    //   stop_url: stop_url,
    //   location_type: location_type,
    //   parent_station: parent_station,
    //   direction: direction,
    //   position: position,
    // };
    resArr.push(tmpObj);
  }
  return resArr;
};

const getStopsData = convertStopsToArr(stopsTxt);
console.log(getStopsData);
