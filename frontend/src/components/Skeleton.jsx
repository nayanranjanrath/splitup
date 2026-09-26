/** Shimmer skeleton primitives for lists/cards without a dedicated loader. */
export function Skeleton({ h = 14, w = "100%", r = 8, style }) {
  return (
    <span
      className="sk"
      style={{ height: h, width: w, borderRadius: r, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="sk-card" aria-hidden="true">
      <div style={{ display: "flex", gap: 12 }}>
        <Skeleton h={46} w={46} r={12} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton h={16} w="55%" />
          <Skeleton h={11} w="35%" />
        </div>
      </div>
      <Skeleton h={12} w="70%" />
      <Skeleton h={12} w="45%" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="sk-card" aria-hidden="true">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Skeleton h={34} w={34} r={17} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <Skeleton h={13} w="60%" />
          <Skeleton h={10} w="40%" />
        </div>
      </div>
    </div>
  );
}
