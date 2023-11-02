import React, { useState } from "react";
import { FiUpload } from "react-icons/fi";
import { PuffLoader } from "react-spinners";

const UploadFile = React.memo(() => {
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState({});
  const [loading, setLoading] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);
    console.log(file);
    const url = "http://127.0.0.1:8000/mm_upload/upload_data";
    const options = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: file,
    };
    await fetch(url, options)
      .then((response) => {
        setLoading(false);
        return response.json();
      })
      .then((responseJson) => {
        console.log(responseJson);
      })
      .catch((e) => {
        setLoading(false);
        console.log(e);
      });
  };

  const onButtonClick = () => {
    fetchData();
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
      {fileName !== "" ? (
        <div className="flex items-center">
          <button
            type="button"
            className={`mx-3 ${
              loading ? "control-button-disabled" : "control-button"
            }`}
            onClick={onButtonClick}
            disabled={loading}
          >
            train model
          </button>
          <PuffLoader color="rgb(234, 88, 12)" loading={loading} size={15} />
        </div>
      ) : (
        ""
      )}
    </div>
  );
});

UploadFile.displayName = "UploadFile";

export default UploadFile;
