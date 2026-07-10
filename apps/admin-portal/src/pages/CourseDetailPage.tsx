import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCourse,
  getSlides,
  updateCourse,
  deleteCourse,
  uploadPptx,
  generateQuiz,
  getQuiz,
  updateSlide,
} from "../api/client.js";
import type { CourseDto, SlideDto, QuizDto } from "@cerios/shared-types";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [slides, setSlides] = useState<SlideDto[]>([]);
  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRawText, setEditRawText] = useState("");
  const [savingSlide, setSavingSlide] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCourse(id), getSlides(id), getQuiz(id).catch(() => null)])
      .then(([c, s, q]) => {
        setCourse(c);
        setSlides(s);
        setQuiz(q);
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadStatus("Uploaden en verwerken...");
    setError(null);
    try {
      const result = await uploadPptx(id, file);
      setUploadStatus(`✓ ${result.slideCount} slides geïmporteerd`);
      const [c, s] = await Promise.all([getCourse(id), getSlides(id)]);
      setCourse(c);
      setSlides(s);
    } catch (err: unknown) {
      setError(String(err));
      setUploadStatus(null);
    }
  }

  async function handleGenerateQuiz() {
    if (!id) return;
    setQuizStatus("Quiz genereren...");
    setError(null);
    try {
      const q = await generateQuiz(id);
      setQuiz(q);
      setQuizStatus(`✓ Quiz gegenereerd met ${q.questions.length} vragen`);
    } catch (err: unknown) {
      setError(String(err));
      setQuizStatus(null);
    }
  }

  async function handleTogglePublish() {
    if (!course || !id) return;
    setPublishing(true);
    try {
      const updated = await updateCourse(id, { published: !course.published });
      setCourse(updated);
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm("Weet je zeker dat je deze cursus wil verwijderen?")) return;
    await deleteCourse(id);
    navigate("/");
  }

  function startEditSlide(slide: SlideDto) {
    setEditingSlideId(slide.id);
    setEditTitle(slide.title ?? "");
    setEditRawText(slide.rawText);
  }

  function cancelEditSlide() {
    setEditingSlideId(null);
    setEditTitle("");
    setEditRawText("");
  }

  async function handleSaveSlide(slideId: string) {
    if (!id) return;
    setSavingSlide(true);
    setError(null);
    try {
      const updated = await updateSlide(id, slideId, {
        title: editTitle,
        rawText: editRawText,
      });
      setSlides((prev) => prev.map((s) => (s.id === slideId ? updated : s)));
      cancelEditSlide();
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setSavingSlide(false);
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!course) return <div className="alert alert-error">{error ?? "Cursus niet gevonden"}</div>;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>{course.title}</h1>
          {course.description && (
            <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-2)" }}>{course.description}</p>
          )}
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <span className="badge badge-accent">{course.slideCount} slides</span>
            <span className={`badge ${course.published ? "badge-success" : "badge-error"}`}>
              {course.published ? "Gepubliceerd" : "Concept"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`btn ${course.published ? "btn-ghost" : "btn-primary"}`}
          >
            {course.published ? "Depubliceren" : "Publiceren"}
          </button>
          <button onClick={handleDelete} className="btn btn-ghost" style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}>
            Verwijderen
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>{error}</div>}

      <div className="grid-2col-responsive" style={{ gap: "var(--space-6)" }}>
        {/* Upload section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">PowerPoint uploaden</h2>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: "var(--space-4)" }}>
              Upload een .pptx bestand. De slides worden automatisch verwerkt en opgeslagen.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: "100%", padding: "var(--space-8)", border: "2px dashed var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-text)", borderRadius: "var(--radius-lg)" }}
            >
              📁 Klik om .pptx te uploaden
            </button>
            {uploadStatus && (
              <p style={{ marginTop: "var(--space-3)", color: "var(--color-success)", fontWeight: "var(--font-weight-medium)" }}>
                {uploadStatus}
              </p>
            )}
          </div>
        </div>

        {/* Quiz section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quiz</h2>
          </div>
          <div className="card-body">
            {quiz ? (
              <>
                <p style={{ marginBottom: "var(--space-4)" }}>
                  <span className="badge badge-accent">{quiz.questions.length} vragen</span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", maxHeight: 200, overflowY: "auto" }}>
                  {quiz.questions.map((q, i) => (
                    <div key={q.id} style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-2)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-sm)" }}>
                      <strong>{i + 1}.</strong> {q.questionText}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                Nog geen quiz gegenereerd.
              </p>
            )}
            <button
              className="btn btn-primary"
              onClick={handleGenerateQuiz}
              disabled={slides.length === 0}
              style={{ marginTop: "var(--space-4)", width: "100%" }}
            >
              {quiz ? "Quiz opnieuw genereren" : "Quiz genereren"}
            </button>
            {quizStatus && (
              <p style={{ marginTop: "var(--space-3)", color: "var(--color-success)", fontWeight: "var(--font-weight-medium)" }}>
                {quizStatus}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Slides list */}
      <div className="card" style={{ marginTop: "var(--space-6)" }}>
        <div className="card-header">
          <h2 className="card-title">Slides ({slides.length})</h2>
        </div>
        {slides.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", padding: "var(--space-4)" }}>
            Nog geen slides. Upload een .pptx bestand om te beginnen.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", padding: "var(--space-4) 0 0" }}>
            {slides.map((slide) => (
              <div
                key={slide.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--space-4)",
                  padding: "var(--space-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-alt)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "var(--color-primary)",
                    color: "var(--color-surface)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "var(--font-weight-bold)",
                    fontSize: "var(--font-size-sm)",
                    flexShrink: 0,
                  }}
                >
                  {slide.index + 1}
                </div>
                {editingSlideId === slide.id ? (
                  <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    <input
                      className="form-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Titel"
                    />
                    <textarea
                      className="form-textarea"
                      value={editRawText}
                      onChange={(e) => setEditRawText(e.target.value)}
                      rows={4}
                    />
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveSlide(slide.id)}
                        disabled={savingSlide}
                      >
                        {savingSlide ? "Opslaan..." : "Opslaan"}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={cancelEditSlide} disabled={savingSlide}>
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <p style={{ fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                        {slide.title ?? `Slide ${slide.index + 1}`}
                      </p>
                      <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", margin: "var(--space-1) 0 0", lineHeight: 1.4 }}>
                        {slide.rawText.slice(0, 120)}
                        {slide.rawText.length > 120 ? "..." : ""}
                      </p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEditSlide(slide)}>
                      Bewerken
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
