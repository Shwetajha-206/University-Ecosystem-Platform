import { useState } from "react";
import { Search, CheckCircle, Clock, XCircle, Loader, ShieldCheck, MessageSquare } from "lucide-react";

/* ───────── keyframe animation injected once ───────── */
const STYLE_ID = "__track-grievance-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const sheet = document.createElement("style");
  sheet.id = STYLE_ID;
  sheet.textContent = `
    @keyframes tg-float {
      0%   { transform: translateY(0) scale(1); }
      50%  { transform: translateY(-18px) scale(1.04); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes tg-pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(96,165,250,.45); }
      70%  { box-shadow: 0 0 0 10px rgba(96,165,250,0); }
      100% { box-shadow: 0 0 0 0 rgba(96,165,250,0); }
    }
    @keyframes tg-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes tg-fade-in-up {
      0%   { opacity:0; transform:translateY(24px); }
      100% { opacity:1; transform:translateY(0); }
    }
  `;
  document.head.appendChild(sheet);
}

/* ───────── status config ───────── */
const STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    bg: "rgba(251,191,36,.15)",
    text: "#b45309",
    border: "rgba(251,191,36,.35)",
    icon: Clock,
  },
  "In Progress": {
    label: "In Progress",
    bg: "rgba(96,165,250,.15)",
    text: "#1d4ed8",
    border: "rgba(96,165,250,.35)",
    icon: Loader,
  },
  Resolved: {
    label: "Resolved",
    bg: "rgba(34,197,94,.15)",
    text: "#15803d",
    border: "rgba(34,197,94,.35)",
    icon: CheckCircle,
  },
  Rejected: {
    label: "Rejected",
    bg: "rgba(239,68,68,.15)",
    text: "#b91c1c",
    border: "rgba(239,68,68,.35)",
    icon: XCircle,
  },
};

const TIMELINE_STEPS = ["Submitted", "Assigned", "In Progress", "Resolved"];

function getStepIndex(status) {
  if (status === "Pending") return 0;
  if (status === "In Progress") return 2;
  if (status === "Resolved") return 3;
  return 0;
}

