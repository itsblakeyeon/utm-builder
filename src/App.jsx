import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UTMBuilderPage from "./pages/UTMBuilderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/utm-builder" element={<UTMBuilderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
