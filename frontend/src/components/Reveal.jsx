import { useEffect, useRef } from "react";

/**
 * Scroll-reveal wrapper. Variants:
 *   (default) fade-rise from below
 *   "left"   slide in from the left
 *   "right"  slide in from the right
 *   "zoom"   scale + rise into place
 *   "blur"   blur-in
 *   "draw"   horizontal line draw (for dividers / rules)
 */
export default function Reveal({ as: Tag = "div", className = "", delay = 0, variant = "", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${variant ? `r-${variant}` : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
