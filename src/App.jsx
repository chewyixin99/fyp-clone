import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Journey from "./pages/Journeys";
import CombinedPage from "./pages/CombinedPage";

const App = () => {
  return (
    <Routes>
      <Route element={<Home />} path="/">
        <Route element={<Journey />} index />
        <Route element={<CombinedPage />} path="combined" />
      </Route>
    </Routes>
  );
};

export default App;
