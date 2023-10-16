/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react'

const BusStop = ({id,start, globalTime, dataObj, updateHeadway}) => {

  const [triggerStart, setTriggerStart] = useState(false)
  const [lastTime, setLastTime] = useState(0)
  const [firstStopReached, setFirstStopReached] = useState(false)
  const [headway, setHeadway] = useState(0)
  const [lastTripNo, setLastTripNo] = useState(0)
  const [numBusPast, setNumBusPast] = useState(0)

  useEffect(() => {
    if (start) {
      setTriggerStart(true)
    }
  }, [start]);

  useEffect(() => {
    // if (triggerStart){
    //   var headwayref = document.querySelector(
    //     `.headway-ref-${id}`
    //   );
    //   var count = 0
    //   setInterval(() => {
    //     console.log(count++)
    //     headwayref.innerHTML = count
    //   }, 10)
      
    // }
    // var headwayref = document.querySelector(
    //   `.headway-ref-${id}`
    // );
    if (triggerStart){
      if (lastTime != 0 && firstStopReached){
        // headwayref.innerHTML = globalTime-lastTime
        setHeadway(globalTime-lastTime)
        updateHeadway(globalTime-lastTime,id,lastTripNo, numBusPast)
      }
      // else {
      //   if (firstStopReached){
      //   headwayref.innerHTML = globalTime-73408
      //   setHeadway(globalTime-73408)
      //   updateHeadway(globalTime-73408,id)
      //   }
      //   else {
      //     headwayref.innerHTML = 0
      //     setHeadway(0)
      //     updateHeadway(0,id)
      //   }
      // }
    }
    else {
      // headwayref.innerHTML = 0
      setHeadway(0)
      updateHeadway(0,id,lastTripNo)
    }

  }, [globalTime,triggerStart,lastTime, firstStopReached,lastTripNo])

  useEffect(() => {

    if (dataObj[globalTime] != undefined) {
      // console.log(dataObj[globalTime][0].currentStatus);
      for (var i = 0; i < dataObj[globalTime].length; i++) {
        // console.log(dataObj[globalTime][i]);
        if (dataObj[globalTime][i].currentStatus == "STOPPED_AT" && dataObj[globalTime][i].stopId == id) {
          setLastTime(globalTime)
          setLastTripNo(dataObj[globalTime][i].busTripNo)
          setFirstStopReached(true)
          var newNum = numBusPast 
          newNum += 1
          setNumBusPast(newNum)
          }
        }
      }
  }, [globalTime,dataObj])

  return (
    <div></div>
  )
}

export default BusStop