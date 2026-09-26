import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate } from "motion/react";

/*
 * Animated icon set (ported from the provided motion components).
 *  - BookmarkIcon   : save/bookmark button (squash on hover, fill when saved)
 *  - MessageCircleIcon : Discuss Split icon (path-draw on hover)
 */

const scaledStrokeWidth = (strokeWidth, viewBox) => strokeWidth * (24 / viewBox);

export const BookmarkIcon = forwardRef(function BookmarkIcon(
  { size = 24, color = "currentColor", strokeWidth = 2, className = "", filled = false },
  ref
) {
  const [scope, animate] = useAnimate();

  const start = async () => {
    await animate(
      ".bookmark-body",
      { scaleY: 0.9, y: 2 },
      { duration: 0.18, ease: "easeOut" }
    );
  };

  const stop = async () => {
    await animate(
      ".bookmark-body",
      { scaleY: 1, y: 0 },
      { duration: 0.18, ease: "easeInOut" }
    );
  };

  useImperativeHandle(ref, () => ({
    startAnimation: start,
    stopAnimation: stop,
  }));

  return (
    <motion.div
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      className={`inline-flex cursor-pointer ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={scaledStrokeWidth(strokeWidth, 48)}
        strokeMiterlimit="10"
        strokeLinecap="square"
      >
        <motion.path
          className="bookmark-body"
          style={{ transformOrigin: "50% 20%" }}
          fill={filled ? color : "none"}
          d="M24 34L41 44V8C41 5.23858 38.7614 3 36 3H12C9.23858 3 7 5.23858 7 8V44L24 34Z"
        />
      </svg>
    </motion.div>
  );
});

export const MessageCircleIcon = forwardRef(function MessageCircleIcon(
  { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
  ref
) {
  const [scope, animate] = useAnimate();

  const start = async () => {
    // reset first
    animate(".message-path", { pathLength: 0, opacity: 0 }, { duration: 0 });

    await animate(
      ".message-path",
      { pathLength: [0, 1], opacity: [0, 1] },
      { duration: 0.6, ease: "easeInOut" }
    );

    animate(
      ".message-path",
      { scale: [1, 1.05, 1] },
      { duration: 0.3, ease: "easeOut" }
    );
  };

  const stop = () => {
    animate(
      ".message-path",
      { pathLength: 1, opacity: 1, scale: 1 },
      { duration: 0.2 }
    );
  };

  useImperativeHandle(ref, () => ({
    startAnimation: start,
    stopAnimation: stop,
  }));

  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`cursor-pointer ${className}`}
      style={{ overflow: "visible" }}
    >
      <motion.path
        className="message-path"
        d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
        initial={{ pathLength: 1, opacity: 1 }}
        style={{ transformOrigin: "center" }}
      />
    </motion.svg>
  );
});

/* ── shared draw-on-hover behaviour for the rail icons ──────────────
 * Same feel as MessageCircleIcon: paths wipe back to zero, redraw,
 * then the whole icon gives a tiny pulse.
 */
function useDrawHover(scopeSel) {
  const [scope, animate] = useAnimate();

  const start = async () => {
    animate(scopeSel, { pathLength: 0, opacity: 0 }, { duration: 0 });
    await animate(
      scopeSel,
      { pathLength: [0, 1], opacity: [0, 1] },
      { duration: 0.55, ease: "easeInOut" }
    );
    animate(scope.current, { scale: [1, 1.06, 1] }, { duration: 0.3, ease: "easeOut" });
  };

  const stop = () => {
    animate(scopeSel, { pathLength: 1, opacity: 1 }, { duration: 0.2 });
    animate(scope.current, { scale: 1 }, { duration: 0.15 });
  };

  return { scope, start, stop };
}

export const ExploreIcon = forwardRef(function ExploreIcon(
  { size = 24, color = "currentColor", strokeWidth = 1.7, className = "" },
  ref
) {
  const { scope, start, stop } = useDrawHover(".draw-path");
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`cursor-pointer ${className}`}
      style={{ overflow: "visible" }}
    >
      <motion.circle className="draw-path" cx="12" cy="12" r="9" initial={{ pathLength: 1, opacity: 1 }} />
      <motion.path
        className="draw-path"
        d="m15.5 8.5-2.2 5-4.8 2 2.2-5 4.8-2Z"
        initial={{ pathLength: 1, opacity: 1 }}
        style={{ transformOrigin: "center" }}
      />
    </motion.svg>
  );
});

export const CreateIcon = forwardRef(function CreateIcon(
  { size = 24, color = "currentColor", strokeWidth = 1.9, className = "" },
  ref
) {
  const { scope, start, stop } = useDrawHover(".draw-path");
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={`cursor-pointer ${className}`}
      style={{ overflow: "visible" }}
    >
      <motion.path className="draw-path" d="M12 5v14" initial={{ pathLength: 1, opacity: 1 }} />
      <motion.path className="draw-path" d="M5 12h14" initial={{ pathLength: 1, opacity: 1 }} />
    </motion.svg>
  );
});

export const GroupIcon = forwardRef(function GroupIcon(
  { size = 24, color = "currentColor", strokeWidth = 1.7, className = "" },
  ref
) {
  const { scope, start, stop } = useDrawHover(".draw-path");
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={`cursor-pointer ${className}`}
      style={{ overflow: "visible" }}
    >
      <motion.circle className="draw-path" cx="9" cy="8.5" r="3.5" initial={{ pathLength: 1, opacity: 1 }} />
      <motion.path
        className="draw-path"
        d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"
        initial={{ pathLength: 1, opacity: 1 }}
      />
      <motion.path
        className="draw-path"
        d="M16 5.5a3 3 0 0 1 0 6M18.5 15.5c1.7.8 2.7 2.2 3 4.5"
        initial={{ pathLength: 1, opacity: 1 }}
      />
    </motion.svg>
  );
});

export const SearchIcon = forwardRef(function SearchIcon(
  { size = 24, color = "currentColor", strokeWidth = 1.7, className = "" },
  ref
) {
  const { scope, start, stop } = useDrawHover(".draw-path");
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
  return (
    <motion.svg
      ref={scope}
      onHoverStart={start}
      onHoverEnd={stop}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={`cursor-pointer ${className}`}
      style={{ overflow: "visible" }}
    >
      <motion.circle className="draw-path" cx="10.5" cy="10.5" r="6.5" initial={{ pathLength: 1, opacity: 1 }} />
      <motion.path className="draw-path" d="M15.5 15.5 21 21" initial={{ pathLength: 1, opacity: 1 }} />
    </motion.svg>
  );
});
