import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Maps from "./pages/Maps";

const App = () => {
  return (
    <Routes>
      <Route element={<Home />} path="/" />
      <Route element={<Maps />} path="/maps" />
    </Routes>
  );
};

export default App;
