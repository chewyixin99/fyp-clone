/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react'

const BusStop = ({id,busStopNo,start, globalTime, dataObj, updateHeadway, setCurrentStop, modelId}) => {

  const [triggerStart, setTriggerStart] = useState(false)
  const [lastTime, setLastTime] = useState(0)
  const [firstStopReached, setFirstStopReached] = useState(false)
  const [lastTripNo, setLastTripNo] = useState(0)
  const [numBusPast, setNumBusPast] = useState(0)

  useEffect(() => {
    if (start) {
      setTriggerStart(true)
    }
  }, [start]);

  useEffect(() => {
    if (triggerStart){
      if (lastTime != 0 && firstStopReached){
        updateHeadway(globalTime-lastTime,id,busStopNo, lastTripNo)
      }
    }
    else {
      updateHeadway(0,id,busStopNo,lastTripNo)
    }

  }, [triggerStart,lastTime, firstStopReached,lastTripNo])

  useEffect(() => {
    if (dataObj[globalTime] != undefined) {
      for (var i = 0; i < dataObj[globalTime].length; i++) {
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

  useEffect(() => {
    if (dataObj[globalTime] != undefined) {
      for (var i = 0; i < dataObj[globalTime].length; i++) {
        if (dataObj[globalTime][i].currentStatus == "STOPPED_AT") {
          setCurrentStop({["modelId"]: modelId,["busTripNo"]: dataObj[globalTime][i].busTripNo, ["busStopNo"]: dataObj[globalTime][i].busStopNo})
        }
      }
    }
  }, [globalTime,dataObj])

  return (
    <div></div>
  )
}

export default BusStop