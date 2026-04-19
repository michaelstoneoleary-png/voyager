# Bug: Activity Timeline Bleeds Into Hotel Section

**Page:** Trip Planner (`client/src/pages/TripPlanner.tsx`)
**Severity:** Visual bug — cosmetic but distracting
**Scope:** Single-file CSS fix. No logic changes, no schema, no features touched.

---

## What's broken

On the Trip Planner itinerary view, each day's activities are rendered as a vertical list with a numbered circle marker (1, 2, 3, …) on the left and a vertical rule (line) connecting them. That timeline line is supposed to terminate at the **last activity of the day**.

Instead, the line keeps running all the way down:
- Past the last activity card
- Through the "WHERE TO STAY IN {CITY}" heading
- Into the hotel card below
- All the way to the bottom of the day's card

See `bug-screenshot.png` for a reference capture — the line and a stray empty dot are visible to the left of the "Fairbanks House Bed & Breakfast" hotel card.

---

## Why it's happening (most likely)

The timeline's vertical line is drawn using one of these patterns (inspect the rendered DOM to confirm which):

**Pattern A — a pseudo-element on a wrapping container:**
```tsx
<div className="relative ... before:absolute before:left-5 before:top-0 before:bottom-0 before:w-px before:bg-border">
  {/* activities */}
  {/* WHERE TO STAY section — ALSO INSIDE THIS WRAPPER */}
</div>
```
Because the `before:` uses `top-0 bottom-0`, it fills the entire parent — which includes the hotels.

**Pattern B — `border-left` on a container that wraps activities AND hotels:**
```tsx
<div className="border-l-2 border-dashed pl-8">
  {activities.map(...)}
  {hotels && <HotelSection />}   {/* ← inside the bordered wrapper */}
</div>
```

**Pattern C — each activity has `border-left` and a tall last item:**
Less likely here; if the gap extended only past the activities it'd look different.

### How to identify which pattern

1. Open the Trip Planner in browser with the bug visible
2. Right-click the vertical line in the hotel area → Inspect
3. Find the element responsible for the line. It will either be:
   - A `<div>` ancestor with `border-l-*` Tailwind classes
   - A `<div>` with a `::before` pseudo-element in DevTools' Styles panel
4. Walk up the tree until you find the wrapper that contains **both** the activities and the hotel section. That's the bug.

---

## The fix

**Principle:** the timeline line must only span the activity list, not the full day block.

### Option 1 — Wrap just the activities (preferred)

Split the day block into two sibling containers. Only the activities container gets the timeline decoration.

```tsx
{/* Day block */}
<section className="...">
  {/* ACTIVITIES — timeline lives here */}
  <div className="relative pl-8
                  before:absolute before:left-[11px] before:top-2 before:bottom-2
                  before:w-px before:bg-border">
    {day.activities.map((a, i) => (
      <ActivityRow key={i} activity={a} index={i} />
    ))}
  </div>

  {/* HOTELS — sibling, no timeline */}
  {journey.days !== 1 && day.hotels?.length > 0 && (
    <div className="mt-8">
      <h3>WHERE TO STAY IN {day.location}</h3>
      {/* … */}
    </div>
  )}
</section>
```

Key details:
- The timeline wrapper uses `relative` + a `::before` pseudo (or `border-l`) scoped to itself only
- `top-2 bottom-2` (or a small px value) gives the line a little breathing room at each end so it starts/ends near the first/last dots, not against the container edges
- The hotel block is a **sibling**, not a child of the timeline wrapper

### Option 2 — Keep the wrapper but terminate the line manually

If refactoring the wrapper is risky, force the line to stop at the last activity:

```tsx
<div className="relative">
  {day.activities.map((a, i) => (
    <div
      key={i}
      className={`relative pl-8 pb-6
                  ${i < day.activities.length - 1
                    ? "before:absolute before:left-[11px] before:top-4 before:bottom-0 before:w-px before:bg-border"
                    : ""}`}
    >
      {/* … */}
    </div>
  ))}

  {/* Hotels below — unaffected */}
  {day.hotels?.length > 0 && <HotelSection hotels={day.hotels} />}
</div>
```

Here the line is drawn **per activity** (top-of-row to bottom-of-row), and the **last** activity is opted out. The line visually ends at the last dot. The outer `<div>` has no line of its own.

---

## Also check — the stray "empty dot" above the hotel section

In the screenshot there's a small hollow circle sitting between the last activity and the "WHERE TO STAY" heading. That's almost certainly a **numbered-dot stub** being rendered one extra time, or a decorative bullet on the hotel heading that was intended differently.

If that circle is part of the hotel heading decoration, remove it — there's already a `<BedDouble />` icon next to "WHERE TO STAY" that does that job.

If it's a phantom activity row (e.g. an `activities.length + 1` off-by-one), trace the map and confirm `day.activities` doesn't include an empty sentinel entry.

---

## Acceptance criteria

- [ ] Activity timeline line starts at (or just above) the first activity dot
- [ ] Activity timeline line ends at (or just below) the last activity dot
- [ ] No line or dot is visible in the "WHERE TO STAY" section
- [ ] No line or dot is visible between the last activity and the hotel section
- [ ] Works for days with 1, 2, 5, and 10+ activities
- [ ] Works for days with 0 hotels (single-day trips) — no regression
- [ ] No regression in the day-switcher ribbon at the top (Fri Apr 24 / Sat Apr 25 tabs)

---

## Where to look

Primary file:
- `client/src/pages/TripPlanner.tsx`

Search within that file for whichever is present:
- `border-l` / `border-l-2` / `border-l-dashed`
- `before:absolute` combined with `before:left-` and `before:bottom-`
- A wrapper around `day.activities.map` and the hotels block
- The string "WHERE TO STAY" (the h3/section label that follows the activity list)

The activity row markup will have the numbered circle (a `<div>` with a rounded background and the activity index). The fix sits in the relationship between the numbered-circle decoration, the connecting line, and the hotel section that follows.

---

## Notes for implementation

- Don't touch activity data or mutations. This is purely markup/CSS.
- Don't change the day-tab switcher at the top of the itinerary.
- Don't change the hotel card component itself — only its position in the DOM relative to the timeline decoration.
- Commit message suggestion:
  > `fix(trip-planner): terminate activity timeline at last activity (was bleeding into hotel section)`
