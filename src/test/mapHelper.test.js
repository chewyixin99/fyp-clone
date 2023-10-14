import { expect, test } from "vitest";
import {
  getAllUniqueValues,
  getRecordsWithUniqueKey,
  normalizeStartTime,
} from "../util/mapHelper";

test(`getAllUniqueValues: takes in an (objsArr, keyName) and returns all unique values of that key`, () => {
  const mockArr = [
    { key1: 1, recId: 1 },
    { key1: 1, recId: 2 },
    { key1: 2, recId: 3 },
    { key1: 2, recId: 4 },
    { key1: 3, recId: 5 },
    { key1: 4, recId: 6 },
    { key1: 5, recId: 7 },
    { key1: 5, recId: 8 },
  ];
  const keyName = "key1";
  expect(getAllUniqueValues(mockArr, keyName)).toStrictEqual([1, 2, 3, 4, 5]);
});

test(`getRecordsWithUniqueKey: takes in (objsArr, keyName, step) and returns an object, grouping the original
     array by the value of the keyName supplied. the new key is the unique value, and
     the value is the original records whose keyName has that value.`, () => {
  const mockArr = [
    { key1: 1, recId: 1 },
    { key1: 1, recId: 2 },
    { key1: 2, recId: 3 },
    { key1: 2, recId: 4 },
    { key1: 3, recId: 5 },
    { key1: 4, recId: 6 },
    { key1: 5, recId: 7 },
    { key1: 5, recId: 8 },
  ];
  const keyName = "key1";
  expect(getRecordsWithUniqueKey(mockArr, keyName)).toStrictEqual({
    1: [
      { key1: 1, recId: 1 },
      { key1: 1, recId: 2 },
    ],
    2: [
      { key1: 2, recId: 3 },
      { key1: 2, recId: 4 },
    ],
    3: [{ key1: 3, recId: 5 }],
    4: [{ key1: 4, recId: 6 }],
    5: [
      { key1: 5, recId: 7 },
      { key1: 5, recId: 8 },
    ],
  });
});

test(`getRecordsWithUniqueKey: step = 2`, () => {
  const mockArr = [
    { key1: 1, recId: 1 },
    { key1: 1, recId: 2 },
    { key1: 2, recId: 3 },
    { key1: 2, recId: 4 },
    { key1: 3, recId: 5 },
    { key1: 4, recId: 6 },
    { key1: 5, recId: 7 },
    { key1: 5, recId: 8 },
  ];
  const keyName = "key1";
  expect(getRecordsWithUniqueKey(mockArr, keyName, 2)).toStrictEqual({
    1: [
      { key1: 1, recId: 1 },
      { key1: 1, recId: 2 },
    ],
    3: [{ key1: 3, recId: 5 }],
    5: [
      { key1: 5, recId: 7 },
      { key1: 5, recId: 8 },
    ],
  });
});

test(`normalizedUnoptimizedData: takes in 2 datasetArr with different start times, and extrapolate the one that 
     starts later with it's first record with it's timestamp changed accordingly.`, () => {
  const optimizedData = [
    { key1: 1, timestamp: 1 },
    { key1: 1, timestamp: 2 },
    { key1: 2, timestamp: 3 },
    { key1: 2, timestamp: 4 },
    { key1: 3, timestamp: 5 },
    { key1: 4, timestamp: 6 },
    { key1: 5, timestamp: 7 },
    { key1: 5, timestamp: 8 },
  ];
  const unoptimizedData = [
    { key1: 3, timestamp: 5 },
    { key1: 4, timestamp: 6 },
    { key1: 5, timestamp: 7 },
    { key1: 5, timestamp: 8 },
  ];
  const { normalizedUnoptimizedData } = normalizeStartTime({
    optimizedData: optimizedData,
    unoptimizedData: unoptimizedData,
  });
  expect(normalizedUnoptimizedData).toStrictEqual([
    { key1: 3, timestamp: 1 },
    { key1: 3, timestamp: 2 },
    { key1: 3, timestamp: 3 },
    { key1: 3, timestamp: 4 },
    { key1: 3, timestamp: 5 },
    { key1: 4, timestamp: 6 },
    { key1: 5, timestamp: 7 },
    { key1: 5, timestamp: 8 },
  ]);
});
