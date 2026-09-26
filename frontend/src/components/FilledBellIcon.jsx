import { forwardRef, useCallback, useImperativeHandle } from "react";
import { motion, useAnimate } from "motion/react";

/**
 * Animated filled bell (rebuilt from the itshover registry item, whose
 * shipped SVG markup was incomplete): bell swings + clapper follows on
 * startAnimation(), settles on stopAnimation().
 */
const FilledBellIcon = forwardRef(
  ({ size = 24, color = "currentColor", className = "" }, ref) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(() => {
      animate(
        ".bell",
        { rotate: [0, -8, 6, -4, 2, 0] },
        { duration: 0.6, ease: "easeInOut" }
      );
      animate(
        ".below-circle",
        { rotate: [0, 20, -18, 12, -6, 0] },
        { duration: 0.6, ease: "easeInOut", delay: 0.05 }
      );
    }, [animate]);

    const stop = useCallback(() => {
      animate(".bell, .below-circle", { rotate: 0 }, { duration: 0.2, ease: "easeInOut" });
    }, [animate]);

    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));

    return (
      <span ref={scope} className={className} style={{ display: "inline-flex" }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <motion.path
            className="bell"
            style={{ originX: "50%", originY: "8%" }}
            d="M12 2.5c-3.9 0-6.8 3-6.8 6.9 0 3-1 4.9-1.9 6-.5.7 0 1.6.8 1.6h15.8c.8 0 1.3-.9.8-1.6-.9-1.1-1.9-3-1.9-6 0-3.9-2.9-6.9-6.8-6.9Z"
            fill={color}
          />
          <motion.path
            className="below-circle"
            style={{ originX: "50%", originY: "0%" }}
            d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }
);

FilledBellIcon.displayName = "FilledBellIcon";
export default FilledBellIcon;
