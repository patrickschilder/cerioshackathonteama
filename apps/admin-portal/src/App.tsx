import "@cerios/ui-theme/theme.css";
import "@cerios/ui-theme/components.css";

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { NavBar } from "./components/NavBar.js";
import { AuthProvider, useAuth } from "./hooks/useAuth.js";
import { CourseCreatePage } from "./pages/CourseCreatePage.js";
import { CourseDetailPage } from "./pages/CourseDetailPage.js";
import { CourseListPage } from "./pages/CourseListPage.js";

function AppRoutes(): React.ReactElement {
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
					<Route path="/" element={<CourseListPage />} />
					<Route path="/courses/new" element={<CourseCreatePage />} />
					<Route path="/courses/:id" element={<CourseDetailPage />} />
				</Routes>
			</main>
		</div>
	);
}

export function App(): React.ReactElement {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</BrowserRouter>
	);
}
