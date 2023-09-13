import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Journey from "./pages/Journeys";
import Settings from "./pages/Settings";
import MapsPage from "./pages/MapsPage";

const App = () => {
  return (
    <Routes>
      <Route element={<Home />} path="/">
        <Route element={<Journey />} index />
        <Route element={<MapsPage />} path="maps" />
        <Route element={<Settings />} path="settings" />
      </Route>
    </Routes>
  );
};

export default App;
