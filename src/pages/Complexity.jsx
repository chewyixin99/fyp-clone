import { useState } from "react";

const hideVis = {
  heat_0: false,
  plot_0: false,
  heat_1: false,
  plot_1: false,
};

const Complexity = () => {
  const [showChart, setShowChart] = useState({
    heat_0: true,
    plot_0: false,
    heat_1: false,
    plot_1: false,
  });

  const setToggle = (e) => {
    e.preventDefault();
    const id = e.target.id;
    setShowChart({
      ...hideVis,
      [id]: true,
    });
  };

  const renderToggle = () => {
    return (
      <div className="flex text-xs justify-end my-5">
        <button onClick={setToggle} id="heat_0" className="mx-3 control-button">
          Open sourced (heat)
        </button>
        <button onClick={setToggle} id="plot_0" className="mx-3 control-button">
          Open sourced (plot)
        </button>
        <button onClick={setToggle} id="heat_1" className="mx-3 control-button">
          Commercial (heat)
        </button>
        <button onClick={setToggle} id="plot_1" className="mx-3 control-button">
          Commercial (plot)
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto">
      <h4 className="mx-[10vw] my-3 py-3">Complexity analysis</h4>
      {renderToggle()}
      <div className="border-y-2">
        <iframe
          className={`mx-auto w-[80vw] h-[80vh] my-5 ${
            showChart.heat_0 ? "block" : "hidden"
          }`}
          src="//plotly.com/~biondi/6.embed"
        ></iframe>
        <iframe
          className={`mx-auto w-[80vw] h-[80vh] my-5 ${
            showChart.plot_0 ? "block" : "hidden"
          }`}
          src="//plotly.com/~biondi/8.embed"
        ></iframe>
        <iframe
          className={`mx-auto w-[80vw] h-[80vh] my-5 ${
            showChart.heat_1 ? "block" : "hidden"
          }`}
          src="//plotly.com/~biondi/10.embed"
        ></iframe>
        <iframe
          className={`mx-auto w-[80vw] h-[80vh] my-5 ${
            showChart.plot_1 ? "block" : "hidden"
          }`}
          src="//plotly.com/~biondi/12.embed"
        ></iframe>
      </div>
    </div>
  );
};

export default Complexity;
