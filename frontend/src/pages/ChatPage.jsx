import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import AppFrame from "../components/AppFrame.jsx";
import { GroupDetailsModal, AddPlanModal } from "../components/GroupModals.jsx";
import QrcodeIcon from "../components/QrcodeIcon.jsx";
import UserLink from "../components/UserLink.jsx";
import PlatformLogo from "../components/PlatformLogo.jsx";
import { DefaultAvatar } from "../components/UserChip.jsx";
import {
  API_URL, apiFetch, avatarSrc, MAX_OID,
  unseenFinalMessages, unseenTempMessages, oldFinalMessages, oldTempMessages,
  sendPaymentProof, showAllProofImages, approveUser, rejectUser,
  showAllAdminGroups, addNewGroup, addMembers, addFinalGroupAvatar,
  deleteGroupRequest, acceptDeleteRequest, rejectDeleteRequest, showDeleteRequest,
  showUpiId, showRequestDetails, getRequestMembers,
} from "../lib/api.js";
import { getCachedProfile, getProfileById } from "../lib/userCache.js";

/**
 * Chat — mirrors the backend exactly.
 *
 * IDs: temp chats have TWO ids — the request id (platformsharerequestmodel._id)
 * and the tempChat id (tempChatModel._id). ALL frontend calls use the
 * REQUEST ID; the backend resolves the tempChat internally.
 *
 * REST (limit 30, messages come back oldest → newest):
 *   temp  : GET /getunsceentempgroupmessaeg/:requestid  (cursor optional)
 *           GET /showoldmessageoftempgroup/:requestid   (cursor OPTIONAL —
 *           no cursor = latest 30, cursor = older; NEVER use a fake id)
 *   final : GET /getunsceenfinalgroupmessaeg/:groupid   (cursor optional)
 *           GET /showoldmessage/:groupid                (cursor REQUIRED —
 *           MAX_OID is used as anchor when nothing is unseen)
 *
 * Sockets:
 *   temp  : "join-room"       {requestId} · "send-message"       {message}
 *   final : "join-finalchat"  {groupid}   · "send-final-message" {message}
 *   both  : "receive-message" (carries _id — use it for dedupe),
 *           "message-error", "joined-room"
 *
 * Load strategy:
 *   temp  : 1) showoldmessage (no cursor) → latest 30  2) socket joins in
 *           parallel  3) unseen pages merged/deduped by _id
 *   final : unseen pages first (follow nextCursor), then one older-context
 *           page anchored on the oldest unseen _id (or MAX_OID).
 * Last-seen is handled by the backend on socket disconnect — nothing to do.
 */
const CFG = {
  temp: {
    unseen: unseenTempMessages,
    old: oldTempMessages,
    oldRequiresCursor: false, // no cursor → latest 30
    join: "join-room",
    joinPayload: (id) => ({ requestId: id }),
    send: "send-message",
    back: "/discuss",
  },
  final: {
    unseen: unseenFinalMessages,
    old: oldFinalMessages,
    oldRequiresCursor: true, // backend still 400s without a cursor
    join: "join-finalchat",
    joinPayload: (id) => ({ groupid: id }),
    send: "send-final-message",
    back: "/groups",
  },
};

let seq = 0;
const nextKey = () => `local-${++seq}`;

/** Normalize REST + socket messages into one shape. */
function normalizeMsg(m, meId) {
  const isObj = m.sender && typeof m.sender === "object";
  const senderId = isObj
    ? m.sender._id || m.sender.id || ""
    : typeof m.sender === "string"
      ? m.sender
      : "";
  return {
    key: m._id || nextKey(),
    _id: m._id || null,
    senderId,
    senderName: isObj ? m.sender.profilename || "" : "",
    senderAvatar: isObj ? m.sender.avatar || "" : "",
    text: m.message ?? m.text ?? "",
    at: m.createdAt || m.time || new Date().toISOString(),
    own: Boolean(senderId && meId && senderId === meId),
    pending: false,
    failed: false,
  };
}

const timeOf = (at) =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dayOf = (at) => new Date(at).toDateString();
const dayLabel = (at) => {
  const d = new Date(at);
  const today = new Date();
  const yest = new Date(Date.now() - 864e5);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

/* Merge chat messages, dedupe by backend _id (ObjectIds sort chronologically),
 * keeping local pending stubs (no _id) at the end. Safe to run repeatedly. */
function mergeById(prev, incoming) {
  const map = new Map();
  for (const m of [...prev, ...incoming]) if (m._id) map.set(m._id, m);
  const ordered = [...map.values()].sort((a, b) => (a._id < b._id ? -1 : 1));
  const seenKeys = new Set();
  const locals = [];
  for (const m of [...prev, ...incoming]) {
    if (!m._id && !seenKeys.has(m.key)) {
      seenKeys.add(m.key);
      locals.push(m);
    }
  }
  return [...ordered, ...locals];
}

function friendlyHistoryError(e) {
  return /not a member|not allowed/i.test(e?.message || "")
    ? "History could not be loaded for your role on this chat — live messages below still work."
    : e?.message || "Could not load the chat history.";
}

const HEX24 = /^[0-9a-fA-F]{24}$/;

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return "";
}

function isValidObjectId(value) {
  return HEX24.test(normalizeId(value));
}

/* Pull the user ID from the payment-proof object without accidentally using
 * a request/group/platform ID. */
