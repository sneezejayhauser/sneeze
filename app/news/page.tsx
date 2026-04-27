"use client";

import { useState, useEffect, useRef } from "react";
import { safeJsonParse, safeAt } from "@/lib/safety";

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

const emptyForm = (): NewArticleForm => ({
  title: "",
  category: "Essay",
  date: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  excerpt: "",
  tags: "",
  author: "Editorial Team",
  read_time: "5 min",
  body: "",
});

export default function NewsPage() {
  const [currentView, setCurrentView] = useState<"home" | "article" | "login" | "admin">("home");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("signal-darkMode");
    return safeJsonParse(saved, true) as boolean;
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("signal-admin-logged-in");
  });
  const [adminPassword, setAdminPassword] = useState("");
  // Verified password stored in memory only (not in the bundle or localStorage)
  const verifiedPasswordRef = useRef<string>("");
  const [newArticle, setNewArticle] = useState<NewArticleForm>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

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
    if (window.location.hash === "#admin") {
      if (localStorage.getItem("signal-admin-logged-in")) {
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
    document.body.className = isDarkMode ? "" : "light-mode";
  }, [isDarkMode]);

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
      setNewArticle(emptyForm());
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
                  value={newArticle.body}
                  onChange={(e) => setNewArticle({ ...newArticle, body: e.target.value })}
                  placeholder="Article content (use paragraph breaks)"
                  rows={12}
                  required
                />
              </div>

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
            {selectedArticle.body.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
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

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        body {
          background: linear-gradient(135deg, #0a1428 0%, #1a2847 50%, #0f1823 100%);
          color: white; overflow-x: hidden; transition: background 0.3s;
        }
        body.light-mode {
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 50%, #f0f2f7 100%);
          color: #1a1a1a;
        }
        body::before {
          content: ''; position: fixed; width: 100%; height: 100%;
          background:
            radial-gradient(ellipse 800px 400px at 20% 30%, rgba(100,180,255,0.12) 0%, transparent 40%),
            radial-gradient(ellipse 600px 500px at 80% 70%, rgba(150,100,255,0.08) 0%, transparent 40%);
          pointer-events: none; z-index: 1;
        }
        body.light-mode::before {
          background:
            radial-gradient(ellipse 800px 400px at 20% 30%, rgba(100,150,255,0.08) 0%, transparent 40%),
            radial-gradient(ellipse 600px 500px at 80% 70%, rgba(150,100,200,0.05) 0%, transparent 40%);
        }
        .app { position: relative; z-index: 10; min-height: 100vh; }
        .header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.5rem 2rem; display: flex; justify-content: space-between;
          align-items: center; backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
          background: rgba(15,28,40,0.2); border-bottom: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s;
        }
        .light-mode .header { background: rgba(255,255,255,0.4); border-bottom-color: rgba(0,0,0,0.05); }
        .logo { font-size: 1.3rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .logo:hover { opacity: 0.8; }
        .header-actions { display: flex; gap: 1rem; align-items: center; }
        .search-box {
          padding: 0.6rem 1rem; background: rgba(0,0,0,0.2); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;
          font-size: 0.9rem; width: 200px; transition: all 0.3s;
        }
        .light-mode .search-box { background: rgba(255,255,255,0.5); border-color: rgba(0,0,0,0.08); color: #1a1a1a; }
        .search-box::placeholder { color: rgba(255,255,255,0.5); }
        .light-mode .search-box::placeholder { color: rgba(0,0,0,0.5); }
        .search-box:focus { outline: none; border-color: rgba(100,180,255,0.4); }
        .nav-btn {
          padding: 0.6rem 1.5rem; background: rgba(0,0,0,0.25); backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 12px;
          font-weight: 500; font-size: 0.85rem; cursor: pointer; transition: all 0.3s;
        }
        .light-mode .nav-btn { background: rgba(255,255,255,0.5); border-color: rgba(0,0,0,0.08); color: #1a1a1a; }
        .nav-btn:hover { background: rgba(0,0,0,0.35); border-color: rgba(255,255,255,0.15); }
        .light-mode .nav-btn:hover { background: rgba(255,255,255,0.7); }
        .mode-toggle {
          width: 44px; height: 44px; background: rgba(0,0,0,0.2); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; transition: all 0.3s;
        }
        .light-mode .mode-toggle { background: rgba(255,255,255,0.5); border-color: rgba(0,0,0,0.08); color: #1a1a1a; }
        .mode-toggle:hover { background: rgba(0,0,0,0.3); }
        .container { max-width: 1000px; margin: 0 auto; padding: 8rem 2rem 4rem; }
        .hero { text-align: center; margin-bottom: 4rem; }
        .hero h1 { font-size: 4rem; font-weight: 700; margin-bottom: 1rem; line-height: 1; }
        .hero p { font-size: 1.2rem; opacity: 0.6; font-weight: 300; margin-bottom: 2rem; }
        .hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .glass-card {
          padding: 2.5rem; margin-bottom: 1.5rem; border-radius: 28px;
          backdrop-filter: blur(48px); background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .light-mode .glass-card { background: rgba(255,255,255,0.5); border-color: rgba(0,0,0,0.05); }
        .glass-card:hover {
          background: rgba(0,0,0,0.28); border-color: rgba(255,255,255,0.15);
          transform: translateY(-6px); box-shadow: 0 20px 60px rgba(100,180,255,0.12);
        }
        .light-mode .glass-card:hover { background: rgba(255,255,255,0.7); box-shadow: 0 20px 60px rgba(100,150,255,0.08); }
        .card-badge {
          display: inline-block; padding: 0.35rem 0.95rem; background: rgba(0,0,0,0.25);
          backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px; font-size: 0.65rem; color: rgba(100,200,255,0.95);
          text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 1.25rem;
        }
        .light-mode .card-badge { background: rgba(100,150,255,0.2); border-color: rgba(100,150,255,0.3); color: #0066cc; }
        .card-title { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; line-height: 1.2; }
        .card-text { font-size: 1.05rem; line-height: 1.7; opacity: 0.75; margin-bottom: 1.75rem; }
        .card-actions { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
        .card-meta { font-size: 0.85rem; opacity: 0.5; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .btn {
          padding: 0.7rem 1.6rem; border-radius: 12px; font-weight: 600; font-size: 0.9rem;
          border: none; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(20px);
          background: rgba(0,0,0,0.3); border: 1.5px solid rgba(100,180,255,0.4); color: white;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .light-mode .btn { background: rgba(100,150,255,0.3); border-color: rgba(100,150,255,0.5); color: #0052a3; }
        .btn:hover:not(:disabled) { background: rgba(0,0,0,0.4); border-color: rgba(100,180,255,0.6); box-shadow: 0 8px 24px rgba(100,180,255,0.15); transform: translateY(-2px); }
        .light-mode .btn:hover:not(:disabled) { background: rgba(100,150,255,0.4); }
        .btn-secondary { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.1); }
        .light-mode .btn-secondary { background: rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.1); color: #1a1a1a; }
        .btn-secondary:hover { background: rgba(0,0,0,0.25); }
        .light-mode .btn-secondary:hover { background: rgba(0,0,0,0.15); }
        .share-buttons { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.75rem; }
        .share-btn {
          padding: 0.35rem 0.8rem; font-size: 0.7rem; background: rgba(0,0,0,0.15);
          backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7); border-radius: 6px; cursor: pointer; transition: all 0.2s;
        }
        .light-mode .share-btn { background: rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.1); color: #1a1a1a; }
        .share-btn:hover { background: rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.12); color: white; }
        .section-heading { font-size: 2rem; font-weight: 700; margin: 3rem 0 2rem; }
        .archive-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .archive-card {
          padding: 2rem; border-radius: 24px; backdrop-filter: blur(40px);
          background: rgba(0,0,0,0.18); border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; transition: all 0.4s;
        }
        .light-mode .archive-card { background: rgba(255,255,255,0.45); border-color: rgba(0,0,0,0.04); }
        .archive-card:hover {
          background: rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.12);
          transform: translateY(-6px); box-shadow: 0 16px 48px rgba(100,180,255,0.1);
        }
        .light-mode .archive-card:hover { background: rgba(255,255,255,0.65); }
        .archive-card-date { font-size: 0.7rem; color: rgba(100,200,255,0.8); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; margin-bottom: 0.75rem; }
        .light-mode .archive-card-date { color: #0066cc; }
        .archive-card-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.75rem; line-height: 1.3; }
        .archive-card-excerpt { font-size: 0.9rem; line-height: 1.6; opacity: 0.6; }
        .article-view { max-width: 800px; margin: 0 auto; }
        .article-header {
          padding: 2.5rem; margin-bottom: 1.5rem; border-radius: 28px;
          backdrop-filter: blur(48px); background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
        }
        .light-mode .article-header { background: rgba(255,255,255,0.5); border-color: rgba(0,0,0,0.05); }
        .article-badge {
          display: inline-block; padding: 0.4rem 1rem; background: rgba(0,0,0,0.25);
          backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px; font-size: 0.7rem; color: rgba(100,200,255,0.95);
          text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 1.5rem;
        }
        .light-mode .article-badge { background: rgba(100,150,255,0.15); border-color: rgba(100,150,255,0.3); color: #0066cc; }
        .article-title { font-size: 2.8rem; font-weight: 700; margin-bottom: 1rem; line-height: 1.15; }
        .article-meta { display: flex; gap: 1.5rem; opacity: 0.6; font-size: 0.9rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .article-body {
          padding: 2.5rem; border-radius: 28px; backdrop-filter: blur(48px);
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
          line-height: 1.8; font-size: 1.05rem;
        }
        .light-mode .article-body { background: rgba(255,255,255,0.5); border-color: rgba(0,0,0,0.05); }
        .article-body p { margin-bottom: 1.5rem; }
        .article-body h3 { font-size: 1.5rem; margin: 2rem 0 1rem; font-weight: 700; }
        .cta-section {
          padding: 3rem; border-radius: 28px; backdrop-filter: blur(48px);
          background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.1);
          text-align: center; margin: 3rem 0;
        }
        .light-mode .cta-section { background: rgba(255,255,255,0.5); border-color: rgba(0,0,0,0.05); }
        .cta-title { font-size: 2rem; font-weight: 700; margin-bottom: 0.75rem; }
        .cta-desc { opacity: 0.6; margin-bottom: 1.75rem; font-size: 1.05rem; }
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 200;
        }
        .modal {
          padding: 3rem; border-radius: 28px; backdrop-filter: blur(48px);
          background: rgba(15,28,40,0.9); border: 1px solid rgba(255,255,255,0.15);
          max-width: 500px; width: 90%; position: relative;
        }
        .light-mode .modal { background: rgba(255,255,255,0.95); border-color: rgba(0,0,0,0.05); color: #1a1a1a; }
        .modal-close {
          position: absolute; top: 1.5rem; right: 1.5rem; width: 32px; height: 32px;
          background: rgba(255,255,255,0.1); border: none; border-radius: 8px;
          color: white; cursor: pointer; font-size: 1.2rem; display: flex;
          align-items: center; justify-content: center; transition: all 0.2s;
        }
        .light-mode .modal-close { background: rgba(0,0,0,0.08); color: #1a1a1a; }
        .modal-close:hover { background: rgba(255,255,255,0.2); }
        .modal h2 { font-size: 1.8rem; margin-bottom: 1rem; font-weight: 700; }
        .modal p { opacity: 0.6; margin-bottom: 1.5rem; line-height: 1.6; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; opacity: 0.7; }
        .form-group input, .form-group select, .form-group textarea,
        select, textarea {
          width: 100%; padding: 0.75rem; border-radius: 8px;
          background: rgba(0,0,0,0.2); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1); color: white;
          font-size: 0.95rem; transition: all 0.2s;
        }
        .light-mode .form-group input,
        .light-mode .form-group select,
        .light-mode .form-group textarea,
        .light-mode select,
        .light-mode textarea {
          background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); color: #1a1a1a;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus,
        select:focus, textarea:focus {
          outline: none; border-color: rgba(100,180,255,0.4); background: rgba(100,180,255,0.1);
        }
        .form-group input::placeholder, .form-group textarea::placeholder,
        textarea::placeholder { color: rgba(255,255,255,0.4); }
        .light-mode .form-group input::placeholder,
        .light-mode .form-group textarea::placeholder,
        .light-mode textarea::placeholder { color: rgba(0,0,0,0.4); }
        select { cursor: pointer; }
        textarea { resize: vertical; font-family: inherit; }
        .footer { text-align: center; padding: 3rem 2rem; opacity: 0.4; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .footer a { opacity: 0.6; text-decoration: none; transition: opacity 0.2s; }
        .footer a:hover { opacity: 1; }
        @media (max-width: 768px) {
          .container { padding: 6rem 1.5rem 2rem; }
          .hero h1 { font-size: 2.5rem; }
          .search-box { width: 140px; font-size: 0.8rem; }
          .article-title { font-size: 2rem; }
          .modal { padding: 2rem; }
        }
      `}</style>
    </div>
  );
}
