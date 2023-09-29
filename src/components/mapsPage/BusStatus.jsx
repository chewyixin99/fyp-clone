import PropTypes from "prop-types";

const BusStatus = ({ busNum, busDetails, currStopDetails }) => {
  const inJourney = currStopDetails !== undefined;
  return (
    <div className="m-3 text-xs">
      {!inJourney ? (
        <div className="flex justify-between">
          <div>Bus {parseInt(busNum) + 1} status:</div>
          <div>not dispatched</div>
        </div>
      ) : (
        <div className="flex justify-between">
          <div>
            Bus {parseInt(busNum) + 1} status: {currStopDetails.currentStatus}
          </div>
          <div>stop no {currStopDetails.busStopNo}</div>
        </div>
      )}
      <div className="border p-3 my-2 max-w-[30vw]">
        {!inJourney ? (
          <div>Bus is currently not dispatched</div>
        ) : (
          <div className="">
            <div className="flex justify-between">
              <div>{currStopDetails.stopId}</div>
              <div>{currStopDetails.lat}</div>
            </div>
            <div className="flex justify-between">
              <div>{currStopDetails.stopName}</div>
              <div>{currStopDetails.lng}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

BusStatus.propTypes = {
  busNum: PropTypes.string,
  busDetails: PropTypes.object,
  currStopDetails: PropTypes.object,
};

export default BusStatus;
