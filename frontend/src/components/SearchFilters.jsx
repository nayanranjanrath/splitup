import DualRange from "./DualRange.jsx";
import CategoryPicker from "./CategoryPicker.jsx";

export const PRICE_MAX = 2000;
export const MEMBER_MAX = 12;

/**
 * Friendly filter set shared by home + search pages.
 * value = { categoryid, minprice, maxprice, minmember, maxmember,
 *           planvalidityday, slots }  (all strings, "" = unset)
 */
export default function SearchFilters({ value, onPatch, onToggleCat }) {
  const cats = (value.categoryid || "").split(",").filter(Boolean);
  const pLow = value.minprice ? Number(value.minprice) : 0;
  const pHigh = value.maxprice ? Number(value.maxprice) : PRICE_MAX;
  const mLow = value.minmember ? Number(value.minmember) : 0;
  const mHigh = value.maxmember ? Number(value.maxmember) : MEMBER_MAX;

  return (
    <div className="sfilters">
      <CategoryPicker selectedIds={cats} onToggle={onToggleCat} />

      <div className="sfilter-block">
        <label>Price</label>
        <DualRange
          min={0}
          max={PRICE_MAX}
          step={10}
          low={pLow}
          high={pHigh}
          onLow={(v) => onPatch("minprice", v <= 0 ? "" : String(v))}
          onHigh={(v) => onPatch("maxprice", v >= PRICE_MAX ? "" : String(v))}
          format={(v) => `₹${v}`}
        />
      </div>

      <div className="sfilter-block">
        <label>Members</label>
        <DualRange
          min={0}
          max={MEMBER_MAX}
          step={1}
          low={mLow}
          high={mHigh}
          onLow={(v) => onPatch("minmember", v <= 0 ? "" : String(v))}
          onHigh={(v) => onPatch("maxmember", v >= MEMBER_MAX ? "" : String(v))}
        />
      </div>

      <div className="sfilter-compact">
        <div className="field">
          <label htmlFor="f-validity">Validity (days)</label>
          <input
            id="f-validity"
            type="number"
            min="1"
            value={value.planvalidityday || ""}
            onChange={(e) => onPatch("planvalidityday", e.target.value)}
            placeholder="Any"
          />
        </div>
        <div className="field">
          <label htmlFor="f-slots">Slots</label>
          <input
            id="f-slots"
            type="number"
            min="1"
            value={value.slots || ""}
            onChange={(e) => onPatch("slots", e.target.value)}
            placeholder="Any"
          />
        </div>
      </div>
    </div>
  );
}
