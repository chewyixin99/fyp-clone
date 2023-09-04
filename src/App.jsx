import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Maps from "./pages/Maps";
import Journey from "./pages/Journey";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <Routes>
      <Route element={<Home />} path="/">
        <Route element={<Journey />} index  />
        <Route element={<Maps />} path="maps" />
        <Route element={<Settings/>} path="settings" />
      </Route>
    </Routes>
  );
};

export default App;
