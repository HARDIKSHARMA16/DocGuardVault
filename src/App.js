import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import EMRPage from "./EMRPage";
import AuditTrail from "./AuditTrail";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/emr" element={<EMRPage />} />
        <Route path="/audit" element={<AuditTrail />} />
      </Routes>
    </Router>
  );
}

export default App;