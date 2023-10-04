import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CombinedPage from "./pages/CombinedPage";
import LandingPage from "./pages/LandingPage";

const App = () => {
  return (
    <Routes>
      <Route element={<Home />} path="/">
        <Route element={<LandingPage />} index />
        <Route element={<CombinedPage />} path="combined" />
      </Route>
    </Routes>
  );
};

export default App;
