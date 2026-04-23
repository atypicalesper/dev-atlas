# Accessibility Audits

Accessibility is not a last-minute compliance checkbox — it's **product quality**. Every accessibility bug is a real person who cannot use your product: the developer with an RSI who can't use a mouse, the designer with low vision who needs 200% zoom, the power user who lives on the keyboard. If the feature works for them, it almost always works better for everyone.

An audit's goal is not to collect a perfect axe score. It's to answer: *"Can every critical user journey be completed without a mouse, with a screen reader, at 200% zoom, under low contrast, and on a flaky network?"*

---

## What an Audit Actually Checks

Automated tools can catch maybe 30–40% of issues. The rest require human judgment. A real audit covers:

| Area | What to verify |
|---|---|
| Keyboard | Every interactive element reachable, focus visible, no traps |
| Semantics | Headings form an outline, landmarks present, controls use correct elements |
| Labels | Every input has an accessible name, errors linked via `aria-describedby` |
| Contrast | 4.5:1 for normal text, 3:1 for large text and UI components |
| Motion | Respects `prefers-reduced-motion` |
| Screen reader | Announcements make sense out of visual context |
| Focus management | Dialogs trap focus, route changes announce, focus restored on close |
| Forms | Errors announced, invalid state conveyed non-visually |

---

## The Fast Manual Pass (15 minutes)

### 1. Unplug the mouse

Tab through the page. You should be able to:

- reach every clickable element
- see a visible focus ring at every step
- open menus with `Enter` / `Space`
- close dialogs with `Escape`
- submit forms without touching the mouse

If `Tab` skips over a button or you lose track of where focus is, that's a P1 bug.

### 2. Zoom to 200%

Does the layout break? Is any content clipped or hidden? WCAG requires content to reflow without loss at 200%.

### 3. Run automated tooling

Axe DevTools, Lighthouse, or WAVE. Expect false positives and missed issues — treat results as *candidates*, not verdicts.

### 4. Screen reader spot-check

macOS: `Cmd+F5` for VoiceOver. Windows: NVDA (free). Navigate the most important screen and ask: "Would I know what this page is for? Can I complete the main task?"

---

## Concrete Example: the Icon Button Trap

The single most common a11y failure in React codebases:

```tsx
// Broken: no accessible name, just a div with a click handler
<div onClick={onDelete} className="icon-btn">
  <TrashIcon />
</div>
```

Problems: not focusable, not announceable, not keyboard-activatable, wrong element. The fix:

```tsx
<button
  type="button"
  onClick={onDelete}
  aria-label="Delete item"
  className="icon-btn"
>
  <TrashIcon aria-hidden="true" />
</button>
```

- `<button>` → keyboard + focus + semantics for free
- `aria-label` → screen reader announces "Delete item, button"
- `aria-hidden` on the icon → no duplicate announcement
- `type="button"` → prevents accidental form submit

---

## Concrete Example: Dialog Focus Management

```tsx
function Dialog({ open, onClose, children }) {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    contentRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" tabIndex={-1} ref={contentRef}>
      {children}
    </div>
  );
}
```

Opens → moves focus in. Closes → restores focus to trigger. Escape works. Screen readers announce "dialog".

---

## Common Failures (the usual suspects)

- Clickable `<div>` instead of `<button>` — breaks keyboard and screen readers at once
- No visible focus ring (`outline: none` without a replacement)
- Placeholder used as label — disappears on type, low contrast, no label semantics
- Modal without focus trap — keyboard users tab into the background page
- Icon-only button without `aria-label`
- Toast notifications not announced (missing `role="status"` or `role="alert"`)
- Color alone indicating state (red border for error, no icon or text)
- Dropdown built from `<div>`s that doesn't implement the combobox keyboard pattern
- Headings used for styling (`<h2>` chosen because it "looks right") instead of structure

---

## What Automation Catches vs Misses

| Axe/Lighthouse catches | Humans must catch |
|---|---|
| Missing `alt` attributes | Whether the alt text is *meaningful* |
| Color contrast ratios | Whether color is the only differentiator |
| Missing labels | Whether the label makes sense |
| ARIA role validity | Whether the role is correctly applied |
| Duplicate IDs | Focus management correctness |
| Document language | Screen reader experience of a full flow |

---

## Interview / Trick Questions

### 1. How would you audit a page you've never seen before for accessibility?

Start with a 5-minute keyboard-only pass. Then run axe to catch low-hanging fruit. Then pick the most important user journey and walk through it with a screen reader. Finally zoom to 200% to check reflow. Report by severity: broken flows first, style issues last.

### 2. Trick: your axe score is 100. Are you accessible?

No. Axe checks what machines can verify — missing labels, contrast, duplicate IDs. It cannot check whether your "Submit" button actually does what a screen-reader user expects, whether focus management on route changes makes sense, or whether the flow is usable at all. A 100 score is necessary, not sufficient.

### 3. Why is placeholder-as-label wrong?

Three reasons: (1) it disappears the moment the user types, so they lose context; (2) placeholder text is typically low-contrast and fails WCAG; (3) placeholders aren't programmatically associated as labels, so screen readers may skip them. Always use a real `<label>`.

### 4. How do you make a custom dropdown accessible?

Either use a native `<select>` (boringly correct), or implement the WAI-ARIA combobox pattern in full: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, arrow-key navigation, escape to close, type-ahead. Do not half-implement it — a partial combobox is worse than a native select.

### 5. Trick: you added `aria-label="Close"` to a button that also has visible text "Close". What happens?

The `aria-label` *overrides* the visible text for assistive tech. Usually harmless here, but if the label drifts from the visible text, screen reader users and sighted users experience different apps. Rule: use `aria-label` only when there is no visible text. Otherwise rely on the visible label.

### 6. A user reports that after closing a modal, their focus is at the top of the page. What's broken?

Focus restoration. When a dialog opens, save `document.activeElement`. When it closes, call `.focus()` on that saved element. Without this, keyboard users get teleported and lose their place.

### 7. When does `role="alert"` vs `role="status"` matter?

`role="alert"` interrupts the user — use for errors and critical notices. `role="status"` announces politely without interrupting — use for success toasts or background updates. Using `alert` for everything trains users (and screen readers) to ignore them.