/* ───────── decorative circle helper ───────── */
function FloatingCircle({ size, top, left, right, opacity, delay }) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        top,
        left,
        right,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(96,165,250,.18) 0%, rgba(59,130,246,.06) 100%)",
        border: "1px solid rgba(148,163,184,.08)",
        opacity: opacity ?? 0.7,
        animation: `tg-float ${6 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        pointerEvents: "none",
      }}
    />
  );
}

/* ───────── main component ───────── */
export function TrackGrievanceSection() {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/grievances/public/${trimmed}`
      );
      if (res.status === 404) {
        setError(
          "No grievance found with this ID. Please check and try again."
        );
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      setError("Could not connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const statusCfg = result
    ? STATUS_CONFIG[result.status] || STATUS_CONFIG["Pending"]
    : null;
  const stepIndex = result ? getStepIndex(result.status) : -1;

  /* ───────── render ───────── */
  return (
    <section
      id="track"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(165deg, #0f172a 0%, #1e3a8a 55%, #1e40af 100%)",
        padding: "5rem 0",
      }}
    >
      {/* ── decorative floating shapes ── */}
      <FloatingCircle size="260px" top="-60px" left="-80px" delay={0} />
      <FloatingCircle size="180px" top="15%" right="-50px" opacity={0.5} delay={2} />
      <FloatingCircle size="120px" top="65%" left="8%" opacity={0.4} delay={3.5} />
      <FloatingCircle size="200px" top="70%" right="5%" opacity={0.35} delay={1.5} />
      <FloatingCircle size="90px" top="40%" left="50%" opacity={0.25} delay={4} />

      {/* subtle grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(148,163,184,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div className="relative z-10 mx-auto" style={{ maxWidth: 680, padding: "0 1.25rem" }}>
        {/* ── Shield icon area ── */}
        <div className="flex justify-center mb-5">
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, rgba(59,130,246,.25), rgba(99,102,241,.2))",
              border: "1.5px solid rgba(148,163,184,.18)",
              backdropFilter: "blur(10px)",
              animation: "tg-pulse-ring 2.5s ease-out infinite",
            }}
          >
            <ShieldCheck size={34} color="#60a5fa" strokeWidth={1.6} />
          </div>
        </div>

        {/* ── Heading ── */}
        <div className="text-center mb-10">
          <h2
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            Track Your Grievance
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#93c5fd", lineHeight: 1.6 }}>
            Enter your Grievance ID to check current status — no login required.
          </p>
        </div>

        {/* ── Glassmorphism search card ── */}
        <div
          style={{
            background: "rgba(255,255,255,.07)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 20,
            padding: "2rem 1.75rem",
            boxShadow: "0 8px 32px rgba(0,0,0,.25)",
          }}
        >
          {/* search row */}
          <div className="flex gap-3">
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                onKeyDown={handleKey}
                placeholder="e.g. GRV-042"
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 46px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(148,163,184,.2)",
                  background: "rgba(15,23,42,.6)",
                  color: "#f1f5f9",
                  fontSize: "0.95rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  outline: "none",
                  transition: "border-color .25s, box-shadow .25s",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(96,165,250,.55)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,.18)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(148,163,184,.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !id.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 24px",
                borderRadius: 12,
                border: "none",
                cursor: loading || !id.trim() ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                opacity: loading || !id.trim() ? 0.5 : 1,
                transition: "transform .2s, box-shadow .2s, opacity .2s",
                boxShadow: "0 4px 14px rgba(37,99,235,.35)",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,.35)";
              }}
            >
              {loading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {loading ? "Searching…" : "Track"}
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "0.85rem",
                color: "#fca5a5",
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.25)",
                borderRadius: 12,
                padding: "12px 16px",
                animation: "tg-fade-in-up .35s ease-out",
              }}
            >
              <XCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* ── Result card ── */}
        {result && statusCfg && (
          <div
            style={{
              marginTop: 28,
              background: "rgba(255,255,255,.07)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 20,
              padding: "2rem 1.75rem",
              boxShadow: "0 8px 32px rgba(0,0,0,.25)",
              animation: "tg-fade-in-up .45s ease-out",
            }}
          >
            {/* header row */}
            <div className="flex items-start justify-between gap-4 flex-wrap" style={{ marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Grievance ID
                </p>
                <p
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    color: "#f1f5f9",
                    letterSpacing: "0.04em",
                    background: "linear-gradient(90deg,#e0e7ff,#60a5fa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {result.grievanceID}
                </p>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: statusCfg.bg,
                  color: statusCfg.text,
                  border: `1px solid ${statusCfg.border}`,
                  letterSpacing: "0.03em",
                }}
              >
                {(() => {
                  const Icon = statusCfg.icon;
                  return <Icon size={13} />;
                })()}
                {statusCfg.label}
              </span>
            </div>

            {/* details grid */}
            <div
              className="grid grid-cols-2 gap-4"
              style={{
                background: "rgba(15,23,42,.35)",
                borderRadius: 14,
                padding: "18px 20px",
                marginBottom: 24,
              }}
            >
              {[
                { label: "Category", value: result.category },
                { label: "Priority", value: result.priority || "Medium" },
                {
                  label: "Submitted",
                  value: new Date(result.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                },
                {
                  label: "Last Updated",
                  value: new Date(result.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Timeline ── */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                Progress
              </p>
              <div className="flex items-center">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  const current = i === stepIndex;
                  const last = i === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step} className="flex items-center" style={{ flex: last ? "none" : 1 }}>
                      <div className="flex flex-col items-center">
                        {/* dot */}
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            transition: "all .35s ease",
                            background: done
                              ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                              : "rgba(30,41,59,.7)",
                            border: done
                              ? "2px solid rgba(96,165,250,.5)"
                              : "2px solid rgba(100,116,139,.3)",
                            color: done ? "#fff" : "#475569",
                            boxShadow: current
                              ? "0 0 0 4px rgba(96,165,250,.2), 0 0 12px rgba(96,165,250,.15)"
                              : done
                              ? "0 2px 8px rgba(37,99,235,.3)"
                              : "none",
                          }}
                        >
                          {done ? "✓" : i + 1}
                        </div>
                        {/* label */}
                        <span
                          style={{
                            fontSize: "0.6rem",
                            marginTop: 6,
                            textAlign: "center",
                            lineHeight: 1.25,
                            fontWeight: done ? 600 : 400,
                            color: done ? "#93c5fd" : "#475569",
                            maxWidth: 58,
                          }}
                        >
                          {step}
                        </span>
                      </div>
                      {/* connecting line */}
                      {!last && (
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            marginBottom: 22,
                            marginLeft: 4,
                            marginRight: 4,
                            background:
                              i < stepIndex
                                ? "linear-gradient(90deg, #2563eb, #7c3aed)"
                                : "rgba(51,65,85,.5)",
                            transition: "background .35s ease",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Admin reply ── */}
            {result.adminReply && (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(59,130,246,.1), rgba(99,102,241,.08))",
                  border: "1px solid rgba(96,165,250,.2)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#60a5fa",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  <MessageSquare size={14} />
                  Response from Administration
                </p>
                <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.7 }}>
                  {result.adminReply}
                </p>
              </div>
            )}

            <p
              style={{
                fontSize: "0.72rem",
                color: "#475569",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Login to your account to escalate, download, or rate the resolution.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
