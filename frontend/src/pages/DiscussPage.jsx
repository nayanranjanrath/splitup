import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppFrame from "../components/AppFrame.jsx";
import Reveal from "../components/Reveal.jsx";
import PlatformLogo from "../components/PlatformLogo.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { apiFetch } from "../lib/api.js";

const platText = (p) =>
  typeof p === "object"
    ? p?.platformname || p?.name || ""
    : p || "";

const HEX24 = /^[0-9a-fA-F]{24}$/;

function getObjectId(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return HEX24.test(value) ? value : null;
  }

  if (typeof value === "object") {
    const id = value._id ?? value.id;
    return id ? getObjectId(String(id)) : null;
  }

  return null;
}

/**
 * Discuss Split — temporary chats.
 *
 * IMPORTANT:
 * - /showallgroup returns temp-chat entries.
 * - Temp REST APIs require the PLATFORM SHARE REQUEST ID.
 * - tempChatModel._id must never be used as requestid.
 * - /chat/:requestid also uses the platform share request ID.
 */
export default function DiscussPage() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState(null);
  const [unseen, setUnseen] = useState({});

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const d = await apiFetch("/showallgroup");
        const list = Array.isArray(d)
          ? d
          : d?.groups || d?.data || [];

        if (!alive) return;
        setGroups(list);

        const counts = {};

        await Promise.all(
          list.map(async (g) => {
            const groupKey = getObjectId(g?._id || g?.id);

            // The request ID must come from g.request.
            const requestId = getObjectId(g?.request);

            if (!requestId) {
              console.warn(
                "Skipping unseen count: platform request ID is missing",
                g
              );
              return;
            }

            try {
              const u = await apiFetch(
                `/numberofunsceenmsgintempgroup/${requestId}`
              );

              const n =
                typeof u?.message === "number"
                  ? u.message
                  : Number.parseInt(u?.message, 10);

              if (groupKey) {
                counts[groupKey] = Number.isFinite(n) ? n : 0;
              }
            } catch (error) {
              console.error(
                "Failed to get temp unseen count:",
                {
                  requestId,
                  error,
                }
              );

              if (groupKey) counts[groupKey] = 0;
            }
          })
        );

        if (alive) setUnseen(counts);
      } catch (error) {
        console.error("Failed to load discussion groups:", error);
        if (alive) setGroups([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppFrame>
      <Reveal>
        <span className="eyebrow">Group chat</span>
        <h1 className="home-hello">Discuss splits</h1>
      </Reveal>

      <Reveal variant="blur" delay={120}>
        <p className="home-sub">
          Pick a group and catch up — the badge shows how many messages you
          haven't seen yet.
        </p>
      </Reveal>

      {groups === null ? (
        <div className="req-grid">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="sec-empty">
          No discussion groups yet — join a split to start chatting.
        </p>
      ) : (
        <div className="req-grid">
          {groups.map((g, i) => {
            const groupKey = getObjectId(g?._id || g?.id);
            const req =
              g?.request && typeof g.request === "object"
                ? g.request
                : {};

            // This is the ONLY ID used for temp-chat API calls/navigation.
            const requestId = getObjectId(g?.request);

            const platObj =
              req?.platformname && typeof req.platformname === "object"
                ? req.platformname
                : null;

            const plat = platText(req?.platformname);
            const platId = getObjectId(req?.platformname);
            const requesterId = getObjectId(req?.requister);
            const by = req?.requister?.profilename || "unknown";
            const n = groupKey ? unseen[groupKey] || 0 : 0;
            const status = (req?.status || "open").toLowerCase();

            return (
              <Reveal
                key={groupKey || `group-${i}`}
                variant="zoom"
                delay={(i % 3) * 90}
                className="req-card discuss-card"
              >
                <button
                  type="button"
                  className="discuss-open"
                  disabled={!requestId}
                  onClick={() => {
                    if (!requestId) {
                      console.error(
                        "Cannot open temp chat: request ID is missing",
                        g
                      );
                      return;
                    }

                    const state = {
                      platform: plat,
                      requester: by,
                      members: Array.isArray(req?.members)
                        ? req.members
                        : [],
                      requestId,
                      requesterId,
                      platformId: platId,
                      platformImage: platObj?.platformimage || "",
                    };

                    try {
                      sessionStorage.setItem(
                        `splitup-chatmeta:${requestId}`,
                        JSON.stringify(state)
                      );
                    } catch {
                      // Ignore sessionStorage errors/private mode.
                    }

                    navigate(`/chat/${requestId}`, { state });
                  }}
                >
                  <div className="req-top">
                    {platObj?.platformimage ? (
                      <img
                        className="req-logo discuss-ava"
                        src={platObj.platformimage}
                        alt={plat || "platform"}
                      />
                    ) : (
                      <PlatformLogo
                        pid={platId}
                        name={plat}
                        size={46}
                        className="discuss-ava"
                      />
                    )}

                    <div>
                      <h3>{plat || "Group"}</h3>
                      <p className="discuss-by">
                        by{" "}
                        {requesterId ? (
                          <Link
                            to={`/profile/${requesterId}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {by}
                          </Link>
                        ) : (
                          by
                        )}
                      </p>
                    </div>

                    {n > 0 && (
                      <span className="unseen-badge">
                        {n > 99 ? "99+" : n}
                      </span>
                    )}
                  </div>

                  <div className="req-mid">
                    <span>
                      {(req?.members?.length || 0) + 1} in chat
                    </span>
                    <i>·</i>
                    <span className={`status-pill s-${status}`}>
                      {status}
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      )}
    </AppFrame>
  );
}
