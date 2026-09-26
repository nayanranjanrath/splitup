import { Fragment, useEffect, useRef } from "react";

/**
 * Word-stagger mask reveal: each word rises out of an overflow-hidden
 * mask with a staggered delay. Use for big headings.
 *
 *   <Words text="One line heading" />
 *   <Words lines={["First line", "Second line"]} />
 */
export default function Words({
  text,
  lines,
  as: Tag = "h2",
  className = "",
  delay = 0,
  step = 70,
  threshold = 0.4,
}) {
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
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  let wordIndex = 0;
  const renderLine = (line) =>
    line.split(" ").map((w) => {
      const i = wordIndex++;
      return (
        <Fragment key={i}>
          <span className="w">
            <span className="wi" style={{ transitionDelay: `${delay + i * step}ms` }}>
              {w}
            </span>
          </span>{" "}
        </Fragment>
      );
    });

  return (
    <Tag ref={ref} className={`words ${className}`}>
      {lines ? lines.map((l, i) => <span className="wl" key={i}>{renderLine(l)}</span>) : renderLine(text)}
    </Tag>
  );
}
