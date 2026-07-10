import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.js";
import { NavBar } from "./components/NavBar.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { CourseViewerPage } from "./pages/CourseViewerPage.js";
import { QuizTakerPage } from "./pages/QuizTakerPage.js";
import "@cerios/ui-theme/theme.css";
import "@cerios/ui-theme/components.css";

function AppRoutes() {
  const { ready, authenticated } = useAuth();

  if (!ready) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <NavBar />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/courses/:id" element={<CourseViewerPage />} />
          <Route path="/courses/:id/quiz" element={<QuizTakerPage />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
