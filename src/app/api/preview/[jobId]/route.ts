import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterGenerationJobs } from "@/lib/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const result = await db
      .select({
        htmlContent: newsletterGenerationJobs.htmlContent,
        newsletterSubject: newsletterGenerationJobs.newsletterSubject,
        newsletterSubtitle: newsletterGenerationJobs.newsletterSubtitle,
      })
      .from(newsletterGenerationJobs)
      .where(eq(newsletterGenerationJobs.id, jobId))
      .limit(1);

    const job = result[0];

    if (!job || !job.htmlContent) {
      return NextResponse.json(
        { error: "Preview not found" },
        { status: 404 }
      );
    }

    // Check if today's newsletter has been published (use local-time midnight boundaries)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const publishedResult = await db
      .select({ id: newsletterGenerationJobs.id })
      .from(newsletterGenerationJobs)
      .where(
        and(
          eq(newsletterGenerationJobs.status, "GENERATE_JOB_PUBLISHED"),
          gte(newsletterGenerationJobs.startedAt, todayStart),
          lt(newsletterGenerationJobs.startedAt, tomorrowStart)
        )
      )
      .limit(1);
    const isPublished = publishedResult.length > 0;

    const encodedHtml = Buffer.from(job.htmlContent).toString("base64");
    const subjectText = (job.newsletterSubject || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const subtitleText = (job.newsletterSubtitle || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const subjectForJs = JSON.stringify(job.newsletterSubject || "");
    const subtitleForJs = JSON.stringify(job.newsletterSubtitle || "");
    const jobIdForJs = JSON.stringify(jobId);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter Preview</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { display: flex; height: 100vh; background: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .preview-container { width: 75%; height: 100%; display: flex; justify-content: center; overflow-y: auto; }
  .preview-pane { width: 100%; max-width: 670px; height: 100%; border: none; }
  .actions-pane {
    width: 25%; height: 100%; background: #FAFAFA; border-left: 1px solid #d4d4d4;
    padding: 24px; display: flex; flex-direction: column; gap: 12px;
  }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 16px; margin-top: 8px; border-radius: 6px; font-size: 14px; font-weight: 500;
    cursor: pointer; border: 1px solid #d4d4d4; background: #fff; color: #1a1a1a;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn:hover { background: #e8e8e8; border-color: #cfcfcf; }
  .btn.copied, .btn.finalized { background: #dcfce7; border-color: #86efac; color: #166534; }
  .btn.error { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
  .subject-section { margin-bottom: 48px; display: flex; flex-direction: column; gap: 12px; }
  .section-label { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .subject-row { display: flex; align-items: center; gap: 8px; }
  .subject-text { font-size: 18px; font-weight: normal; color: #1a1a1a; word-break: break-word; flex: 1; }
  .icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 4px; border: 1px solid #d4d4d4;
    background: #fff; color: #6b7280; cursor: pointer; flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .icon-btn:hover { background: #e8e8e8; border-color: #cfcfcf; color: #1a1a1a; }
  .icon-btn.copied { background: #dcfce7; border-color: #86efac; color: #166534; }
  body.dark { background: lab(9 -0.85 -6.57); }
  body.dark .actions-pane { background: lab(14 -0.8 -5.5); border-left-color: lab(25 -0.7 -4.5); }
  body.dark .btn { background: lab(18 -0.7 -5); color: lab(85 -1 -3); border-color: lab(25 -0.7 -4.5); }
  body.dark .btn:hover { background: lab(20 -0.7 -4.5); border-color: lab(30 -0.7 -4); }
  body.dark .btn.copied, body.dark .btn.finalized { background: #052e16; border-color: #166534; color: #86efac; }
  body.dark .btn.error { background: #450a0a; border-color: #991b1b; color: #fca5a5; }
  body.dark .section-label { color: lab(60 -0.5 -3); }
  body.dark .subject-text { color: lab(85 -1 -3); }
  body.dark .icon-btn { background: lab(18 -0.7 -5); color: lab(60 -0.5 -3); border-color: lab(25 -0.7 -4.5); }
  body.dark .icon-btn:hover { background: lab(20 -0.7 -4.5); border-color: lab(30 -0.7 -4); color: lab(85 -1 -3); }
  body.dark .icon-btn.copied { background: #052e16; border-color: #166534; color: #86efac; }
  .dialog-overlay {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    z-index: 100; align-items: center; justify-content: center;
  }
  .dialog-overlay.open { display: flex; }
  .dialog {
    background: #fff; border-radius: 10px; padding: 24px; max-width: 420px; width: 90%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15); font-family: inherit;
  }
  .dialog h3 { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
  .dialog p { font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 20px; }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .dialog-btn {
    padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;
    cursor: pointer; border: 1px solid #d4d4d4; background: #fff; color: #1a1a1a;
    transition: background 0.15s, border-color 0.15s;
  }
  .dialog-btn:hover { background: #e8e8e8; border-color: #cfcfcf; }
  .dialog-btn.proceed { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
  .dialog-btn.proceed:hover { background: #333; border-color: #333; }
  body.dark .dialog { background: lab(14 -0.8 -5.5); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
  body.dark .dialog h3 { color: lab(92 -1 -3); }
  body.dark .dialog p { color: lab(70 -0.5 -3); }
  body.dark .dialog-btn { background: lab(18 -0.7 -5); color: lab(85 -1 -3); border-color: lab(25 -0.7 -4.5); }
  body.dark .dialog-btn:hover { background: lab(22 -0.7 -4.5); border-color: lab(30 -0.7 -4); }
  body.dark .dialog-btn.proceed { background: lab(85 -1 -3); color: lab(9 -0.85 -6.57); border-color: lab(85 -1 -3); }
  body.dark .dialog-btn.proceed:hover { background: lab(75 -1 -3); border-color: lab(75 -1 -3); }
</style>
</head>
<body>
  <div class="preview-container">
    <iframe class="preview-pane" id="previewFrame"></iframe>
  </div>
  <div class="actions-pane">
    <div class="subject-section">
      <div class="section-label">Email Subject</div>
      <div class="subject-row">
        <span class="subject-text">${subjectText}</span>
        <button class="icon-btn" id="copySubjectBtn" onclick="copySubject()" title="Copy subject">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
      <div class="section-label" style="margin-top:12px;">Email Subtitle</div>
      <div class="subject-row">
        <span class="subject-text">${subtitleText}</span>
        <button class="icon-btn" id="copySubtitleBtn" onclick="copySubtitle()" title="Copy subtitle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
    </div>
    <div class="subject-section">
      <div class="section-label">Actions</div>
      <button class="btn" id="copyBtn" onclick="copyHtml()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy HTML
      </button>
      <button class="btn" id="finalizeBtn" onclick="finalizePublished()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Finalize and mark published
      </button>
    </div>
  </div>
  <div class="dialog-overlay" id="confirmDialog">
    <div class="dialog">
      <h3>Confirm Finalize</h3>
      <p>Are you sure you want to finalize this newsletter content? This will also mark each article as published.</p>
      <div class="dialog-actions">
        <button class="dialog-btn" onclick="closeDialog()">Cancel</button>
        <button class="dialog-btn proceed" onclick="closeDialog(); doFinalize()">Proceed</button>
      </div>
    </div>
  </div>
  <script>
    (function() {
      var theme = localStorage.getItem("theme");
      if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.body.classList.add("dark");
      }
    })();
    var rawHtml = atob("${encodedHtml}");
    var currentJobId = ${jobIdForJs};
    var isPublished = ${isPublished};
    var frame = document.getElementById("previewFrame");
    frame.srcdoc = rawHtml;
    frame.addEventListener("load", function() {
      try {
        var links = frame.contentDocument.querySelectorAll("a[href]");
        links.forEach(function(a) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        });
      } catch(e) {}
    });
    if (isPublished) {
      var btn = document.getElementById("finalizeBtn");
      btn.disabled = true;
      btn.classList.add("finalized");
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Newsletter published!';
    }
    function copySubject() {
      navigator.clipboard.writeText(${subjectForJs}).then(function() {
        var btn = document.getElementById("copySubjectBtn");
        btn.classList.add("copied");
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(function() {
          btn.classList.remove("copied");
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 2000);
      });
    }
    function copySubtitle() {
      navigator.clipboard.writeText(${subtitleForJs}).then(function() {
        var btn = document.getElementById("copySubtitleBtn");
        btn.classList.add("copied");
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(function() {
          btn.classList.remove("copied");
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 2000);
      });
    }
    function copyHtml() {
      navigator.clipboard.writeText(rawHtml).then(function() {
        var btn = document.getElementById("copyBtn");
        btn.classList.add("copied");
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(function() {
          btn.classList.remove("copied");
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy HTML';
        }, 2000);
      });
    }
    function finalizePublished() {
      document.getElementById("confirmDialog").classList.add("open");
    }
    function closeDialog() {
      document.getElementById("confirmDialog").classList.remove("open");
    }
    function doFinalize() {
      var btn = document.getElementById("finalizeBtn");
      btn.disabled = true;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Processing...';
      fetch("/api/articles/finalize-published", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: currentJobId })
      })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.success) {
            btn.classList.add("finalized");
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ' + data.message;
          } else {
            btn.classList.add("error");
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ' + (data.error || "Failed");
            btn.disabled = false;
          }
        })
        .catch(function() {
          btn.classList.add("error");
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Network error';
          btn.disabled = false;
        });
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error fetching preview:", error);
    return NextResponse.json(
      { error: "Failed to load preview" },
      { status: 500 }
    );
  }
}
