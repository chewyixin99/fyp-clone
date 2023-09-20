import { useEffect } from "react";
import PropTypes from "prop-types";
import Map from "../components/mapsPage/Map";
import {
  stopObjs,
  journeyMarkers,
} from "../data/constants";
import Papa from "papaparse";

const MapsPage = ({
  paused,
  ended,
  setPaused,
  setEnded,
  busIndexBefore,
  busIndexAfter,
  setBusIndexBefore,
  setBusIndexAfter,
  numBusCurrBefore,
  numBusCurrAfter,
  setNumBusCurrBefore,
  setNumBusCurrAfter,
  zoom,
  setZoom,
  center,
  setCenter,
}) => {
  const stopsBefore = stopObjs.before;
  const stopsAfter = stopObjs.after;
  const journeyBefore = journeyMarkers.before;
  const journeyAfter = journeyMarkers.after;
  // todo: uncomment below once full data in
  // const [journeyBefore, setJourneyBefore] = useState([]);
  // const [journeyAfter, setJourneyAfter] = useState([]);

  // todo: uncomment below once full data in
  // const [polyPath, setPolyPath] = useState();

  const fetchData = async () => {
    Papa.parse("./v1.1_output.csv", {
      // options
      download: true,
      complete: (res) => {
        const tmpJourneyData = [];
        const data = res.data.slice(1);
        for (let i = 0; i < data.length; i += 20) {
          const rowData = data[i];
          tmpJourneyData.push({
            timestamp: parseFloat(rowData[0]),
            lat: parseFloat(rowData[4]),
            lng: parseFloat(rowData[5]),
            opacity: 0,
            stopId: "to be filled",
            stopName: "to be filled",
            busStopNo: parseInt(rowData[3]),
            currentStatus: rowData[2],
            busTripNo: parseInt(rowData[1]),
            distance: parseFloat(rowData[6]),
          });
        }
        // setJourneyBefore(tmpJourneyData);
        // setJourneyAfter(tmpJourneyData);

        let tmpPolyPath = [];
        for (const r of data) {
          if (r[4] !== undefined && r[5] !== undefined) {
            tmpPolyPath.push({ lat: parseFloat(r[4]), lng: parseFloat(r[5]) });
          }
        }
        // setPolyPath(tmpPolyPath);
      },
    });
  };

  useEffect(() => {
    // todo: uncomment below once full data in
    // fetchData();
  }, []);

  return (
    <div>
      {/* Maps below */}
      <div className="flex justify-evenly my-10">
        <div className="w-[40vw] border">
          <Map
            busIndex={busIndexBefore}
            setBusIndex={setBusIndexBefore}
            numBusCurr={numBusCurrBefore}
            setNumBusCurr={setNumBusCurrBefore}
            isOptimized={false}
            stops={stopsBefore}
            journey={journeyBefore}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            setZoom={setZoom}
            center={center}
            setCenter={setCenter}
            ended={ended}
            setEnded={setEnded}
            // polyPath={polyPath}
          />
        </div>
        <div className="w-[40vw] border">
          <Map
            busIndex={busIndexAfter}
            setBusIndex={setBusIndexAfter}
            numBusCurr={numBusCurrAfter}
            setNumBusCurr={setNumBusCurrAfter}
            isOptimized={true}
            stops={stopsAfter}
            journey={journeyAfter}
            paused={paused}
            setPaused={setPaused}
            zoom={zoom}
            setZoom={setZoom}
            center={center}
            setCenter={setCenter}
            ended={ended}
            setEnded={setEnded}
            // polyPath={polyPath}
          />
        </div>
      </div>
    </div>
  );
};

MapsPage.propTypes = {
  paused: PropTypes.bool,
  ended: PropTypes.bool,
  setPaused: PropTypes.func,
  setEnded: PropTypes.func,
  busIndexBefore: PropTypes.object,
  numBusCurrBefore: PropTypes.number,
  busIndexAfter: PropTypes.object,
  numBusCurrAfter: PropTypes.number,
  setBusIndexBefore: PropTypes.func,
  setNumBusCurrBefore: PropTypes.func,
  setBusIndexAfter: PropTypes.func,
  setNumBusCurrAfter: PropTypes.func,
  setCenter: PropTypes.func,
  setZoom: PropTypes.func,
  zoom: PropTypes.number,
  center: PropTypes.object,
};

export default MapsPage;
