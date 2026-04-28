"use client";

import { useState, useEffect, useRef } from "react";
import { safeJsonParse, safeAt } from "@/lib/safety";
import MarkdownRenderer from "@/components/news/MarkdownRenderer";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  tags: string[];
  author: string;
  read_time: string;
  body: string;
  related_ids: string[];
  generation_source?: string;
  fact_check_status?: string;
  editor_approved_at?: string | null;
}

interface NewArticleForm {
  title: string;
  category: string;
  date: string;
  excerpt: string;
  tags: string;
  author: string;
  read_time: string;
  body: string;
}

interface AiDraftRequest {
  topic: string;
  audience: string;
  tone: string;
  length: "short" | "medium" | "long";
  references: string;
}

interface NewsletterIssue {
  id: string;
  week_start: string;
  week_end: string;
  status: "draft" | "approved" | "sent";
  subject: string;
  preheader: string;
  html: string;
  text: string;
  sent_count: number;
  created_at: string;
}

const emptyForm = (date: string): NewArticleForm => ({
  title: "",
  category: "Essay",
  date,
  excerpt: "",
  tags: "",
  author: "Editorial Team",
  read_time: "5 min",
  body: "",
});

const emptyAiDraftRequest = (): AiDraftRequest => ({
  topic: "",
  audience: "General readers",
  tone: "Crisp editorial",
  length: "medium",
  references: "",
});

