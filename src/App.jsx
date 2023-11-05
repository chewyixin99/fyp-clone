import { Route, Routes } from "react-router-dom";
import Navbar from "./pages/Navbar";
import CombinedPage from "./pages/CombinedPage";
import LandingPage from "./pages/LandingPage";
import Complexity from "./pages/Complexity";

const App = () => {
  return (
    <Routes>
      <Route element={<Navbar />} path="/">
        <Route element={<CombinedPage />} index/>
        <Route element={<LandingPage />} path="about" />
        <Route element={<Complexity />} path="complexity" />
      </Route>
    </Routes>
  );
};

export default App;
