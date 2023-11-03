import React, { useState } from "react";
import { FiUpload } from "react-icons/fi";
import { PuffLoader } from "react-spinners";
import { TiTick } from "react-icons/ti";
import { processCsvData } from "../util/mapHelper";
import Papa from "papaparse";
import { RxReload } from "react-icons/rx";
import PropTypes from "prop-types";

const UploadFile = React.memo(
  ({
    setStopObjs,
    setJourneyData,
    setJourneyDataUnoptimized,
    setDispatchTimes,
    setDataInUse,
  }) => {
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState({});
    const [loadingTrain, setLoadingTrain] = useState(false);
    const [loadingFetchOptimized, setLoadingFetchOptimized] = useState(false);
    const [loadingFetchUnoptimized, setLoadingFetchUnoptimized] =
      useState(false);
    const [updateClicked, setUpdateClicked] = useState(false);
    const [errorFetch, setErrorFetch] = useState(false);
    const [errorFetchMsg, setErrorFetchMsg] = useState("");
    const [fileUploaded, setFileUploaded] = useState(false);

    const onUploadClick = (changeEvent) => {
      try {
        const fileReader = new FileReader();
        fileReader.readAsText(changeEvent.target.files[0], "UTF-8");
        const fileType = changeEvent.target.files[0].type;
        if (fileType === "application/json") {
          const name = changeEvent.target.files[0].name;
          setFileName(name);
          fileReader.onload = (loadEvent) => {
            const jsonObj = JSON.parse(loadEvent.target.result);
            setFile(jsonObj);
          };
        } else {
          alert("Please upload json files only");
        }
      } catch (e) {
        // pass - nothing to handle
        // console.log(e);
      }
    };

    const fetchTrainData = async () => {
      setFileUploaded(false);
      setLoadingTrain(true);
      setErrorFetch(false);
      setErrorFetchMsg("");
      const url = "http://127.0.0.1:8000/mm_upload/upload_data_json";
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(file),
      };
      await fetch(url, options)
        .then((response) => {
          setLoadingTrain(false);
          return response.json();
        })
        .then((responseJson) => {
          setFileUploaded(true);
        })
        .catch((e) => {
          // todo: handle display error msg
          setLoadingTrain(false);
          setErrorFetch(true);
          setErrorFetchMsg(e.message);
          setFileUploaded(false);
          console.log(e);
          alert(e.message);
        });
    };

    const fetchUpdatedModelDataFeed = async () => {
      setLoadingFetchOptimized(true);
      setLoadingFetchUnoptimized(true);
      setErrorFetch(false);
      setErrorFetchMsg("");
      const urlFeed = "http://127.0.0.1:8000/mm_upload/result_feed";
      const commonOptions = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      };

      // optimised feed
      const requestBodyOptimizedFeed = {
        unoptimised: false,
        polling_rate: 1,
        deviated_dispatch_dict: {},
        regenerate_results: false,
      };
      await fetch(urlFeed, {
        ...commonOptions,
        body: JSON.stringify(requestBodyOptimizedFeed),
      })
        .then((response) => {
          if (response.ok) {
            setLoadingFetchOptimized(false);
            return response.text();
          }
        })
        .then((csvData) => {
          const parsed = Papa.parse(csvData).data.slice(1);
          const processedDataOptimized = processCsvData(parsed);
          console.log(
            `fetched updated data: optimised: ${processedDataOptimized.journeyData.length} rows`
          );
          setStopObjs(processedDataOptimized.stopObjs);
          setJourneyData(processedDataOptimized.journeyData);
        })
        .catch((e) => {
          setErrorFetch(true);
          setLoadingFetchOptimized(false);
          setErrorFetchMsg(e.message);
          setErrorFetchMsg(`optimised error: ${e.message}`);
        });

      // unoptimised feed
      const requestBodyUnoptimizedFeed = {
        unoptimised: true,
        polling_rate: 1,
        deviated_dispatch_dict: {},
        regenerate_results: false,
      };
      await fetch(urlFeed, {
        ...commonOptions,
        body: JSON.stringify(requestBodyUnoptimizedFeed),
      })
        .then((response) => {
          if (response.ok) {
            setLoadingFetchUnoptimized(false);
            return response.text();
          }
        })
        .then((csvData) => {
          const parsed = Papa.parse(csvData).data.slice(1);
          const processedDataUnoptimized = processCsvData(parsed);
          console.log(
            `fetched updated data: unoptimised: ${processedDataUnoptimized.journeyData.length} rows`
          );
          setJourneyDataUnoptimized(processedDataUnoptimized.journeyData);
        })
        .catch((e) => {
          setErrorFetch(true);
          setLoadingFetchOptimized(false);
          setErrorFetchMsg(e.message);
          setErrorFetchMsg(`unoptimised error: ${e.message}`);
        });
    };

    const fetchUpdatedModelDataMatrice = async () => {
      const urlMatrice = "http://127.0.0.1:8000/mm_upload/result_matrices";
      const requestBody = {
        unoptimised: false,
        deviated_dispatch_dict: {},
        regenerate_results: false,
      };
      const options = {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      };
      await fetch(urlMatrice, {
        ...options,
        body: JSON.stringify(requestBody),
      })
        .then((response) => {
          return response.json();
        })
        .then((responseJson) => {
          const data = responseJson.data;
          const originalTimesArr = data.original_dispatch_list;
          const optimizedDispatchTimes = data.dispatch_list;
          const tmpDispatchTimes = {};
          const originalDispatchTimes = {};
          ``;
          for (let i = 0; i < originalTimesArr.length; i++) {
            originalDispatchTimes[i + 1] = parseInt(originalTimesArr[i]);
          }
          for (const key of Object.keys(optimizedDispatchTimes)) {
            tmpDispatchTimes[key] = {
              planned: originalDispatchTimes[key],
              optimized: optimizedDispatchTimes[key],
            };
          }
          setDispatchTimes(tmpDispatchTimes);
        })
        .catch((e) => {
          setErrorFetch(true);
          setErrorFetchMsg(`${e.message}`);
          console.log(e);
        });
    };

    const onTrainModelClick = () => {
      setUpdateClicked(false);
      fetchTrainData();
    };

    const onFetchUpdatedDataClick = () => {
      setUpdateClicked(true);
      fetchUpdatedModelDataFeed();
      fetchUpdatedModelDataMatrice();
      setDataInUse("UPDATED");
    };

    const renderFetchUpdatedDataStatus = () => {
      if (!updateClicked) {
        return (
          <div className="flex items-center">
            <div className="flex items-center">
              <button
                onClick={onFetchUpdatedDataClick}
                className={`${
                  loadingFetchOptimized || loadingFetchUnoptimized
                    ? "control-button-disabled"
                    : "control-button"
                }`}
              >
                <div className="flex items-center">
                  Fetch updated data
                  <RxReload className="ml-3" />
                </div>
              </button>
            </div>
          </div>
        );
      }
      if (!errorFetch) {
        return (
          <div className="flex items-center">
            <div className="mr-3 flex items-center">
              Updated data:
              {loadingFetchOptimized || errorFetch ? (
                <div className="text-orange-600 flex items-center">
                  <span className="mx-3">optimised</span>
                  <PuffLoader
                    color="rgb(234, 88, 12)"
                    loading={loadingFetchOptimized}
                    size={15}
                  />
                </div>
              ) : (
                <div className="text-green-500 flex items-center">
                  <span className="mx-3">optimised</span>
                  <TiTick />
                </div>
              )}
              {loadingFetchUnoptimized || errorFetch ? (
                <div className="text-orange-500 flex items-center">
                  <span className="mx-3">unoptimised</span>
                  <PuffLoader
                    color="rgb(234, 88, 12)"
                    loading={loadingFetchUnoptimized}
                    size={15}
                  />
                </div>
              ) : (
                <div className="text-green-600 flex items-center">
                  <span className="mx-3">unoptimised</span>
                  <TiTick />
                </div>
              )}
              <button
                onClick={onFetchUpdatedDataClick}
                className={`${
                  loadingFetchOptimized || loadingFetchUnoptimized
                    ? "control-button-disabled"
                    : "control-button"
                }`}
              >
                <RxReload />
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center text-red-600">
          <div>{errorFetchMsg}</div>
          <button onClick={onFetchUpdatedDataClick} className="control-button">
            <RxReload />
          </button>
        </div>
      );
    };

    const renderStatus = () => {
      if (fileName === "") {
        return <div></div>;
      }
      return (
        <div className="flex items-center">
          <button
            type="button"
            className={`mx-3 ${
              loadingTrain ? "control-button-disabled" : "control-button"
            }`}
            onClick={onTrainModelClick}
            disabled={loadingTrain}
          >
            {loadingTrain ? "training..." : "train model"}
          </button>
          <PuffLoader
            color="rgb(234, 88, 12)"
            loading={loadingTrain}
            size={15}
          />
          {fileUploaded ? (
            <div className="flex items-center">
              <div className="text-green-500 flex items-center mr-3">
                <TiTick />
              </div>
              {renderFetchUpdatedDataStatus()}
            </div>
          ) : (
            ""
          )}
        </div>
      );
    };

    return (
      <div className="flex items-center">
        <div>Upload file</div>
        <label>
          <div className="control-button">
            <FiUpload />
          </div>
          <input type="file" onChange={onUploadClick} accept=".json" />
        </label>
        <div className="text-xs text-gray-500">{fileName}</div>
        <div>{renderStatus()}</div>
      </div>
    );
  }
);

UploadFile.propTypes = {
  setStopObjs: PropTypes.func,
  setJourneyData: PropTypes.func,
  setJourneyDataUnoptimized: PropTypes.func,
  setDispatchTimes: PropTypes.func,
  setDataInUse: PropTypes.func,
};

UploadFile.displayName = "UploadFile";

export default UploadFile;
