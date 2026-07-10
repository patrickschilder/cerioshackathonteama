import type { CourseDto } from "@cerios/shared-types";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCourses } from "../api/client.js";

export function CourseListPage(): React.ReactElement {
	const [courses, setCourses] = useState<CourseDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load(): Promise<void> {
			try {
				const cs = await getCourses();
				setCourses(cs);
			} catch (e: unknown) {
				setError(String(e));
			} finally {
				setLoading(false);
			}
		}

		void load();
	}, []);

	if (loading)
		return (
			<div className="loading-center">
				<div className="spinner" />
			</div>
		);
	if (error) return <div className="alert alert-error">{error}</div>;

	return (
		<div className="container">
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "var(--space-4)",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "var(--space-8)",
				}}
			>
				<h1 className="page-title" style={{ margin: 0 }}>
					Cursussen beheren
				</h1>
				<Link to="/courses/new" className="btn btn-primary">
					+ Nieuwe cursus
				</Link>
			</div>

			{courses.length === 0 ? (
				<div className="card" style={{ textAlign: "center", padding: "var(--space-12)" }}>
					<p style={{ color: "var(--color-text-muted)" }}>Nog geen cursussen aangemaakt.</p>
					<Link to="/courses/new" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
						Eerste cursus aanmaken
					</Link>
				</div>
			) : (
				<div
					style={{
						display: "grid",
						gap: "var(--space-4)",
						gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
					}}
				>
					{courses.map(course => (
						<Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
							<div
								className="card"
								style={{ height: "100%", transition: "transform 0.15s, box-shadow 0.15s" }}
								onMouseEnter={e => {
									e.currentTarget.style.transform = "translateY(-2px)";
									e.currentTarget.style.boxShadow = "var(--shadow-lg)";
								}}
								onMouseLeave={e => {
									e.currentTarget.style.transform = "none";
									e.currentTarget.style.boxShadow = "var(--shadow-sm)";
								}}
							>
								<div className="card-header">
									<h2 className="card-title">{course.title}</h2>
								</div>
								<div className="card-body">
									{course.description && <p style={{ marginBottom: "var(--space-3)" }}>{course.description}</p>}
									<div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
										<span className="badge badge-accent">{course.slideCount} slides</span>
										<span className={`badge ${course.published ? "badge-success" : "badge-error"}`}>
											{course.published ? "Gepubliceerd" : "Concept"}
										</span>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
