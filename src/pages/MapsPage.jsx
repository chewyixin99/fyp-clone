import Map from "../components/mapsPage/Map";
import { stopObjs } from "../data/constants";
import { journeyMarkers } from "../data/constants";

const MapsPage = () => {
  const stopsBefore = [...stopObjs];
  const journeyBefore = JSON.parse(JSON.stringify(journeyMarkers));
  const stopsAfter = [...stopObjs];
  const journeyAfter = JSON.parse(JSON.stringify(journeyMarkers));

  return (
    <div className="flex justify-evenly my-10">
      <div className="w-[40vw] border">
        <Map isOptimized={false} stops={stopsBefore} journey={journeyBefore} />
      </div>
      <div className="w-[40vw] border">
        <Map isOptimized={true} stops={stopsAfter} journey={journeyAfter} />
      </div>
    </div>
  );
};

export default MapsPage;
