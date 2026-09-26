import { useEffect, useRef, useState } from "react";
import { getCategories } from "../lib/api.js";

const catName = (c) =>
  c?.categoryname || c?.categoryName || c?.name || c?.category || c?.title || "";

/**
 * "Category" filter — opens a small popup listing every category from
 * /showallcategory (cursor-paginated, "Load more"). Multi-select: each
 * ticked category's id is added to the categoryid field (comma-joined).
 */
export default function CategoryPicker({ selectedIds, onToggle }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [next, setNext] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const loadedRef = useRef(false);

  async function load(cursor) {
    setLoading(true);
    try {
      const d = await getCategories(cursor);
      const items = d?.allcategory || d?.categories || d?.data || [];
      setList((prev) => (cursor ? [...prev, ...items] : items));
      setHasMore(Boolean(d?.hasMore));
      setNext(d?.nextCursor ?? null);
      loadedRef.current = true;
    } catch {
      setList([]);
      setHasMore(false);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open && !loadedRef.current) load(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="catpick" ref={wrapRef}>
      <button
        type="button"
        className={`filter-toggle ${selectedIds.length ? "on" : ""} ${open ? "on" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 5h16M4 12h16M4 19h16" opacity=".45" />
          <circle cx="9" cy="5" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="7" cy="19" r="2.2" fill="currentColor" stroke="none" />
        </svg>
        Category
        {selectedIds.length > 0 && <span className="cat-count">{selectedIds.length}</span>}
      </button>

      {open && (
        <div className="catpop" role="dialog" aria-label="Categories">
          <p className="catpop-title">Pick categories</p>
          <div className="catpop-list">
            {list.length === 0 && !loading && (
              <p className="notif-empty">No categories found.</p>
            )}
            {list.map((c) => {
              const id = c?._id || c?.id || "";
              const on = selectedIds.includes(id);
              return (
                <label className={`cat-item ${on ? "on" : ""}`} key={id}>
                  <input type="checkbox" checked={on} onChange={() => onToggle(id)} />
                  <span>{catName(c) || "Category"}</span>
                </label>
              );
            })}
            {loading && <p className="notif-empty">Loading…</p>}
          </div>
          {hasMore && next && (
            <button type="button" className="loadmore" onClick={() => load(next)} disabled={loading}>
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
