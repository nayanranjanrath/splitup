import "./AiLoader.css";

export default function AiLoader({
  label = "AI is verifying your proof images",
}) {
  return (
    <div
      className="ai-loader"
      role="status"
      aria-live="polite"
    >
      <div className="ai-loader-spinner" aria-hidden="true"></div>

      <p className="ai-loader-label">
        {label}
        <span className="ai-loader-dots" aria-hidden="true"></span>
      </p>
    </div>
  );
}