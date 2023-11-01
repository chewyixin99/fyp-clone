import { useEffect } from "react";
import chart_1_content from "../assets/complexity/v1_0CVXPY.html?raw";

const Complexity = () => {
  useEffect(() => {
    // const htmlComponent = document.getElementById("chart_1");
    // htmlComponent.innerHTML = `${chart_1_content}`;
    // console.log(htmlComponent);
  }, []);

  return (
    <div className="mx-auto">
      <h4 className="mx-[10vw] my-3 py-3">Complexity analysis</h4>
      {/* <div>
        <div
          id="chart_1"
          dangerouslySetInnerHTML={{ __html: chart_1_content }}
          className="h-[50vh]"
        ></div>
      </div> */}
      <div className="border-y-2">
        <iframe
          className="mx-auto w-[80vw] h-[80vh] pb-5"
          src="//plotly.com/~biondi/1.embed"
        ></iframe>
      </div>
    </div>
  );
};

export default Complexity;
