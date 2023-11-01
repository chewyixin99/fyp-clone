import { useEffect } from "react";
import chart_1_content from "../assets/complexity/v1_0CVXPY.html?raw";

const Complexity = () => {
  useEffect(() => {
    const htmlComponent = document.getElementById("chart_1");
    htmlComponent.innerHTML = `${chart_1_content}`;
    console.log(htmlComponent);
  }, []);

  return (
    <div className="w-[80vw] mx-auto my-6">
      <h4 className="py-3">Complexity analysis</h4>
      <div>
        <div
          id="chart_1"
          dangerouslySetInnerHTML={{ __html: chart_1_content }}
          className="h-[50vh]"
        ></div>
      </div>
    </div>
  );
};

export default Complexity;
