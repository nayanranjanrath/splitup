import { useEffect, useState } from "react";
import AppFrame from "../components/AppFrame.jsx";
import Reveal from "../components/Reveal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import ApplicantsModal from "../components/ApplicantsModal.jsx";
import RequestDetailsModal from "../components/RequestDetailsModal.jsx";
import { RequestCard, ApplyCard } from "./HomePage.jsx";
import {
  getMyRequests,
  getMyApplies,
  deleteRequest,
  showRequestStatus,
} from "../lib/api.js";

const asList = (v) => (Array.isArray(v) ? v : []);

const parseRequests = (d) =>
  asList(
    Array.isArray(d)
      ? d
      : d?.requests || d?.myrequest || d?.list || d?.results || d?.data
  );

const parseApplies = (d) =>
  asList(
    Array.isArray(d)
      ? d
      : d?.requests || d?.applies || d?.applications || d?.myapply || d?.list || d?.results || d?.data
  );

/** /my-requests — every split request the user created */
export function MyRequestsListPage() {
  const [requests, setRequests] = useState(null);
  const [err, setErr] = useState("");
  const [applicantsFor, setApplicantsFor] = useState(null);

  useEffect(() => {
    let alive = true;
    getMyRequests()
      .then((d) => alive && setRequests(parseRequests(d)))
      .catch((e) => {
        if (!alive) return;
        setRequests([]);
        setErr(e?.message || "");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppFrame>
      <Reveal>
        <span className="eyebrow">Everything you published</span>
        <h1 className="home-hello">Your split requests</h1>
      </Reveal>
      <Reveal variant="blur" delay={120}>
        <p className="home-sub">All of your requests — manage applicants, details and deletions.</p>
      </Reveal>

      <div className="req-grid" style={{ marginTop: 28 }}>
        {requests === null ? (
          [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : requests.length === 0 ? (
          <p className="sec-empty">
            No split requests yet — create one and start sharing.
            {err ? ` ⚠ ${err}` : ""}
          </p>
        ) : (
          requests.map((r, i) => (
            <RequestCard
              key={r?._id || i}
              r={r}
              delay={(i % 3) * 100}
              onApplicants={setApplicantsFor}
              onDelete={(id) => setRequests((p) => (p || []).filter((x) => x._id !== id))}
            />
          ))
        )}
      </div>

      {applicantsFor && (
        <ApplicantsModal requestid={applicantsFor} onClose={() => setApplicantsFor(null)} />
      )}
    </AppFrame>
  );
}

/** /applied — every request the user applied to, with live status */
export function AppliedListPage() {
  const [applies, setApplies] = useState(null);
  const [err, setErr] = useState("");
  const [statusMap, setStatusMap] = useState({});
  const [detailsFor, setDetailsFor] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let list = [];
      try {
        list = parseApplies(await getMyApplies());
        if (alive) setApplies(list);
      } catch (e) {
        if (!alive) return;
        setApplies([]);
        setErr(e?.message || "");
        return;
      }
      // live status (accepted / pending / …) for each application
      const ids = [
        ...new Set(list.map((a) => a?.request?._id || a?.request).filter(Boolean)),
      ];
      if (!ids.length) return;
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const s = await showRequestStatus(id);
            return [id, (s?.status || "").toLowerCase()];
          } catch {
            return [id, ""];
          }
        })
      );
      if (alive) setStatusMap(Object.fromEntries(entries.filter(([, v]) => v)));
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppFrame>
      <Reveal>
        <span className="eyebrow">Your applications</span>
        <h1 className="home-hello">Where you've applied</h1>
      </Reveal>
      <Reveal variant="blur" delay={120}>
        <p className="home-sub">
          Every split you asked to join, with its current status — accepted or still pending.
        </p>
      </Reveal>

      <div className="req-grid" style={{ marginTop: 28 }}>
        {applies === null ? (
          [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : applies.length === 0 ? (
          <p className="sec-empty">
            You haven't applied to any group yet.
            {err ? ` ⚠ ${err}` : ""}
          </p>
        ) : (
          applies.map((a, i) => (
            <ApplyCard
              key={a?._id || i}
              a={a}
              delay={(i % 3) * 100}
              status={statusMap[a?.request?._id || a?.request]}
              onDetails={setDetailsFor}
            />
          ))
        )}
      </div>

      {detailsFor && (
        <RequestDetailsModal requestid={detailsFor} onClose={() => setDetailsFor(null)} />
      )}
    </AppFrame>
  );
}
