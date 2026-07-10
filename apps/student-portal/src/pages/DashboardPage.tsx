import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCourses, getProgress } from "../api/client.js";
import type { CourseDto, CourseProgressDto } from "@cerios/shared-types";
import { useAuth } from "../hooks/useAuth.js";

export function DashboardPage() {
  const { userName } = useAuth();
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [progress, setProgress] = useState<Record<string, CourseProgressDto>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCourses()
      .then(async (cs) => {
        setCourses(cs);
        const progressMap: Record<string, CourseProgressDto> = {};
        await Promise.all(
          cs.map((c) =>
            getProgress(c.id)
              .then((p) => { progressMap[c.id] = p; })
              .catch(() => {}),
          ),
        );
        setProgress(progressMap);
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="container">
      <h1 className="page-title">Welkom, {userName}!</h1>

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Nog geen cursussen beschikbaar.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {courses.map((course) => {
            const prog = progress[course.id];
            const pct = prog?.percentage ?? 0;

            return (
              <Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="card"
                  style={{ height: "100%", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
                >
                  <div className="card-header">
                    <h2 className="card-title">{course.title}</h2>
                  </div>
                  <div className="card-body">
                    {course.description && <p style={{ marginBottom: "var(--space-3)" }}>{course.description}</p>}
                    <span className="badge badge-accent" style={{ marginBottom: "var(--space-3)", display: "inline-flex" }}>
                      {course.slideCount} slides
                    </span>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                        <span>Voortgang</span>
                        <span style={{ fontWeight: "var(--font-weight-semibold)", color: pct === 100 ? "var(--color-success)" : "var(--color-text)" }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
