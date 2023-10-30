/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react'

const BusStop = ({globalTime, dataObj,setCurrentStop, modelId}) => {

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