import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppFrame from "../components/AppFrame.jsx";
import Reveal from "../components/Reveal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { countUnseenFinal, showAllGroups } from "../lib/api.js";

const HEX24 = /^[0-9a-fA-F]{24}$/;

function getObjectId(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const id = value.trim();
    return HEX24.test(id) ? id : null;
  }

  if (typeof value === "object") {
    const id = value._id ?? value.id;
    if (!id) return null;
    return getObjectId(String(id));
  }

  return null;
}

export default function GroupsPage() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState(null);
  const [unseen, setUnseen] = useState({});
  const [next, setNext] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  async function load(cursor = null) {
    const d = await showAllGroups(cursor).catch((error) => {
      console.error("Failed to load groups:", error);
      return null;
    });

    if (!d) return [];

    const list = Array.isArray(d)
      ? d
      : d.finalgroups || d.groups || d.allgroups || d.data || [];

    setHasMore(Boolean(d.hasMore));
    setNext(d.nextCursor ?? null);

    return Array.isArray(list) ? list : [];
  }

  async function countFor(list) {
    const counts = {};

    await Promise.all(
      list.map(async (group) => {
        const id = getObjectId(group?._id ?? group?.id);

        if (!id) {
          console.warn("Skipping final unseen count: invalid group ID", group);
          return;
        }

        console.debug("COUNT FINAL UNSEEN:", id);

        try {
          const data = await countUnseenFinal(id);
          const raw = data?.message;
          const count =
            typeof raw === "number" ? raw : Number.parseInt(raw, 10);

          counts[id] = Number.isFinite(count) ? count : 0;
        } catch (error) {
          console.error("Failed to get final unseen count:", {
            groupId: id,
            error,
          });
          counts[id] = 0;
        }
      })
    );

    return counts;
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      const list = await load(null);

      if (!alive) return;

      console.debug(
        "USER GROUPS LOADED:",
        list.map((group) => getObjectId(group?._id ?? group?.id))
      );

      setGroups(list);

      const counts = await countFor(list);

      if (!alive) return;
      setUnseen(counts);
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function more() {
    if (!next || loadingMore) return;

    setLoadingMore(true);

    try {
      const list = await load(next);
      const counts = await countFor(list);

      setGroups((previous) => [...(previous || []), ...list]);
      setUnseen((previous) => ({ ...previous, ...counts }));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <AppFrame>
      <Reveal>
        <span className="eyebrow">Your circles</span>
        <h1 className="home-hello">My groups</h1>
      </Reveal>

      <Reveal variant="blur" delay={120}>
        <p className="home-sub">
          All the groups you are a member of. Open one to chat.
        </p>
      </Reveal>

      {groups === null ? (
        <div className="req-grid">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : groups.length === 0 ? (
        <p className="sec-empty">
          No groups yet — create a split and grow it into a group.
        </p>
      ) : (
        <>
          <div className="req-grid">
            {groups.map((group, index) => {
              const id = getObjectId(group?._id ?? group?.id);
              if (!id) return null;

              const count = unseen[id] || 0;
              const members = Array.isArray(group?.members)
                ? group.members
                : [];
              const adminId = getObjectId(group?.admin);

              return (
                <Reveal
                  key={id}
                  variant="zoom"
                  delay={(index % 3) * 90}
                  className="req-card discuss-card"
                >
                  <button
                    type="button"
                    className="discuss-open"
                    onClick={() => {
                      const state = {
                        groupname: group?.groupname || "Group",
                        memberCount: members.length,
                        adminId,
                        avatar: group?.avatar || "",
                        members,
                      };

                      try {
                        sessionStorage.setItem(
                          `splitup-chatmeta:${id}`,
                          JSON.stringify(state)
                        );
                      } catch {
                        // Ignore sessionStorage errors/private mode.
                      }

                      navigate(`/groupchat/${id}`, { state });
                    }}
                  >
                    <div className="req-top">
                      <img
                        className="req-logo discuss-ava"
                        src={group?.avatar || "/default-group.svg"}
                        alt=""
                      />

                      <div>
                        <h3>{group?.groupname || "Group"}</h3>
                        <p className="discuss-by">
                          {members.length} member{members.length === 1 ? "" : "s"}
                          {group?.createdAt
                            ? ` · since ${new Date(group.createdAt).toLocaleDateString(
                                undefined,
                                { month: "short", year: "numeric" }
                              )}`
                            : ""}
                        </p>
                      </div>

                      {count > 0 && (
                        <span className="unseen-badge">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {hasMore && next && (
            <div className="pagi">
              <button type="button" onClick={more} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more groups"}
              </button>
            </div>
          )}
        </>
      )}
    </AppFrame>
  );
}
