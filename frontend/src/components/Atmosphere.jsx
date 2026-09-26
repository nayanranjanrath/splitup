import { useEffect, useRef } from "react";

/**
 * Fixed atmospheric background behind all landing sections.
 * - Three oversized radial glows drift slowly (CSS keyframes) so the
 *   background never looks static.
 * - Each section carries a `data-theme`; an IntersectionObserver sets
 *   `body[data-theme]` and the glow colors cross-fade gradually
 *   (CSS `@property` color transitions).
 * - A faint film-grain overlay keeps large dark areas from looking flat.
 */
export default function Atmosphere() {
  const inner = useRef(null);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("[data-theme]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) document.body.dataset.theme = en.target.dataset.theme;
        });
      },
      { rootMargin: "-30% 0px -30% 0px" }
    );
    sections.forEach((s) => io.observe(s));

    // gentle scroll parallax on the glow field
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (inner.current) {
          inner.current.style.transform = `translateY(${window.scrollY * -0.045}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      delete document.body.dataset.theme;
    };
  }, []);

  return (
    <div className="atmo" aria-hidden="true">
      <div className="atmo-inner" ref={inner}>
        <div className="atmo-glow ag1" />
        <div className="atmo-glow ag2" />
        <div className="atmo-glow ag3" />
      </div>
      <div className="atmo-grain" />
    </div>
  );
}
