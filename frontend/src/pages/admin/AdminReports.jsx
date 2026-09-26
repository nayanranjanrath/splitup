import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminReports,
  validateReport,
} from "../../lib/api.js";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminReports();

      setReports(
        Array.isArray(data?.reports)
          ? data.reports
          : []
      );
    } catch (err) {
      setError(
        err?.message || "Could not load reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleValidate(report, status) {
    const reportId =
      report?._id || report?.reportid;

    if (!reportId) {
      setError("Report ID is missing.");
      return;
    }

    try {
      setProcessing(reportId);
      setError("");

      await validateReport({
        reportid: reportId,
        status,
      });

      // Backend deletes the report after validation.
      setReports((prev) =>
        prev.filter(
          (item) =>
            item?._id !== reportId &&
            item?.reportid !== reportId
        )
      );
    } catch (err) {
      setError(
        err?.message || "Could not validate report."
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
            MODERATION
          </span>

          <h1>User Reports</h1>

          <p>
            Review reports submitted by SplitUp users.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={loadReports}
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
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">
            ✓
          </div>

          <h3>No reports</h3>

          <p>
            There are currently no pending user reports.
          </p>
        </div>
      ) : (
        <div className="admin-report-list">
          {reports.map((report) => {
            const reportId =
              report?._id || report?.reportid;

            const reporter = report?.reporter;
            const reportedUser = report?.reporteduser;

            const reporterName =
              reporter?.profilename ||
              "Unknown user";

            const reportedName =
              reportedUser?.profilename ||
              "Unknown user";

            const status =
              report?.status || "Pending";

            return (
              <article
                className="admin-report-card"
                key={reportId}
              >
                <div className="admin-report-top">
                  <div>
                    <span className="admin-report-label">
                      REPORT
                    </span>

                    <h3>
                      {reportedName}
                    </h3>
                  </div>

                  <span className="admin-status pending">
                    {status}
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
                      {reportId}
                    </strong>
                  </div>
                </div>

                {/* Reason */}
                {report?.reason && (
                  <div className="admin-report-reason">
                    <span>Reason</span>

                    <p>
                      {report.reason}
                    </p>
                  </div>
                )}

                {/* Description */}
                {report?.description && (
                  <div className="admin-report-reason">
                    <span>Description</span>

                    <p>
                      {report.description}
                    </p>
                  </div>
                )}

                <div className="admin-report-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={
                      processing === reportId
                    }
                    onClick={() =>
                      handleValidate(
                        report,
                        "Reviewed"
                      )
                    }
                  >
                    {processing === reportId
                      ? "Processing..."
                      : "Validate"}
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    disabled={
                      processing === reportId
                    }
                    onClick={() =>
                      handleValidate(
                        report,
                        "Rejected"
                      )
                    }
                  >
                    Reject
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