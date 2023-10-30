import { expect, test } from "vitest";
import { convert_seconds_to_time, formatDistance, createDataObj, getOF } from "../util/journeyHelper";

test(`convert_seconds_to_time`, () => {
  expect(convert_seconds_to_time(391)).toStrictEqual("6m 31s");
  expect(convert_seconds_to_time(0)).toStrictEqual("0m 0s");
  expect(convert_seconds_to_time('string')).toStrictEqual("-");
});

test(`formatDistance`, () => {

  expect(formatDistance(2504,21023)).toStrictEqual(11.91);
  expect(formatDistance(21023,21023)).toStrictEqual(100);
  expect(formatDistance(0,21023)).toStrictEqual(0);
});


test(`createDataObj`, () => {
  const mockData = [
    { tripNo: 2, busStopNo: 6, stopId: 1451, timestamp: 73351 },
    { tripNo: 3, busStopNo: 6, stopId: 1451, timestamp: 74564 },
    { tripNo: 4, busStopNo: 2, stopId: 1349, timestamp: 74564 },
    { tripNo: 7, busStopNo: 8, stopId: 1487, timestamp: 77683 },
  ];

  expect(createDataObj(mockData)).toStrictEqual({
    73351: [
      {
        tripNo: 2,
        busStopNo: 6,
        stopId: 1451,
        timestamp: 73351,
      },
    ],
    74564: [
      {
        tripNo: 3,
        busStopNo: 6,
        stopId: 1451,
        timestamp: 74564,
      },
      {
        tripNo: 4,
        busStopNo: 2,
        stopId: 1349,
        timestamp: 74564,
      },
    ],
    77683: [
      {
        tripNo: 7,
        busStopNo: 8,
        stopId: 1487,
        timestamp: 77683,
      },
    ],
  });
});

test(`getOF`, () => {
  const currentStop = { busTripNo: 1, busStopNo: 5 };
  const matrix_1 = {
    "1,2": 263,
    "1,3": 195,
    "1,4": 228,
    "1,5": 261,
    "1,6": 236,
  }
  const matrix_2 = {
    "1,2": 214,
    "1,3": 146,
    "1,4": 179,
    "1,5": 212,
    "1,6": 187,
  }

  const id = '1'

  expect(getOF(currentStop, matrix_1, matrix_2, id )).toStrictEqual(261);
});
