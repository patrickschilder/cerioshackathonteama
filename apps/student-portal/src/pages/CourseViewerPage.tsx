import type { CourseDto, SlideDto, CourseProgressDto } from "@cerios/shared-types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { getCourse, getSlides, getProgress, markSlideViewed } from "../api/client.js";

export function CourseViewerPage(): React.ReactElement {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [course, setCourse] = useState<CourseDto | null>(null);
	const [slides, setSlides] = useState<SlideDto[]>([]);
	const [progress, setProgress] = useState<CourseProgressDto | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	// Synchronous guard against double-counting a slide view. A ref (rather than the
	// `progress` state) is required because React 18 StrictMode double-invokes effects in
	// dev, and both invocations would otherwise read the same stale `progress` closure
	// before either state update lands, letting both increment `viewedSlides`.
	const markedSlideIdsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!id) return;

		async function load(courseId: string): Promise<void> {
			try {
				const [c, s, p] = await Promise.all([getCourse(courseId), getSlides(courseId), getProgress(courseId)]);
				setCourse(c);
				setSlides(s);
				setProgress(p);
				markedSlideIdsRef.current = new Set(p.viewedSlideIds);
			} catch (e: unknown) {
				setError(String(e));
			} finally {
				setLoading(false);
			}
		}

		void load(id);
	}, [id]);

	const markViewed = useCallback(
		async (slide: SlideDto) => {
			if (!id) return;
			if (markedSlideIdsRef.current.has(slide.id)) return;
			markedSlideIdsRef.current.add(slide.id);
			const ok = await markSlideViewed(id, slide.id)
				.then(() => true)
				.catch(() => false);
			if (!ok) {
				markedSlideIdsRef.current.delete(slide.id);
				return;
			}
			setProgress(prev =>
				prev && !prev.viewedSlideIds.includes(slide.id)
					? {
							...prev,
							viewedSlides: prev.viewedSlides + 1,
							percentage: Math.round(((prev.viewedSlides + 1) / prev.totalSlides) * 100),
							viewedSlideIds: [...prev.viewedSlideIds, slide.id],
						}
					: prev
			);
		},
		[id]
	);

	useEffect(() => {
		const slide = slides[currentIndex];
		if (slide) void markViewed(slide);
	}, [currentIndex, slides, markViewed]);

	if (loading)
		return (
			<div className="loading-center">
				<div className="spinner" />
			</div>
		);
	if (error || !course) return <div className="alert alert-error">{error ?? "Cursus niet gevonden"}</div>;

	const currentSlide = slides[currentIndex];
	const isFirst = currentIndex === 0;
	const isLast = currentIndex === slides.length - 1;

	return (
		<div className="container">
			{/* Breadcrumb + progress */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "var(--space-4)",
				}}
			>
				<Link to="/" style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
					← Terug naar overzicht
				</Link>
				<div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
					<span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
						{progress?.percentage ?? 0}% voltooid
					</span>
					<div className="progress-bar" style={{ width: 120 }}>
						<div className="progress-bar__fill" style={{ width: `${progress?.percentage ?? 0}%` }} />
					</div>
				</div>
			</div>

			<h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-6)" }}>{course.title}</h1>

			{/* Slide viewer */}
			<div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "var(--space-6)" }}>
				{/* Sidebar: slide list */}
				<div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
					{slides.map((slide, i) => {
						const viewed = progress?.viewedSlideIds.includes(slide.id);
						return (
							<button
								key={slide.id}
								onClick={() => setCurrentIndex(i)}
								style={{
									textAlign: "left",
									padding: "var(--space-2) var(--space-3)",
									borderRadius: "var(--radius-md)",
									border: "1.5px solid",
									borderColor: i === currentIndex ? "var(--color-primary)" : "var(--color-border)",
									background: i === currentIndex ? "var(--color-primary)" : "var(--color-surface)",
									color: i === currentIndex ? "var(--color-surface)" : "var(--color-text)",
									cursor: "pointer",
									fontSize: "var(--font-size-xs)",
									display: "flex",
									alignItems: "center",
									gap: "var(--space-2)",
								}}
							>
								<span style={{ opacity: 0.7 }}>{i + 1}.</span>
								<span style={{ flex: 1 }}>{slide.title ?? `Slide ${i + 1}`}</span>
								{viewed && <span style={{ color: "var(--color-accent)", fontWeight: "bold" }}>✓</span>}
							</button>
						);
					})}
				</div>

				{/* Main slide content */}
				<div>
					{currentSlide ? (
						<div className="card" style={{ minHeight: 400 }}>
							<div
								className="card-header"
								style={{
									background: "var(--color-primary)",
									margin: "calc(-1 * var(--space-6))",
									marginBottom: "var(--space-6)",
									padding: "var(--space-6)",
									borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
								}}
							>
								<h2 style={{ color: "var(--color-surface)", margin: 0, fontSize: "var(--font-size-xl)" }}>
									{currentSlide.title ?? `Slide ${currentIndex + 1}`}
								</h2>
								<span style={{ color: "rgba(255,255,255,0.6)", fontSize: "var(--font-size-sm)" }}>
									{currentIndex + 1} / {slides.length}
								</span>
							</div>
							<div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--color-text)" }}>
								{currentSlide.rawText}
							</div>
							{currentSlide.notes && (
								<div
									style={{
										marginTop: "var(--space-6)",
										padding: "var(--space-4)",
										background: "var(--color-surface-alt)",
										borderRadius: "var(--radius-md)",
										borderLeft: "4px solid var(--color-accent)",
									}}
								>
									<strong style={{ fontSize: "var(--font-size-sm)" }}>Notities:</strong>
									<p
										style={{
											margin: "var(--space-2) 0 0",
											fontSize: "var(--font-size-sm)",
											color: "var(--color-text-muted)",
										}}
									>
										{currentSlide.notes}
									</p>
								</div>
							)}
						</div>
					) : (
						<div className="card" style={{ textAlign: "center", padding: "var(--space-12)" }}>
							<p>Geen slides beschikbaar.</p>
						</div>
					)}

					{/* Navigation */}
					<div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-4)" }}>
						<button
							className="btn btn-secondary"
							onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
							disabled={isFirst}
						>
							← Vorige
						</button>

						{isLast ? (
							<button
								className="btn btn-primary"
								onClick={() => {
									void navigate(`/courses/${id}/quiz`);
								}}
							>
								Quiz starten →
							</button>
						) : (
							<button
								className="btn btn-secondary"
								onClick={() => setCurrentIndex(i => Math.min(slides.length - 1, i + 1))}
							>
								Volgende →
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
