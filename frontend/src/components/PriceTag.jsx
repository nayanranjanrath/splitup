/**
 * Discount-style price display:
 *  ₹original (struck) → ₹per-person  +  -XX% savings badge
 *  ₹0 → FREE badge
 * `per` overrides the per-person price (backend perpersoncost).
 */
export default function PriceTag({ price, slots, per }) {
  const p = Number(price);
  const n = Math.max(1, Number(slots) || 1);
  if (!Number.isFinite(p) || price === "" || price == null) return <span>—</span>;
  if (p === 0) {
    return (
      <span className="price-wrap">
        <span className="free-badge">FREE</span>
      </span>
    );
  }
  const perPerson =
    per != null && per !== "" && Number.isFinite(Number(per))
      ? Math.ceil(Number(per))
      : Math.ceil(p / n);
  const pct = Math.round((1 - 1 / n) * 100);
  return (
    <span className="price-wrap">
      <s className="price-old">₹{p}</s>
      <strong className="price-per">₹{perPerson}</strong>
      {pct > 0 && <span className="save-badge">-{pct}%</span>}
    </span>
  );
}
