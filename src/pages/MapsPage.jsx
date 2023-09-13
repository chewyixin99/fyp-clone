import Map from "../components/mapsPage/Map";

const MapsPage = () => {
  return (
    <div className="flex justify-evenly my-10">
      <div className="w-[40vw] border p-3">
        <Map isOptimized={false} />
      </div>
      <div className="w-[40vw] border p-3">
        <Map isOptimized={true} />
      </div>
    </div>
  );
};

export default MapsPage;
