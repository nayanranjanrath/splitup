import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminBugs,
  validateBug,
} from "../../lib/api.js";

export default function AdminBugs() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);

  async function loadBugs() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminBugs();

      setBugs(
        Array.isArray(data?.bugs)
          ? data.bugs
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
        "Could not load bug reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBugs();
  }, []);

  async function handleValidate(bug) {
    const bugId =
      bug?._id || bug?.reportbugid;

    if (!bugId) {
      setError("Bug report ID is missing.");
      return;
    }

    try {
      setProcessing(bugId);
      setError("");

      await validateBug(bugId);

      setBugs((prev) =>
        prev.filter(
          (item) =>
            item?._id !== bugId &&
            item?.reportbugid !== bugId
        )
      );
    } catch (err) {
      setError(
        err?.message ||
        "Could not validate bug report."
      );
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-page-head">
        <div>

          <Link
            to="/admin"
            className="admin-back"
          >
            ← Dashboard
          </Link>

          <span className="admin-kicker">
            DEVELOPMENT
          </span>

          <h1>Bug Reports</h1>

          <p>
            Review issues reported by SplitUp users.
          </p>

        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={loadBugs}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-error">
          ⚠ {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="admin-empty">
          Loading bug reports...
        </div>
      ) : bugs.length === 0 ? (
        <div className="admin-empty">

          <div className="admin-empty-icon">
            ✓
          </div>

          <h3>No bug reports</h3>

          <p>
            There are currently no pending bug reports.
          </p>

        </div>
      ) : (
        <div className="admin-report-list">

          {bugs.map((bug) => {

            const bugId =
              bug?._id || bug?.reportbugid;

            const reporter = bug?.reporter;

            const reporterName =
              reporter?.profilename ||
              "Unknown user";

            return (
              <article
                className="admin-report-card bug-card"
                key={bugId}
              >

                <div className="admin-report-top">

                  <div>

                    <span className="admin-report-label">
                      BUG REPORT
                    </span>

                    <h3>
                      {bug?.title ||
                        bug?.subject ||
                        "Reported issue"}
                    </h3>

                  </div>

                  <span className="admin-status bug">
                    Bug
                  </span>

                </div>

                <div className="admin-report-info">

                  <div>
                    <span>Reported by</span>

                    <strong>
                      {reporterName}
                    </strong>
                  </div>

                  <div>
                    <span>Report ID</span>

                    <strong className="admin-id">
                      {bugId}
                    </strong>
                  </div>

                </div>

                {bug?.description && (
                  <div className="admin-report-reason">
                    <span>Description</span>

                    <p>
                      {bug.description}
                    </p>
                  </div>
                )}

                {bug?.message && (
                  <div className="admin-report-reason">
                    <span>Message</span>

                    <p>
                      {bug.message}
                    </p>
                  </div>
                )}

                {bug?.steps && (
                  <div className="admin-report-reason">
                    <span>Steps to reproduce</span>

                    <p>
                      {bug.steps}
                    </p>
                  </div>
                )}

                <div className="admin-report-actions">

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={
                      processing === bugId
                    }
                    onClick={() =>
                      handleValidate(bug)
                    }
                  >
                    {processing === bugId
                      ? "Processing..."
                      : "Mark as Reviewed"}
                  </button>

                </div>

              </article>
            );
          })}

        </div>
      )}

    </div>
  );
}