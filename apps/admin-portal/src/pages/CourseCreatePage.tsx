import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createCourse } from "../api/client.js";

export function CourseCreatePage(): React.ReactElement {
	const navigate = useNavigate();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const course = await createCourse({ title, description: description || undefined });
			void navigate(`/courses/${course.id}`);
		} catch (err: unknown) {
			setError(String(err));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="container" style={{ maxWidth: 640 }}>
			<h1 className="page-title">Nieuwe cursus aanmaken</h1>

			{error && (
				<div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>
					{error}
				</div>
			)}

			<div className="card">
				<form
					onSubmit={e => {
						void handleSubmit(e);
					}}
				>
					<div className="form-group">
						<label className="form-label" htmlFor="title">
							Titel *
						</label>
						<input
							id="title"
							className="form-input"
							type="text"
							value={title}
							onChange={e => setTitle(e.target.value)}
							required
							minLength={3}
							placeholder="bijv. Introduction to Software Testing"
						/>
					</div>

					<div className="form-group">
						<label className="form-label" htmlFor="description">
							Beschrijving
						</label>
						<textarea
							id="description"
							className="form-textarea"
							value={description}
							onChange={e => setDescription(e.target.value)}
							placeholder="Korte omschrijving van de cursus..."
						/>
					</div>

					<div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
						<button
							type="button"
							className="btn btn-ghost"
							onClick={() => {
								void navigate("/");
							}}
						>
							Annuleren
						</button>
						<button type="submit" className="btn btn-primary" disabled={submitting}>
							{submitting ? "Aanmaken..." : "Cursus aanmaken"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
