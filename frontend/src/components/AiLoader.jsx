import { useEffect, useRef } from "react";
import { AI_SVG, AI_SCRIPT } from "./ailoader-assets.js";

/**
 * AI-verification loader:
 * Robot shuttling the proof image between folders
 * with a progress bar.
 */
export default function AiLoader({
  label = "AI is verifying your proof images…",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;

    if (!root) return;

    try {
      // Run the animation inside this specific loader instance.
      const run = new Function(AI_SCRIPT);
      run(root);
    } catch (error) {
      console.error("AI loader animation failed:", error);
    }
  }, []);

  return (
    <div className="ai-loader" role="status" aria-live="polite">
      <div
        className="ai-loader-svg"
        ref={ref}
        dangerouslySetInnerHTML={{ __html: AI_SVG }}
      />

      <p className="ai-loader-label">{label}</p>
    </div>
  );
}