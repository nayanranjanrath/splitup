import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminStats,
} from "../../lib/api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequestGroups: 0,
    totalReports: 0,
    totalBugs: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminStats();

        if (!alive) return;

        setStats({
          totalUsers: data?.stats?.totalUsers || 0,
          totalRequestGroups:
            data?.stats?.totalRequestGroups || 0,
          totalReports:
            data?.stats?.totalReports || 0,
          totalBugs:
            data?.stats?.totalBugs || 0,
        });
      } catch (err) {
        if (!alive) return;

        setError(
          err?.message ||
          "Could not load admin statistics."
        );
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-page-head">
        <div>
          <span className="admin-kicker">
            SPLITUP ADMIN
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor users, subscription groups, reports
            and platform issues.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-error">
          ⚠ {error}
        </div>
      )}

      {/* Statistics */}
      <div className="admin-stat-grid">

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            👥
          </div>

          <div>
            <span>Total Users</span>

            <strong>
              {loading ? "..." : stats.totalUsers}
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            👨‍👩‍👧‍👦
          </div>

          <div>
            <span>Request Groups</span>

            <strong>
              {loading
                ? "..."
                : stats.totalRequestGroups}
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            🚨
          </div>

          <div>
            <span>User Reports</span>

            <strong>
              {loading ? "..." : stats.totalReports}
            </strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            🐛
          </div>

          <div>
            <span>Bug Reports</span>

            <strong>
              {loading ? "..." : stats.totalBugs}
            </strong>
          </div>
        </div>

      </div>

      {/* Admin Actions */}
      <section className="admin-section">

        <div className="admin-section-head">
          <div>
            <h2>Administration</h2>

            <p>
              Manage reports and platform feedback.
            </p>
          </div>
        </div>

        <div className="admin-action-grid">

          <Link
            to="/admin/reports"
            className="admin-action-card"
          >
            <span className="admin-action-icon">
              🚨
            </span>

            <div>
              <h3>User Reports</h3>

              <p>
                Review reports submitted against users.
              </p>
            </div>

            <span className="admin-action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/admin/bugs"
            className="admin-action-card"
          >
            <span className="admin-action-icon">
              🐛
            </span>

            <div>
              <h3>Bug Reports</h3>

              <p>
                Review bugs reported by users.
              </p>
            </div>

            <span className="admin-action-arrow">
              →
            </span>
          </Link>

        </div>

      </section>

    </div>
  );
}