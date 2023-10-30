import { expect, test } from "vitest";
import {
  processObjectiveFn,
  processCumulativeObjectiveFn
} from "../util/metricsHelper";

test(`processObjectiveFn: takes in two objects with key (tripNo, busStopNo) and value (objective function), and returns a 3-dimensional object`, () => {
  const mockUnoptimisedOFObj = 
    { "1,2": 1, "1,3": 2, "1,4": 3, "2,1": 4, "2,2": 5, "2,3": 6 };
  const mockOptimisedOFObj = 
    { "1,2": 7, "1,3": 8, "1,4": 9, "2,1": 10, "2,2": 11, "2,3": 12 };
  expect(processObjectiveFn(mockUnoptimisedOFObj, mockOptimisedOFObj)).toStrictEqual({
    "1" : {"1" : [1,2,3], "2" : [4,5,6]},
    "2" : {"1" : [7,8,9], "2" : [10,11,12]}
  });
});

test(`processCumulativeObjectiveFn: returns a object with array values that is added together and accumulated with each bus stop `, () => {
  const mockUnoptimisedOFObj = 
    { "1,2": 1, "1,3": 2, "1,4": 3, "2,1": 4, "2,2": 5, "2,3": 6 };
  const mockOptimisedOFObj = 
    { "1,2": 7, "1,3": 8, "1,4": 9, "2,1": 10, "2,2": 11, "2,3": 12 };
  expect(processCumulativeObjectiveFn(mockUnoptimisedOFObj, mockOptimisedOFObj)).toStrictEqual({
    "1" : [4,10,18,21],
    "2" : [10,28,48,57]
  });
});


