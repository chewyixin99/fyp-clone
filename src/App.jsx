import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Journey from "./pages/Journeys";
import MapsPage from "./pages/MapsPage";
import CombinedPage from "./pages/CombinedPage";

const App = () => {
  return (
    <Routes>
      <Route element={<Home />} path="/">
        <Route element={<Journey />} index />
        <Route element={<MapsPage />} path="maps" />
        <Route element={<CombinedPage />} path="settings" />
      </Route>
    </Routes>
  );
};

export default App;
