import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import PartnerCompanies from "./components/PartnerCompanies";
import ProjectsList from "./components/ProjectsList";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* pages */}

        <Route path="/partners" element={<PartnerCompanies />} />
        <Route
          path="/partners/:partnerId/projects"
          element={<ProjectsList />}
        />

        {/* Protected dashboard */}
        <Route path="/dashboard/:projectId" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
