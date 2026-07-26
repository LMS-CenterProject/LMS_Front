import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { certificatesApi } from "../../api/CertificatesApi";
import type { Certificate } from "../../api/CertificatesApi";
import { downloadCertificate } from "../../helpers/useCertificateDownload";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-7 h-7 border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin" />
  </div>
);

const ErrorBanner = ({ msg }: { msg: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
    {msg}
  </div>
);

// ─── Download Button ──────────────────────────────────────────────────────────

function DownloadButton({
  cert,
  recipientName,
  accent,
}: {
  cert: Certificate;
  recipientName: string;
  accent: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      await downloadCertificate({
        courseTitle: cert.courseTitle,
        instructorName: cert.instructorName,
        recipientName,
        issuedAt: cert.issuedAt,
        certificateId: cert.id,
      });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <button
      onClick={handleDownload}
      title="Download certificate as PNG"
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
      style={{ color: accent, background: `${accent}12` }}
      disabled={status === "loading"}
    >
      {status === "loading" ? (
        <>
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="28" strokeDashoffset="10" />
          </svg>
          Generating…
        </>
      ) : status === "done" ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Saved!
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </>
      )}
    </button>
  );
}

// ─── Certificate Card ─────────────────────────────────────────────────────────

const CERT_GRADIENTS = [
  "from-purple-50 via-white to-purple-50 border-purple-200",
  "from-amber-50 via-white to-amber-50 border-amber-200",
  "from-emerald-50 via-white to-emerald-50 border-emerald-200",
  "from-blue-50 via-white to-blue-50 border-blue-200",
  "from-pink-50 via-white to-pink-50 border-pink-200",
  "from-cyan-50 via-white to-cyan-50 border-cyan-200",
];

const CERT_ACCENT_COLORS = [
  "#6d28d9",
  "#d97706",
  "#059669",
  "#2563eb",
  "#db2777",
  "#0891b2",
];

function CertificateCard({
  cert,
  idx,
  recipientName,
}: {
  cert: Certificate;
  idx: number;
  recipientName: string;
}) {
  const gradient = CERT_GRADIENTS[idx % CERT_GRADIENTS.length];
  const accent = CERT_ACCENT_COLORS[idx % CERT_ACCENT_COLORS.length];

  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} border rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group overflow-hidden`}
    >
      {/* Decorative corner */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-bl-[4rem] opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: accent }}
      />

      {/* Seal top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          🏆
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-xs font-semibold text-green-600">Verified</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: accent }}
        >
          Certificate of Completion
        </p>
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
          {cert.courseTitle}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Instructed by {cert.instructorName}
        </p>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3 border-t border-dashed"
        style={{ borderColor: `${accent}30` }}
      >
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            Issued on
          </p>
          <p className="text-xs font-semibold text-gray-700">
            {fmtDate(cert.issuedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download button */}
          <DownloadButton cert={cert} recipientName={recipientName} accent={accent} />

          {/* View online link */}
          {cert.certificateUrl ? (
            <a
              href={cert.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ color: accent, background: `${accent}12` }}
            >
              View →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const { token, user } = useAuth();    // assumes `user` has a `name` / `fullName` field
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Derive the recipient's display name — adjust field to match your User type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyUser = user as any;
  const recipientName: string =
    anyUser?.fullName ?? anyUser?.name ?? anyUser?.displayName ?? "Student";

  useEffect(() => {
    if (!token) return;
    certificatesApi
      .getMyCertificates(token)
      .then(setCerts)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = certs.filter(
    (c) =>
      c.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.instructorName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="lf-page min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'); .lf-page{font-family:'DM Sans',sans-serif;} .lf-page .font-display{font-family:'Syne',sans-serif;}`}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Certificates
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {certs.length} certificate{certs.length !== 1 ? "s" : ""} earned
            </p>
          </div>
          {certs.length > 0 && (
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search certificates…"
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 bg-white w-52"
              />
            </div>
          )}
        </div>

        {error && <ErrorBanner msg={error} />}

        {loading ? (
          <Spinner />
        ) : certs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-3xl bg-purple-50 flex items-center justify-center text-5xl mb-5 border border-purple-100">
              🏆
            </div>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
              No certificates yet
            </h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Complete all lessons in a course to earn your certificate of
              completion.
            </p>
            <a
              href="/lms/progress"
              className="mt-5 inline-flex items-center gap-2 bg-[#6d28d9] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#5b21b6] transition-colors shadow-sm shadow-purple-200"
            >
              Track your progress →
            </a>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4 mb-7">
              {[
                { label: "Total Earned", value: certs.length, icon: "🏆" },
                {
                  label: "Most Recent",
                  value:
                    certs.length > 0
                      ? fmtDate(certs[certs.length - 1].issuedAt)
                      : "—",
                  icon: "📅",
                },
                {
                  label: "With URL",
                  value: certs.filter((c) => !!c.certificateUrl).length,
                  icon: "🔗",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="text-2xl">{s.icon}</div>
                  <div>
                    <div className="font-display text-lg font-bold text-gray-900">
                      {s.value}
                    </div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">
                No certificates match your search.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c, idx) => (
                  <CertificateCard
                    key={c.id}
                    cert={c}
                    idx={idx}
                    recipientName={recipientName}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}