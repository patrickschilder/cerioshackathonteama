import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getQuiz, submitQuiz } from "../api/client.js";
import type { QuizDto, QuizResultDto } from "@cerios/shared-types";

export function QuizTakerPage() {
  const { id } = useParams<{ id: string }>();

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getQuiz(id)
      .then(setQuiz)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!quiz || !id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitQuiz(id, { answers });
      setResult(res);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error && !quiz) return <div className="alert alert-error">{error}</div>;
  if (!quiz) return <div className="alert alert-info">Geen quiz beschikbaar voor deze cursus.</div>;

  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  // ─── Results view ──────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: 64, marginBottom: "var(--space-4)" }}>
            {result.percentage >= 60 ? "🎉" : "📚"}
          </div>
          <h1 style={{ margin: 0, fontSize: "var(--font-size-3xl)" }}>
            {result.percentage >= 60 ? "Geslaagd!" : "Niet geslaagd"}
          </h1>
          <p style={{ fontSize: "var(--font-size-xl)", color: "var(--color-text-muted)", margin: "var(--space-2) 0 var(--space-6)" }}>
            {result.score} / {result.totalPoints} correct ({result.percentage}%)
          </p>
          <div style={{
            background: result.percentage >= 60 ? "#d1fae5" : "#fee2e2",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
            display: "inline-block",
            marginBottom: "var(--space-6)",
          }}>
            <span style={{
              fontSize: "var(--font-size-2xl)",
              fontWeight: "var(--font-weight-bold)",
              color: result.percentage >= 60 ? "#065f46" : "#991b1b",
            }}>
              {result.percentage}%
            </span>
          </div>
        </div>

        <div style={{ marginTop: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {quiz.questions.map((q, i) => {
            const fb = result.feedback.find((f) => f.questionId === q.id);
            return (
              <div key={q.id} className="card" style={{ borderLeft: `4px solid ${fb?.correct ? "var(--color-success)" : "var(--color-error)"}` }}>
                <p style={{ fontWeight: "var(--font-weight-semibold)", margin: "0 0 var(--space-2)" }}>
                  {i + 1}. {q.questionText}
                </p>
                <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: fb?.correct ? "var(--color-success)" : "var(--color-error)" }}>
                  {fb?.correct ? "✓ Correct" : `✗ Fout — Juiste antwoord: ${fb?.correctAnswer}`}
                </p>
                {fb?.explanation && (
                  <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {fb.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)", justifyContent: "center" }}>
          <Link to="/" className="btn btn-secondary">← Terug naar overzicht</Link>
          <Link to={`/courses/${id}`} className="btn btn-ghost">Slides opnieuw bekijken</Link>
        </div>
      </div>
    );
  }

  // ─── Quiz view ─────────────────────────────────────────────────────────────

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <Link to={`/courses/${id}`} style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", display: "inline-block", marginBottom: "var(--space-4)" }}>
        ← Terug naar cursus
      </Link>

      <h1 className="page-title">Quiz</h1>
      <p style={{ color: "var(--color-text-muted)", marginTop: "calc(-1 * var(--space-6))", marginBottom: "var(--space-6)" }}>
        {quiz.questions.length} vragen • Beantwoord alle vragen om in te dienen
      </p>

      {error && <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="card">
            <p style={{ fontWeight: "var(--font-weight-semibold)", marginBottom: "var(--space-4)" }}>
              {i + 1}. {q.questionText}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                  <label
                    key={opt}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: `1.5px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: selected ? "rgba(33,43,70,0.06)" : "var(--color-surface)",
                      cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      style={{ accentColor: "var(--color-primary)", width: 18, height: 18 }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-6)", textAlign: "center" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
        >
          {submitting ? "Indienen..." : `Quiz indienen (${Object.keys(answers).length}/${quiz.questions.length})`}
        </button>
      </div>
    </div>
  );
}
