import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CombinedPage from "./pages/CombinedPage";
import LandingPage from "./pages/LandingPage";
import Complexity from "./pages/Complexity";

const App = () => {
  return (
    <Routes>
      <Route element={<Home />} path="/">
        <Route element={<LandingPage />} index />
        <Route element={<CombinedPage />} path="combined" />
        <Route element={<Complexity />} path="complexity" />
      </Route>
    </Routes>
  );
};

export default App;