export default function NewsPage() {
  const defaultArticleDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const [currentView, setCurrentView] = useState<"home" | "article" | "login" | "admin">("home");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  // Verified password stored in memory only (not in the bundle or localStorage)
  const verifiedPasswordRef = useRef<string>("");
  const [newArticle, setNewArticle] = useState<NewArticleForm>(emptyForm(defaultArticleDate));
  const articleBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [aiDraftRequest, setAiDraftRequest] = useState<AiDraftRequest>(emptyAiDraftRequest());
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [factChecks, setFactChecks] = useState<string[]>([]);
  const [newsletterIssues, setNewsletterIssues] = useState<NewsletterIssue[]>([]);
  const [generatingNewsletter, setGeneratingNewsletter] = useState(false);

  // Load articles on mount (promise chain so setState is in callbacks, not effect body)
  useEffect(() => {
    fetch("/api/news/articles")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load articles");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setArticles(data as Article[]);
        } else {
          throw new Error("Invalid articles format");
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load articles")
      )
      .finally(() => setLoading(false));
  }, []);

  // Initialize view based on hash on client-side only
  useEffect(() => {
    const savedDarkMode = safeJsonParse(localStorage.getItem("signal-darkMode"), true);
    const hasAdminSession = !!localStorage.getItem("signal-admin-logged-in");
    queueMicrotask(() => {
      if (typeof savedDarkMode === "boolean") {
        setIsDarkMode(savedDarkMode);
      }
      if (hasAdminSession) {
        setIsLoggedIn(true);
      }
    });

    if (window.location.hash === "#admin") {
      if (hasAdminSession) {
        setCurrentView("admin");
      } else {
        setCurrentView("login");
      }
    }
  }, []);

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        if (localStorage.getItem("signal-admin-logged-in")) {
          setCurrentView("admin");
        } else {
          setCurrentView("login");
        }
      } else {
        setCurrentView("home");
        setSelectedArticle(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light-mode", !isDarkMode);

    return () => {
      document.body.classList.remove("light-mode");
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/news/newsletters")
      .then((res) => (res.ok ? res.json() : []))
      .then((issues) => {
        if (Array.isArray(issues)) {
          setNewsletterIssues(issues as NewsletterIssue[]);
        }
      })
      .catch(() => {
        // no-op: admin can still publish articles even if issue history fails to load
      });
  }, [isLoggedIn]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/news/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      if (!res.ok) {
        alert("Invalid password");
        return;
      }
      verifiedPasswordRef.current = adminPassword;
      setIsLoggedIn(true);
      localStorage.setItem("signal-admin-logged-in", "true");
      setAdminPassword("");
      setCurrentView("admin");
      window.location.hash = "#admin";
    } catch {
      alert("Login failed. Please try again.");
    }
  };

  const handleAdminLogout = () => {
    verifiedPasswordRef.current = "";
    setIsLoggedIn(false);
    localStorage.removeItem("signal-admin-logged-in");
    setCurrentView("home");
    window.location.hash = "";
  };

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.excerpt || !newArticle.body) {
      alert("Please fill in all required fields");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/news/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newArticle,
          tags: newArticle.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          adminPassword: verifiedPasswordRef.current,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Failed to publish article");
      }
      // Refresh articles from the server
      const refreshRes = await fetch("/api/news/articles");
      if (refreshRes.ok) {
        const data: Article[] = await refreshRes.json();
        setArticles(data);
      }
      setNewArticle(emptyForm(defaultArticleDate));
      alert("Article published!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to publish article");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    try {
      const res = await fetch(`/api/news/articles/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: verifiedPasswordRef.current }),
      });
      if (!res.ok) throw new Error("Failed to delete article");
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete article");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = safeAt(e.target.files, 0);
    if (!file) return;
    if (!verifiedPasswordRef.current) {
      alert("Please log in again before uploading images.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("adminPassword", verifiedPasswordRef.current);

      const res = await fetch("/api/news/images", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Image upload failed");
      }
      const payload = (await res.json()) as { markdown: string };
      const textarea = articleBodyRef.current;
      if (!textarea) {
        setNewArticle((prev) => ({ ...prev, body: `${prev.body}\n\n${payload.markdown}`.trim() }));
      } else {
        const start = textarea.selectionStart ?? newArticle.body.length;
        const end = textarea.selectionEnd ?? start;
        const before = newArticle.body.slice(0, start);
        const after = newArticle.body.slice(end);
        const insert =
          before && !before.endsWith("\n") ? `\n\n${payload.markdown}\n\n` : `${payload.markdown}\n\n`;
        setNewArticle({ ...newArticle, body: `${before}${insert}${after}`.trimEnd() });
      }
      e.target.value = "";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerateAiDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedPasswordRef.current) {
      alert("Please log in again before generating drafts.");
      return;
    }
    if (!aiDraftRequest.topic.trim()) {
      alert("Please provide a topic.");
      return;
    }

    setGeneratingDraft(true);
    try {
      const res = await fetch("/api/news/articles/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword: verifiedPasswordRef.current,
          topic: aiDraftRequest.topic,
          audience: aiDraftRequest.audience,
          tone: aiDraftRequest.tone,
          length: aiDraftRequest.length,
          references: aiDraftRequest.references
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Failed to generate AI draft");
      }
      const payload = (await res.json()) as {
        article: Partial<NewArticleForm> & { tags?: string[] };
        factChecks?: string[];
      };

      setFactChecks(Array.isArray(payload.factChecks) ? payload.factChecks : []);
      setNewArticle((prev) => ({
        ...prev,
        title: payload.article.title ?? prev.title,
        category: payload.article.category ?? prev.category,
        excerpt: payload.article.excerpt ?? prev.excerpt,
        body: payload.article.body ?? prev.body,
        read_time: payload.article.read_time ?? prev.read_time,
        tags: Array.isArray(payload.article.tags) ? payload.article.tags.join(", ") : prev.tags,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate AI draft");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleGenerateWeeklyNewsletter = async () => {
    if (!verifiedPasswordRef.current) {
      alert("Please log in again before generating newsletter drafts.");
      return;
    }
    setGeneratingNewsletter(true);
    try {
      const res = await fetch("/api/news/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: verifiedPasswordRef.current }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Failed to generate newsletter");
      }
      const issue = (await res.json()) as NewsletterIssue;
      setNewsletterIssues((prev) => [issue, ...prev]);
      alert("Weekly newsletter draft generated.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate newsletter");
    } finally {
      setGeneratingNewsletter(false);
    }
  };

  const updateIssueStatus = async (id: string, status: NewsletterIssue["status"]) => {
    if (!verifiedPasswordRef.current) return;
    const res = await fetch(`/api/news/newsletters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: verifiedPasswordRef.current, status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error || "Failed to update issue");
    }
    const updated = (await res.json()) as NewsletterIssue;
    setNewsletterIssues((prev) => prev.map((issue) => (issue.id === id ? updated : issue)));
  };

  const handleSendIssue = async (id: string) => {
    if (!verifiedPasswordRef.current) return;
    const res = await fetch(`/api/news/newsletters/${id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: verifiedPasswordRef.current }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error || "Failed to send issue");
    }
    const updated = (await res.json()) as NewsletterIssue;
    setNewsletterIssues((prev) => prev.map((issue) => (issue.id === id ? updated : issue)));
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("signal-darkMode", JSON.stringify(newMode));
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery) ||
      a.excerpt.toLowerCase().includes(searchQuery) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery))
  );

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      const res = await fetch("/api/news/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to subscribe");
      }
      setEmailSuccess(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmail("");
        setEmailSuccess(false);
      }, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  const shareArticle = (platform: string) => {
    if (!selectedArticle) return;
    const url = window.location.href;
    const title = selectedArticle.title;

    if (platform === "copy") {
      navigator.clipboard
        .writeText(url)
        .then(() => alert("Link copied!"))
        .catch(() => alert("Failed to copy link"));
    } else if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text="${title}" on Signal&url=${url}`,
        "_blank",
        "width=600,height=400"
      );
    } else if (platform === "linkedin") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        "_blank",
        "width=600,height=400"
      );
    }
  };

  const getRelatedArticles = () => {
    if (!selectedArticle) return [];
    return articles.filter((a) => selectedArticle.related_ids.includes(a.id));
  };

  // ── Login view ────────────────────────────────────────────────────────────
  if (currentView === "login") {
    return (
      <div className="app">
        <header className="header">
          <div
            className="logo"
            onClick={() => {
              window.location.hash = "";
            }}
          >
            Signal
          </div>
        </header>
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            paddingTop: 0,
          }}
        >
          <div className="modal" style={{ maxWidth: "400px" }}>
            <h2 style={{ marginBottom: "1rem" }}>Admin Access</h2>
            <form onSubmit={handleAdminLogin}>
              <input type="text" name="username" style={{ display: "none" }} autoComplete="username" />
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  autoFocus
                />
              </div>
              <button type="submit" className="btn" style={{ width: "100%" }}>
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin panel view ──────────────────────────────────────────────────────
  if (currentView === "admin") {
    return (
      <div className="app">
        <header className="header">
          <div
            className="logo"
            onClick={() => {
              window.location.hash = "";
            }}
          >
            Signal Admin
          </div>
          <button className="nav-btn" onClick={handleAdminLogout}>
            Logout
          </button>
        </header>

        <div className="container" style={{ paddingTop: "10rem" }}>
          <h1 style={{ marginBottom: "2rem" }}>AI Draft Assistant</h1>

          <div className="glass-card" style={{ marginBottom: "2rem" }}>
            <form onSubmit={handleGenerateAiDraft}>
              <div className="form-group">
                <label>Topic *</label>
                <input
                  type="text"
                  value={aiDraftRequest.topic}
                  onChange={(e) => setAiDraftRequest({ ...aiDraftRequest, topic: e.target.value })}
                  placeholder="What should the draft be about?"
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Audience</label>
                  <input
                    type="text"
                    value={aiDraftRequest.audience}
                    onChange={(e) => setAiDraftRequest({ ...aiDraftRequest, audience: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tone</label>
                  <input
                    type="text"
                    value={aiDraftRequest.tone}
                    onChange={(e) => setAiDraftRequest({ ...aiDraftRequest, tone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Length</label>
                  <select
                    value={aiDraftRequest.length}
                    onChange={(e) =>
                      setAiDraftRequest({
                        ...aiDraftRequest,
                        length: e.target.value as AiDraftRequest["length"],
                      })
                    }
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>References (one per line)</label>
                <textarea
                  value={aiDraftRequest.references}
                  onChange={(e) => setAiDraftRequest({ ...aiDraftRequest, references: e.target.value })}
                  rows={3}
                  placeholder="Optional source links or notes for the model."
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: "100%" }} disabled={generatingDraft}>
                {generatingDraft ? "Generating draft..." : "Generate Draft (Review Required)"}
              </button>
            </form>

            {!!factChecks.length && (
              <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                <strong>Fact checks before publish:</strong>
                <ul>
                  {factChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <h1 style={{ marginBottom: "2rem" }}>Publish New Article</h1>

          <div className="glass-card">
            <form onSubmit={handlePublishArticle}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  placeholder="Article title"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  >
                    <option>Essay</option>
                    <option>Philosophy</option>
                    <option>Culture</option>
                    <option>Guide</option>
                    <option>Analysis</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Read Time</label>
                  <input
                    type="text"
                    value={newArticle.read_time}
                    onChange={(e) => setNewArticle({ ...newArticle, read_time: e.target.value })}
                    placeholder="e.g., 5 min"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Excerpt *</label>
                <textarea
                  value={newArticle.excerpt}
                  onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                  placeholder="Short summary"
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newArticle.tags}
                  onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
                  placeholder="e.g., media, culture, growth"
                />
              </div>

              <div className="form-group">
                <label>Body *</label>
                <textarea
                  ref={articleBodyRef}
                  value={newArticle.body}
                  onChange={(e) => setNewArticle({ ...newArticle, body: e.target.value })}
                  placeholder="Article content in Markdown"
                  rows={12}
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <p style={{ opacity: 0.65, fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  {uploadingImage
                    ? "Uploading image..."
                    : "Uploads image and inserts Markdown at cursor location."}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", marginBottom: "1rem" }}
                onClick={() => setShowMarkdownPreview((prev) => !prev)}
              >
                {showMarkdownPreview ? "Hide Markdown Preview" : "Show Markdown Preview"}
              </button>

              {showMarkdownPreview && (
                <div className="article-body markdown-preview">
                  <MarkdownRenderer markdown={newArticle.body || "_Nothing to preview yet._"} />
                </div>
              )}

              <button
                type="submit"
                className="btn"
                style={{ width: "100%", marginBottom: "1rem" }}
                disabled={publishing}
              >
                {publishing ? "Publishing..." : "Publish Article"}
              </button>
            </form>
          </div>

          <h2 style={{ marginTop: "3rem", marginBottom: "1.5rem" }}>Weekly Newsletter</h2>
          <div className="glass-card" style={{ marginBottom: "2rem" }}>
            <button className="btn" style={{ width: "100%", marginBottom: "1rem" }} onClick={handleGenerateWeeklyNewsletter} disabled={generatingNewsletter}>
              {generatingNewsletter ? "Generating..." : "Generate Weekly Draft"}
            </button>
            <p style={{ opacity: 0.75, fontSize: "0.85rem" }}>
              Drafts are generated from articles published in the last 7 days. Approve before sending.
            </p>

            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
              {newsletterIssues.map((issue) => (
                <div key={issue.id} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                    <strong>{issue.subject}</strong>
                    <span style={{ textTransform: "uppercase", opacity: 0.8, fontSize: "0.75rem" }}>{issue.status}</span>
                  </div>
                  <p style={{ marginTop: "0.5rem", marginBottom: "0.5rem", opacity: 0.85 }}>{issue.preheader}</p>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.75rem" }}>
                    Week {issue.week_start} → {issue.week_end}
                    {issue.status === "sent" ? ` • Sent to ${issue.sent_count} subscribers` : ""}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {issue.status === "draft" && (
                      <button className="btn btn-secondary" onClick={() => updateIssueStatus(issue.id, "approved")}>
                        Approve
                      </button>
                    )}
                    {issue.status === "approved" && (
                      <button
                        className="btn"
                        onClick={() =>
                          handleSendIssue(issue.id).catch((err) =>
                            alert(err instanceof Error ? err.message : "Failed to send issue")
                          )
                        }
                      >
                        Send
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!newsletterIssues.length && <p style={{ opacity: 0.75 }}>No newsletter issues yet.</p>}
            </div>
          </div>

          <h2 style={{ marginTop: "3rem", marginBottom: "1.5rem" }}>Published Articles</h2>

          <div className="archive-grid">
            {articles.map((article) => (
              <div key={article.id} className="glass-card" style={{ position: "relative" }}>
                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "rgba(255, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 0, 0, 0.4)",
                    color: "#ff6b6b",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                  }}
                >
                  Delete
                </button>
                <div className="archive-card-date">{article.date}</div>
                <h3 className="archive-card-title">{article.title}</h3>
                <p className="archive-card-excerpt">{article.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="header">
        <div
          className="logo"
          onClick={() => {
            setCurrentView("home");
            setSelectedArticle(null);
          }}
        >
          Signal
        </div>
        <div className="header-actions">
          {isLoggedIn ? (
            <button
              className="nav-btn"
              onClick={() => {
                window.location.hash = "#admin";
                setCurrentView("admin");
              }}
            >
              ⚙️ Admin
            </button>
          ) : (
            <button
              className="nav-btn"
              onClick={() => {
                window.location.hash = "#admin";
              }}
              style={{ fontSize: "0.7rem", padding: "0.4rem 0.8rem" }}
            >
              Admin
            </button>
          )}
          <input
            type="text"
            className="search-box"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          />
          <button className="mode-toggle" onClick={toggleDarkMode}>
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <button className="nav-btn" onClick={() => setShowEmailModal(true)}>
            Subscribe
          </button>
        </div>
      </header>

      {currentView === "home" && !selectedArticle && (
        <>
          <div className="container">
            <section className="hero">
              <h1>Signal</h1>
              <p>Clarity in the noise. Ad-free forever.</p>
              <div className="hero-cta">
                <button className="btn" onClick={() => setShowEmailModal(true)}>
                  Subscribe Now
                </button>
                <button className="btn btn-secondary">Browse Archive</button>
              </div>
            </section>

            {loading && (
              <div style={{ textAlign: "center", opacity: 0.5, padding: "4rem 0" }}>
                Loading articles…
              </div>
            )}

            {error && !loading && (
              <div style={{ textAlign: "center", color: "#ff6b6b", padding: "4rem 0" }}>
                {error}
              </div>
            )}

            {!loading && !error && filteredArticles.length > 0 && (
              <>
                <div
                  className="glass-card"
                  onClick={() => {
                    setCurrentView("article");
                    setSelectedArticle(filteredArticles[0]);
                  }}
                >
                  <div className="card-badge">{filteredArticles[0].category}</div>
                  <h2 className="card-title">{filteredArticles[0].title}</h2>
                  <p className="card-text">{filteredArticles[0].excerpt}</p>
                  <div className="card-actions">
                    <button className="btn">Read Story</button>
                    <button className="btn btn-secondary">☕ Support</button>
                  </div>
                  <div className="card-meta">
                    {filteredArticles[0].date} • {filteredArticles[0].read_time} read
                  </div>
                </div>

                <h2 className="section-heading">Recent Issues</h2>
                <div className="archive-grid">
                  {filteredArticles.slice(1).map((article) => (
                    <div
                      key={article.id}
                      className="archive-card"
                      onClick={() => {
                        setCurrentView("article");
                        setSelectedArticle(article);
                      }}
                    >
                      <div className="archive-card-date">{article.date}</div>
                      <h3 className="archive-card-title">{article.title}</h3>
                      <p className="archive-card-excerpt">{article.excerpt}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="cta-section">
              <h2 className="cta-title">Get Weekly Updates</h2>
              <p className="cta-desc">Thoughtful writing in your inbox</p>
              <button className="btn" onClick={() => setShowEmailModal(true)}>
                Subscribe
              </button>
            </div>
          </div>
        </>
      )}

      {currentView === "article" && selectedArticle && (
        <div className="container article-view">
          <button
            className="nav-btn"
            onClick={() => {
              setCurrentView("home");
              setSelectedArticle(null);
            }}
            style={{ marginBottom: "2rem" }}
          >
            ← Back to Issues
          </button>

          <div className="article-header">
            <div className="article-badge">{selectedArticle.category}</div>
            <h1 className="article-title">{selectedArticle.title}</h1>
            <div className="article-meta">
              <span>{selectedArticle.date}</span>
              <span>{selectedArticle.read_time} read</span>
              <span>By {selectedArticle.author}</span>
            </div>
          </div>

          <div className="article-body">
            <MarkdownRenderer markdown={selectedArticle.body} />
          </div>

          <div className="cta-section" style={{ marginTop: "3rem" }}>
            <h3 className="cta-title">Support Quality Writing</h3>
            <button className="btn">☕ Buy us a Coffee</button>
          </div>

          <div className="glass-card" style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Share This Article</h3>
            <div className="share-buttons">
              <button className="share-btn" onClick={() => shareArticle("twitter")}>
                Twitter
              </button>
              <button className="share-btn" onClick={() => shareArticle("linkedin")}>
                LinkedIn
              </button>
              <button className="share-btn" onClick={() => shareArticle("copy")}>
                Copy Link
              </button>
            </div>
          </div>

          {getRelatedArticles().length > 0 && (
            <>
              <h2 className="section-heading" style={{ marginTop: "3rem" }}>
                Related Articles
              </h2>
              <div className="archive-grid">
                {getRelatedArticles().map((article) => (
                  <div
                    key={article.id}
                    className="archive-card"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="archive-card-date">{article.date}</div>
                    <h3 className="archive-card-title">{article.title}</h3>
                    <p className="archive-card-excerpt">{article.excerpt}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEmailModal(false)}>
              ×
            </button>
            {!emailSuccess ? (
              <>
                <h2>Get Weekly Issues</h2>
                <p>
                  Join readers who actually open their email. No ads, no spam—just good writing.
                </p>
                <form onSubmit={handleSubscribe}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn"
                    style={{ width: "100%" }}
                    disabled={subscribing}
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <h2>✓ Welcome!</h2>
                <p>Check your email for confirmation. Thanks for joining Signal!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="footer">
        <p>
          © 2026 Signal. Free forever. No ads. Ever. | <a href="#">About</a> |{" "}
          <a href="#">Archive</a>
        </p>
      </footer>

    </div>
  );
}