function extractUserId(obj) {
  if (!obj) return null;

  const candidates = [
    obj.candidate,
    obj.applicant,
    obj.user,
    obj.sender,
    obj.member,
    obj.userid,
    obj.userId,
    obj.paidby,
    obj.paidBy,
  ];

  for (const value of candidates) {
    const id = normalizeId(value);
    if (HEX24.test(id)) return id;
  }

  return null;
}

/* Resolves a sender (REST history only carries the id) */
function useSenderProfile(m) {
  const [prof, setProf] = useState(null);
  useEffect(() => {
    if (!m.senderId || m.senderName || m.senderAvatar) return;
    let alive = true;
    getProfileById(m.senderId).then((p) => alive && setProf(p)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [m.senderId, m.senderName, m.senderAvatar]);
  return prof;
}

function Bubble({ m }) {
  const prof = useSenderProfile(m);
  const name = m.own ? "you" : m.senderName || prof?.profilename || "member";
  const ava = m.senderAvatar || prof?.avatar || "";
  return (
    <div className={`chat-bubble ${m.own ? "own" : ""} ${m.failed ? "failed" : ""}`}>
      <p>{m.text}</p>
      <span className="chat-meta">
        {ava ? (
          <img className="chat-ava" src={avatarSrc(ava)} alt="" />
        ) : (
          <span className="chat-ava"><DefaultAvatar /></span>
        )}
        {m.senderId && !m.own ? (
          <Link to={`/profile/${m.senderId}`}>
            <b>{name}</b>
          </Link>
        ) : (
          <b>{name}</b>
        )}
        <i>{timeOf(m.at)}</i>
        {m.pending && <i className="pend">…</i>}
        {m.failed && <i className="fail">⚠ not sent</i>}
      </span>
    </div>
  );
}

/* Member chips — accepts populated user objects OR bare ids */
function MemberChip({ m }) {
  const id = typeof m === "string" ? m : m?._id || m?.id;
  const [prof, setProf] = useState(typeof m === "object" ? m : null);
  useEffect(() => {
    if (!id || typeof m === "object") return;
    let alive = true;
    getProfileById(id)
      .then((p) => alive && setProf({ _id: id, profilename: p?.profilename, avatar: p?.avatar }))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const name = prof?.profilename || "member";
  return (
    <Link to={`/profile/${id}`} className="member-chip" title={`View ${name}'s profile`}>
      {prof?.avatar ? <img src={avatarSrc(prof.avatar)} alt="" /> : <DefaultAvatar />}
      <span>{name}</span>
    </Link>
  );
}

/* ── group picker shown after the requester approves a proof ─────────
 * Lists the admin's EXISTING final groups (/showalladmingroups →
 * `finalgroups`, cursor-paginated) so a paid user can join one of them,
 * or creates a new group (optionally with an avatar) via /addnewgroup —
 * which now returns the created group — then /addfinalgroupavatar.
 */
function GroupPickerModal({ candidate, requestid, onClose, onDone }) {
  const [groups, setGroups] = useState(null);
  const [sel, setSel] = useState(null);
  const [useNew, setUseNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [avaFile, setAvaFile] = useState(null);
  const [avaPrev, setAvaPrev] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [next, setNext] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const avaRef = useRef(null);

  async function load(cursor, append) {
    try {
      const d = await showAllAdminGroups(cursor);
      const list = d?.finalgroups || d?.groups || d?.allgroups || [];

      setGroups((g) => (append ? [...(g || []), ...list] : list));
      setNext(d?.nextCursor ?? null);
      setHasMore(Boolean(d?.hasMore));
    } catch (e) {
      setGroups((g) => (g === null ? [] : g));
      setMsg(e?.message || "Could not load your groups.");
    }
  }

  useEffect(() => {
    load(null, false);
  }, []);

  async function more() {
    if (!next || loadingMore) return;
    setLoadingMore(true);
    await load(next, true);
    setLoadingMore(false);
  }

  function pickAva(f) {
    setAvaFile(f || null);
    setAvaPrev(f ? URL.createObjectURL(f) : "");
  }

  async function confirm() {
    setBusy(true);
    setMsg("");

    try {
      const safeCandidate = normalizeId(candidate);
      const safeRequestId = normalizeId(requestid);

      if (!isValidObjectId(safeCandidate)) {
        throw new Error("Applicant ID is missing or invalid.");
      }

      if (!isValidObjectId(safeRequestId)) {
        throw new Error("Request ID is missing or invalid.");
      }

      let gid = useNew ? null : normalizeId(sel);

      if (useNew) {
        if (!newName.trim()) {
          throw new Error("Give the new group a name.");
        }

        const d = await addNewGroup(newName.trim());

        // Prefer the ID returned by the backend.
        gid =
          normalizeId(d?.group) ||
          normalizeId(d?.newgroup) ||
          normalizeId(d);

        // Compatibility fallback for an older addnewgroup response.
        if (!isValidObjectId(gid)) {
          const rd = await showAllAdminGroups();
          const matches = (rd?.finalgroups || []).filter(
            (g) => g?.groupname === newName.trim()
          );
          const hit = matches.length > 0
            ? matches[matches.length - 1]
            : null;
          gid = normalizeId(hit);
        }

        if (!isValidObjectId(gid)) {
          throw new Error(
            d?.message || "Could not create the group."
          );
        }

        if (avaFile) {
          await addFinalGroupAvatar(gid, avaFile);
        }
      }

      if (!isValidObjectId(gid)) {
        throw new Error("Select a group or create a new one.");
      }

      console.log("ADD MEMBERS PAYLOAD:", {
        groupid: gid,
        candidate: safeCandidate,
        requestid: safeRequestId
      });

      await addMembers({
        groupid: gid,
        candidate: safeCandidate,
        requestid: safeRequestId
      });

      onDone?.();
      onClose();

    } catch (e) {
      setMsg(e?.message || "Could not add the member.");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="modal-veil" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-label="Choose group">
        <div className="modal-head">
          <h3>Add member to a group</h3>
          <button className="toast-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="gpicker-note">
          Add them to one of your existing groups, or create a new one for this split.
        </p>

        <div className="gpicker-list">
          {groups === null && <p className="notif-empty">Loading your groups…</p>}
          {groups !== null && groups.length === 0 && (
            <p className="notif-empty">No groups yet — create one below.</p>
          )}
          {groups?.map((g) => {
            const id = normalizeId(g);
            return (
              <label key={id} className={`radio-row ${!useNew && sel === id ? "on" : ""}`}>
                <input
                  type="radio"
                  name="group-pick"
                  checked={!useNew && sel === id}
                  onChange={() => {
                    setSel(id);
                    setUseNew(false);
                  }}
                />
                <img
                  className="gpicker-ava"
                  src={g?.avatar || "/default-group.svg"}
                  alt=""
                />
                <span>{g?.groupname || "Group"}</span>
                <i className="gpicker-count">{g?.members?.length || 1} member{(g?.members?.length || 1) === 1 ? "" : "s"}</i>
              </label>
            );
          })}
          {hasMore && next && (
            <button type="button" className="loadmore" onClick={more} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more groups"}
            </button>
          )}
        </div>

        <div className="or">or create a new group</div>
        <div className="cat-new gpicker-new">
          <input
            value={newName}
            maxLength={30}
            placeholder="New group name"
            onChange={(e) => {
              setNewName(e.target.value);
              if (e.target.value.trim()) setUseNew(true);
            }}
            onFocus={() => newName.trim() && setUseNew(true)}
            aria-label="New group name"
          />
          <button
            type="button"
            className={`ava-pick ${avaPrev ? "has" : ""}`}
            onClick={() => avaRef.current?.click()}
            title="Choose a group avatar (optional)"
          >
            {avaPrev ? <img src={avaPrev} alt="avatar preview" /> : <span>＋ avatar</span>}
          </button>
          <input
            ref={avaRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickAva(e.target.files?.[0])}
          />
        </div>
        {useNew && (
          <p className="gpicker-hint">
            The avatar is optional — you can also add it later from the group chat.
          </p>
        )}

        {msg && <p className="rate-msg err">{msg}</p>}
        <button type="button" className="pill" onClick={confirm} disabled={busy}>
          <span>{busy ? "Adding…" : "Add member"}</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

function ChatView({ kind }) {
  const { groupid } = useParams();
  const location = useLocation();
  const routeId = normalizeId(groupid);

  const stored = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem(`splitup-chatmeta:${routeId}`) || "null"
      );
    } catch {
      return null;
    }
  })();

  const [meta, setMeta] = useState(location.state || stored || {});
  useEffect(() => {
    setMeta(location.state || stored || {});
  }, [routeId, kind]);
  const cfg = CFG[kind];
  const navigate = useNavigate();
  const isTemp = kind === "temp";

  /* Temp route ID = platform share request ID.
     Final route ID = finalChatModel ID. */
  const chatKey = normalizeId(
    isTemp
      ? meta.requestId || meta.requestid || routeId
      : routeId
  );

  const meRef = useRef({ id: "", name: "", avatar: "" });
  const [meId, setMeId] = useState("");
  const [meName, setMeName] = useState("");

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready
  const [loadErr, setLoadErr] = useState("");
  const [oldMore, setOldMore] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [sockErr, setSockErr] = useState("");
  const [joined, setJoined] = useState(false);
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const adjustRef = useRef(false);
  const prevScrollRef = useRef(null);
  const socketRef = useRef(null);
  const [firstPaint, setFirstPaint] = useState(true);

  /* temp-chat extras */
  const requestId = isTemp ? chatKey : null;
  const requesterId = normalizeId(meta.requesterId || meta.requester);
  const adminId = normalizeId(meta.adminId || meta.admin);
  const isRequester = isTemp && Boolean(requesterId) && requesterId === meId;

  const [proofFile, setProofFile] = useState(null);
  const [proofStatus, setProofStatus] = useState("");
  const proofRef = useRef(null);

  const [proofs, setProofs] = useState(null);
  const [showProofs, setShowProofs] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [applicants, setApplicants] = useState(null);
  const [paidFor, setPaidFor] = useState(null);
  const [pickFor, setPickFor] = useState(null);
  const [pickDone, setPickDone] = useState(false);
  const [toast, setToast] = useState("");
  const [zoomProof, setZoomProof] = useState(null);

  /* final-group extras */
  const isAdmin = kind === "final" && Boolean(adminId) && adminId === meId;
  const [groupAva, setGroupAva] = useState(meta.avatar || "");
  const [uploadingAva, setUploadingAva] = useState(false);
  const avaInputRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [deleteReq, setDeleteReq] = useState(null);
  const deleteChecked = useRef(false);
  const [showUpi, setShowUpi] = useState(false);
  const [upi, setUpi] = useState(null);
  const [upiErr, setUpiErr] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  /* ── identity, then history ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getCachedProfile(true);
        if (!alive) return;
        meRef.current = { id: p?.id || "", name: p?.profilename || "", avatar: p?.avatar || "" };
        setMeId(p?.id || "");
        setMeName(p?.profilename || "");
      } catch {
        /* chat still loads */
      }
      if (!alive) return;

      setStatus("loading");
      setLoadErr("");
      setItems([]);
      setOldMore(null);

      if (!isValidObjectId(chatKey)) {
        if (alive) {
          setLoadErr("Chat ID is missing or invalid.");
          setStatus("ready");
        }
        return;
      }

      let more = null;
      let historyOk = true;

      /* helper: all unseen pages (follow nextCursor while hasMore) */
      const fetchUnseenPages = async () => {
        let acc = [];
        let cursor = null;
        let hasMore = false;
        let pages = 0;
        do {
          const d = await cfg.unseen(chatKey, cursor);
          if (!alive) return null;
          acc = acc.concat((d?.messages || []).map((m) => normalizeMsg(m, meRef.current.id)));
          hasMore = Boolean(d?.hasMore);
          cursor = d?.nextCursor || null;
          pages += 1;
        } while (hasMore && cursor && pages < 8);
        return acc;
      };

      if (!cfg.oldRequiresCursor) {
        /* TEMP — backend-recommended flow:
           1) showoldmessage with NO cursor → latest 30 messages
           2) socket joins in parallel (separate effect)
           3) unseen pages merged in, deduped by _id (covers the case where
              unseen messages go deeper than the latest-30 window) */
        try {
          const d = await cfg.old(chatKey);
          if (!alive) return;
          const base = (d?.messages || []).map((m) => normalizeMsg(m, meRef.current.id));
          more = d?.hasMore ? d?.nextCursor || null : null;

          let unseen = [];
          try {
            unseen = (await fetchUnseenPages()) || [];
          } catch {
            /* unseen is a bonus — live messages still work without it */
          }
          if (!alive) return;
          setItems((prev) => mergeById(prev, [...base, ...unseen]));
          setOldMore(more);
        } catch (e) {
          historyOk = false;
          if (alive) setLoadErr(friendlyHistoryError(e));
        }
      } else {
        /* FINAL — /showoldmessage requires a cursor.
           Fetch unseen first, then fetch an older context page.
           If unseen fails, still try the older page with MAX_OID so the chat
           can show history instead of becoming completely empty. */
        let unseen = [];

        try {
          unseen = (await fetchUnseenPages()) || [];
        } catch (e) {
          historyOk = false;
          if (alive) setLoadErr(friendlyHistoryError(e));
        }

        let older = [];

        const anchor =
          unseen.length && isValidObjectId(unseen[0]._id)
            ? unseen[0]._id
            : MAX_OID;

        try {
          const d = await cfg.old(chatKey, anchor);
          if (!alive) return;

          older = (d?.messages || []).map((m) =>
            normalizeMsg(m, meRef.current.id)
          );

          more = d?.hasMore ? d?.nextCursor || null : null;

        } catch (e) {
          if (alive && historyOk) {
            setLoadErr(friendlyHistoryError(e));
          }
          more = null;
        }

        if (!alive) return;

        setItems((prev) =>
          mergeById(prev, [...older, ...unseen])
        );

        setOldMore(more);
      }

      if (!alive) return;
      setStatus("ready");
      setFirstPaint(true);
      stickRef.current = true;
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exact-deps
  }, [chatKey, kind]);

  /* ── direct-load fallback: recover group meta from /showalladmingroups ── */
  useEffect(() => {
    if (kind !== "final") return;
    if (meta.groupname && adminId && (meta.avatar || groupAva)) return;

    let alive = true;
    showAllAdminGroups()
      .then((d) => {
        if (!alive) return;
        const g = (d?.finalgroups || []).find((x) => normalizeId(x) === routeId);
        if (g) {
          setMeta((m) => ({
            ...m,
            groupname: g.groupname || m.groupname,
            adminId: m.adminId || normalizeId(g.admin),
            avatar: g.avatar || m.avatar,
            members: m.members || g.members,
            memberCount: m.memberCount ?? g.members?.length,
          }));
          if (g.avatar) setGroupAva(g.avatar);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, groupid]);

  /* ── socket: join + live messages ── */
  useEffect(() => {
    let alive = true;

    if (!isValidObjectId(chatKey)) {
      setJoined(false);
      setSockErr("Chat ID is missing or invalid.");
      return () => {
        alive = false;
      };
    }

    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (!alive) return;
      setJoined(false);
      setSockErr("");
      socket.emit(cfg.join, cfg.joinPayload(chatKey));
    });
    socket.on("joined-room", () => alive && setJoined(true));
    socket.on("disconnect", () => alive && setJoined(false));
    socket.on("connect_error", () => {
      if (alive) setSockErr("Could not reach the chat server — reconnecting…");
    });
    socket.on("message-error", (e) => {
      if (!alive) return;
      setSockErr(e?.message || "Chat error");
      setItems((prev) => prev.map((m) => (m.pending ? { ...m, pending: false, failed: true } : m)));
    });
    socket.on("receive-message", (m) => {
      if (!alive) return;
      const nm = normalizeMsg(m, meRef.current.id);
      setItems((prev) => {
        // backend now includes _id on emits — use it for dedupe
        if (nm._id && prev.some((x) => x._id === nm._id)) return prev;
        if (nm.own) {
          // settle our optimistic stub (match by text, then take the real _id)
          const idx = prev.findIndex((x) => x.pending && x.text === nm.text);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...nm, key: nm._id || copy[idx].key };
            return copy;
          }
        }
        return [...prev, nm];
      });
    });

    return () => {
      alive = false;
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatKey, kind]);

  /* sweep stale pending stubs → failed */
  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (m.pending && m.bornAt && Date.now() - m.bornAt > 12000) {
            changed = true;
            return { ...m, pending: false, failed: true };
          }
          return m;
        });
        return changed ? next : prev;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  /* ── scrolling ── */
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (adjustRef.current && prevScrollRef.current) {
      // keep the viewport steady after prepending older messages
      const { height, top } = prevScrollRef.current;
      el.scrollTop = el.scrollHeight - height + top;
      adjustRef.current = false;
      prevScrollRef.current = null;
      return;
    }
    if (stickRef.current || firstPaint) {
      el.scrollTop = el.scrollHeight;
      if (firstPaint) setFirstPaint(false);
    }
  }, [items]);

  function onListScroll() {
    const el = listRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }

  async function loadOlder() {
    if (!oldMore || loadingOlder) return;
    setLoadingOlder(true);
    const d = await cfg.old(chatKey, oldMore).catch(() => null);
    if (d) {
      const batch = (d?.messages || []).map((m) => normalizeMsg(m, meRef.current.id));
      const el = listRef.current;
      if (el) prevScrollRef.current = { height: el.scrollHeight, top: el.scrollTop };
      adjustRef.current = true;
      setItems((prev) => {
        const have = new Set(prev.filter((m) => m._id).map((m) => m._id));
        const fresh = batch.filter((m) => !m._id || !have.has(m._id));
        return [...fresh, ...prev];
      });
      setOldMore(d?.hasMore ? d?.nextCursor || null : null);
    }
    setLoadingOlder(false);
  }

  function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t || t.length > 1000) return;
    const socket = socketRef.current;
    if (!socket?.connected) {
      setSockErr("Still connecting to the chat server…");
      return;
    }
    setSockErr("");
    const stub = {
      key: nextKey(),
      _id: null,
      senderId: meRef.current.id,
      senderName: meRef.current.name,
      senderAvatar: meRef.current.avatar,
      text: t,
      at: new Date().toISOString(),
      own: true,
      pending: true,
      failed: false,
      bornAt: Date.now(),
    };
    setItems((prev) => [...prev, stub]);
    stickRef.current = true;
    socket.emit(cfg.send, { message: t });
    setText("");
  }

  /* ── temp: payment proof (member) ── */
  async function sendProof() {
    if (!proofFile) {
      setProofStatus("Choose an image first.");
      return;
    }

    if (!isValidObjectId(requestId)) {
      setProofStatus("Request ID is missing or invalid.");
      return;
    }
    setProofStatus("");
    const fd = new FormData();
    fd.append("proofimage", proofFile);
    fd.append("requestid", requestId);
    try {
      await sendPaymentProof(fd);
      setProofStatus("Payment proof sent — waiting for the requester to verify ✓");
      setProofFile(null);
    } catch (e2) {
      setProofStatus(e2.message || "Could not send the proof.");
    }
  }

  /* ── temp: proofs list (requester) ── */
  async function loadProofs() {
    if (!isValidObjectId(requestId)) {
      setProofs([]);
      return;
    }

    const d = await showAllProofImages(requestId).catch((error) => {
      console.error("Failed to load payment proofs:", error);
      return null;
    });

    const list = Array.isArray(d?.data)
      ? d.data
      : Array.isArray(d?.payment)
        ? d.payment
        : [];

    // Prefer pending proofs when backend returns status. If status is absent,
    // keep the record because the endpoint currently returns user + URLs.
    setProofs(
      list.filter((p) => !(p?.status && /approved|rejected/i.test(p.status)))
    );
  }

  useEffect(() => {
    if (isRequester && showProofs && proofs === null) loadProofs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequester, showProofs]);

  /* Current members of the platform-share request. These are the only users
   * that /addmembers is allowed to move into a final group. */
  async function loadPaidCandidates() {
    if (!isValidObjectId(requestId)) {
      setApplicants([]);
      return;
    }

    try {
      const d = await getRequestMembers(requestId);
      const list = Array.isArray(d?.members) ? d.members : [];
      setApplicants(list.map((member) => ({ member })));
    } catch (error) {
      console.error("Failed to load request members:", error);
      setApplicants([]);
    }
  }

  async function reject(proof) {
    const paymentproofid = normalizeId(
      proof?.paymentproofid || proof?._id || proof?.paymentProofId
    );

    if (!isValidObjectId(paymentproofid)) {
      setToast(
        "Payment proof ID is missing. Return paymentproofid from showallproofimage."
      );
      return;
    }

    try {
      await rejectUser(paymentproofid);
      setToast("Proof rejected.");
      await loadProofs();
    } catch (e) {
      setToast(e?.message || "Could not reject.");
    }
  }

  /* ── temp: requester UPI popover ── */
  async function openUpi() {
    const v = !showUpi;
    setShowUpi(v);
    setCopiedUpi(false);

    if (v && upi === null && !upiErr) {
      if (!isValidObjectId(requesterId)) {
        setUpi("");
        setUpiErr("Requester ID is missing.");
        return;
      }

      try {
        const d = await showUpiId(requesterId);
        setUpi(d?.seller?.upiid || d?.upiid || "");
      } catch (e) {
        setUpi("");
        setUpiErr(e?.message || "No UPI id available.");
      }
    }
  }

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(upi || "");
      setCopiedUpi(true);
    } catch {
      setCopiedUpi(false);
    }
  }

  /* ── final: pending delete-request check ── */
  useEffect(() => {
    deleteChecked.current = false;

    if (kind !== "final") return;

    deleteChecked.current = true;
    let alive = true;
    showDeleteRequest(routeId)
      .then((d) => {
        if (!alive) return;
        const none = !d || /no |not |none/i.test(d?.message || "");
        setDeleteReq(none ? null : d);
      })
      .catch(() => alive && setDeleteReq(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, groupid]);

  async function raiseDeleteReq() {
    try {
      await deleteGroupRequest(routeId);
      setDeleteReq({ raised: true });
    } catch (e) {
      setToast(e.message || "Could not raise the delete request.");
    }
  }

  async function acceptDel() {
    try {
      await acceptDeleteRequest(routeId);
      navigate("/groups");
    } catch (e) {
      setToast(e.message || "Could not accept.");
    }
  }

  async function rejectDel() {
    try {
      await rejectDeleteRequest(routeId);
      setDeleteReq(null);
      setToast("Delete request rejected.");
    } catch (e) {
      setToast(e.message || "Could not reject.");
    }
  }

  /* ── final: admin adds the group avatar (only when none exists) ── */
  const canEditAva = kind === "final" && isAdmin && !groupAva && !uploadingAva;

  async function onAvaFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";

    if (!f) return;

    if (!isValidObjectId(routeId)) {
      setToast("Group ID is missing or invalid.");
      return;
    }

    setUploadingAva(true);
    setToast("");
    try {
      const d = await addFinalGroupAvatar(routeId, f);
      const url = d?.avatar || d?.secure_url || d?.url || URL.createObjectURL(f);
      setGroupAva(url);
      setMeta((m) => ({ ...m, avatar: url }));
      try {
        const cur = JSON.parse(sessionStorage.getItem(`splitup-chatmeta:${routeId}`) || "{}");
        sessionStorage.setItem(
          `splitup-chatmeta:${routeId}`,
          JSON.stringify({ ...cur, avatar: url })
        );
      } catch {
        /* ignore */
      }
      setToast("Group avatar updated ✓");
    } catch (e2) {
      setToast(e2.message || "Could not upload the avatar.");
    }
    setUploadingAva(false);
  }

  const proofUrls = (p) => {
    if (typeof p === "string") return [p];
    if (Array.isArray(p?.urls)) return p.urls.filter(Boolean);
    const one =
      p?.url ||
      p?.image ||
      p?.proofimage?.url ||
      p?.proofimage ||
      "";
    return one ? [one] : [];
  };

  const proofUrl = (p) => proofUrls(p)[0] || "";

  const candidateOf = (p) => extractUserId(p);

  const members = Array.isArray(meta.members) ? meta.members.slice(0, 8) : [];
  const title = isTemp ? meta.platform || meta.groupname || "Discussion" : meta.groupname || "Group chat";

  return (
    <AppFrame>
      <div className="chat-shell">
        <div className="chat-head">
          <Link to={cfg.back} className="chat-back" aria-label="Back">
            ←
          </Link>

          {/* header avatar: temp → platform logo · final → group avatar */}
          {isTemp ? (
            <span className="chat-head-ava" aria-hidden="true">
              {meta.platformImage ? (
                <img src={meta.platformImage} alt="" />
              ) : (
                <PlatformLogo pid={normalizeId(meta.platformId) || undefined} name={meta.platform} size={42} />
              )}
            </span>
          ) : (
            <>
              <button
                type="button"
                className={`chat-head-ava ${canEditAva ? "editable" : ""}`}
                onClick={canEditAva ? () => avaInputRef.current?.click() : undefined}
                title={canEditAva ? "Add a group avatar" : ""}
                aria-label={canEditAva ? "Add a group avatar" : "Group avatar"}
              >
                <img src={groupAva || "/default-group.svg"} alt="" />
                {canEditAva && <span className="ava-edit">{uploadingAva ? "…" : "📷"}</span>}
              </button>
              <input ref={avaInputRef} type="file" accept="image/*" hidden onChange={onAvaFile} />
            </>
          )}

          <div>
            <span className="chat-title-row">
              <h2 style={{ margin: 0 }}>{title}</h2>
              {isTemp && meta.requesterId && (
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <button
                    type="button"
                    className="qr-btn"
                    onClick={openUpi}
                    title="Requester's UPI id"
                    aria-label="Requester's UPI id"
                  >
                    <QrcodeIcon size={16} />
                  </button>
                  {showUpi && (
                    <span className="upi-pop" role="dialog" aria-label="Requester UPI">
                      <p className="rate-sub" style={{ margin: 0 }}>Pay the requester</p>
                      {upiErr ? (
                        <p className="rate-msg err">{upiErr}</p>
                      ) : upi ? (
                        <p className="upi-line">
                          <code>{upi}</code>
                          <button type="button" className="copy-btn" onClick={copyUpi}>
                            {copiedUpi ? "copied ✓" : "copy"}
                          </button>
                        </p>
                      ) : (
                        <p className="notif-empty">Loading…</p>
                      )}
                    </span>
                  )}
                </span>
              )}
            </span>
            {isTemp && meta.requester && <p className="discuss-by">by {meta.requester}</p>}
            {!isTemp && meta.memberCount != null && (
              <p className="discuss-by">{meta.memberCount} members</p>
            )}
            <p className={`chat-status ${joined ? "on" : ""}`}>
              {joined ? "● live" : "○ connecting…"}
            </p>
          </div>

          {members.length > 0 && (
            <div className="chat-members">
              {members.map((m, i) => (
                <MemberChip key={i} m={m} />
              ))}
            </div>
          )}
        </div>

        {/* subtle 7-day notice for temp chats */}
        {isTemp && (
          <p className="chat-alert">
            ⏳ Messages in this temp chat are deleted after 7 days — older messages will
            disappear.
          </p>
        )}

        {/* payment proof strip */}
        {isTemp && requestId && (
          <div className="proof-strip">
            {isRequester ? (
              <button
                type="button"
                className="filter-toggle"
                onClick={() => setShowProofs((v) => !v)}
              >
                💳 Payment proofs {proofs ? `(${proofs.length})` : ""}
              </button>
            ) : (
              <>
                <button type="button" className="filter-toggle" onClick={() => proofRef.current?.click()}>
                  🧾 Upload payment proof
                </button>
                <input
                  ref={proofRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    setProofFile(e.target.files?.[0] || null);
                    e.target.value = "";
                  }}
                />
                {proofFile && (
                  <button type="button" className="pill proof-send" onClick={sendProof}>
                    <span>Send proof</span>
                  </button>
                )}
              </>
            )}
            {proofStatus && <span className="proof-status">{proofStatus}</span>}
          </div>
        )}

        {/* requester: approve paid user */}
        {isTemp && isRequester && (
          <div className="proof-strip" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="filter-toggle"
              onClick={() => {
                setShowPaid((v) => !v);
                if (!applicants) loadPaidCandidates();
              }}
            >
              ⚡ Approve paid user
            </button>
          </div>
        )}

        {isTemp && isRequester && showPaid && (
          <div className="proofs-panel">
            <p className="paid-panel-hint">
              Pick the member who paid — they'll be moved into one of your final groups.
            </p>
            {applicants === null ? (
              <p className="notif-empty">Loading members…</p>
            ) : applicants.length === 0 ? (
              <p className="notif-empty">No members in this chat yet — accept applicants first.</p>
            ) : (
              applicants.map((a, i) => {
                const m = a?.member;
                const mid = normalizeId(m) || null;
                return (
                  <div className="applicant-row" key={mid || i}>
                    <MemberChip m={m} />
                    <button
                      type="button"
                      className="mini-btn ok"
                      style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}
                      disabled={!mid}
                      onClick={() => {
                        if (!isValidObjectId(mid)) {
                          setToast("Member ID is missing or invalid.");
                          return;
                        }
                        setPaidFor({ candidate: mid });
                      }}
                    >
                      Add to group
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {paidFor && (
          <GroupPickerModal
            candidate={paidFor.candidate}
            requestid={requestId}
            onClose={() => setPaidFor(null)}
            onDone={async () => {
              setToast("Member added to the group ✓");
              await loadPaidCandidates();
              await loadProofs();
              setPaidFor(null);
            }}
          />
        )}

        {isTemp && isRequester && showProofs && (
          <div className="proofs-panel">
            {proofs === null ? (
              <p className="notif-empty">Loading proofs…</p>
            ) : proofs.length === 0 ? (
              <p className="notif-empty">No payment proofs yet.</p>
            ) : (
              proofs.map((p, i) => {
                const senderObj =
                  p?.user && typeof p.user === "object"
                    ? p.user
                    : null;
                const proofId = normalizeId(
                  p?.paymentproofid || p?._id || p?.paymentProofId
                );
                const urls = proofUrls(p);

                return (
                  <div className="proof-item" key={proofId || senderObj?._id || i}>
                    {senderObj && (
                      <p className="proof-sender">
                        <UserLink
                          user={senderObj}
                          name={senderObj?.profilename || "user"}
                        />
                      </p>
                    )}

                    {urls.length > 0 ? (
                      urls.map((url, urlIndex) => (
                        <img
                          key={`${proofId || i}-${urlIndex}`}
                          src={url || "/default-platform.png"}
                          alt={`Payment proof ${urlIndex + 1}`}
                          className="proof-zoomable"
                          title="Click to zoom"
                          onClick={() => setZoomProof(url)}
                        />
                      ))
                    ) : (
                      <img
                        src="/default-platform.png"
                        alt="Payment proof unavailable"
                        className="proof-zoomable"
                      />
                    )}
                    <div className="proof-item-actions">
                      <button
                        type="button"
                        className="mini-btn ok"
                        title="Approve"
                        onClick={() => {
                          const candidate = normalizeId(p?.user);
                          const paymentproofid = normalizeId(
                            p?.paymentproofid || p?._id || p?.paymentProofId
                          );

                          console.log("OPEN GROUP PICKER:", {
                            proof: p,
                            candidate,
                            paymentproofid,
                            requestId
                          });

                          if (!isValidObjectId(candidate)) {
                            setToast(
                              "Could not find the user who submitted this payment proof."
                            );
                            return;
                          }

                          if (!isValidObjectId(paymentproofid)) {
                            setToast(
                              "Payment proof ID is missing. Return paymentproofid from showallproofimage."
                            );
                            return;
                          }

                          if (!isValidObjectId(requestId)) {
                            setToast("Request ID is missing or invalid.");
                            return;
                          }

                          setPickDone(false);
                          setPickFor({
                            proof: p,
                            candidate,
                            paymentproofid
                          });
                        }}
                      >
                        ✓
                      </button>
                      <button type="button" className="mini-btn bad" title="Reject" onClick={() => reject(p)}>
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {toast && <p className="rate-msg ok">{toast}</p>}
          </div>
        )}

        {/* final group tools */}
        {kind === "final" && (
          <div className="chat-tools">
            <button type="button" className="filter-toggle" onClick={() => setShowDetails(true)}>
              📋 Show details
            </button>
            {isAdmin && (
              <button type="button" className="filter-toggle" onClick={() => setShowAddPlan(true)}>
                ➕ Add plan
              </button>
            )}
            {isAdmin && !deleteReq && (
              <button type="button" className="filter-toggle danger" onClick={raiseDeleteReq}>
                🗑 Delete group request
              </button>
            )}
          </div>
        )}

        {kind === "final" && deleteReq && (
          <div className="delreq-alert" role="alert">
            <span>⚠ A request to delete this group has been raised.</span>
            {!isAdmin ? (
              <span className="delreq-actions">
                <button type="button" className="mini-btn ok" onClick={acceptDel}>
                  Accept
                </button>
                <button type="button" className="mini-btn bad" onClick={rejectDel}>
                  Reject
                </button>
              </span>
            ) : (
              <span className="proof-status">Waiting for members' decision…</span>
            )}
          </div>
        )}

        {(sockErr || loadErr) && (
          <p className="chat-note err">⚠ {sockErr || loadErr}</p>
        )}
        {toast && kind === "final" && <p className="chat-note">✓ {toast}</p>}

        <div className="chat-list" ref={listRef} onScroll={onListScroll} aria-live="polite">
          {oldMore && (
            <button type="button" className="loadmore chat-older" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? "Loading…" : "Load older messages"}
            </button>
          )}
          {status === "loading" && <p className="notif-empty">Loading messages…</p>}
          {status === "ready" && items.length === 0 && (
            <p className="notif-empty">No messages yet — say hi 👋</p>
          )}
          {items.map((m, i) => {
            const prevDay = i > 0 ? dayOf(items[i - 1].at) : null;
            return (
              <div key={m.key} className="chat-line">
                {prevDay !== dayOf(m.at) && <span className="day-div">{dayLabel(m.at)}</span>}
                <Bubble m={m} />
              </div>
            );
          })}
        </div>

        <form className="chat-input" onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={joined ? "Message the group… (max 1000)" : "Connecting to chat…"}
            aria-label="Message"
            maxLength={1000}
          />
          <button type="submit" className="pill">
            <span>Send</span>
          </button>
        </form>
      </div>

      {pickFor && (
        <GroupPickerModal
          candidate={pickFor?.candidate}
          requestid={requestId}
          onClose={() => {
            const paymentproofid = normalizeId(pickFor?.paymentproofid || pickFor?.proof?.paymentproofid || pickFor?.proof?._id || pickFor?.proof?.paymentProofId);

            if (!pickDone && isValidObjectId(paymentproofid)) {
              // Abandoned picker → revert the proof so it can be approved again.
              rejectUser(paymentproofid).catch(() => {});
            }

            setPickFor(null);
          }}
          onDone={async () => {
            setPickDone(true);
            setToast("Member added to the group ✓");

            const paymentproofid = normalizeId(pickFor?.paymentproofid || pickFor?.proof?.paymentproofid || pickFor?.proof?._id || pickFor?.proof?.paymentProofId);

            if (isValidObjectId(paymentproofid)) {
              try {
                await approveUser(paymentproofid);
              } catch {
                // Keep the UI usable; the proof can be reloaded below.
              }
            }

            await loadProofs();
            setPickFor(null);
          }}
        />
      )}

      {showDetails && (
        <GroupDetailsModal
          groupid={routeId}
          isAdmin={isAdmin}
          onClose={() => setShowDetails(false)}
        />
      )}
      {showAddPlan && (
        <AddPlanModal
          groupid={routeId}
          onClose={() => setShowAddPlan(false)}
          onDone={() => setShowDetails(true)}
        />
      )}

      {/* fullscreen proof zoom */}
      {zoomProof &&
        createPortal(
          <div
            className="lightbox"
            onClick={() => setZoomProof(null)}
            role="dialog"
            aria-label="Payment proof (zoomed)"
          >
            <img src={zoomProof} alt="Payment proof" />
            <button type="button" className="toast-x lightbox-x" aria-label="Close">
              ×
            </button>
          </div>,
          document.body
        )}
    </AppFrame>
  );
}

export function TempChatPage() {
  return <ChatView kind="temp" />;
}

export function FinalChatPage() {
  return <ChatView kind="final" />;
}
