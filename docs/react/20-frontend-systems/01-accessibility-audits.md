# Accessibility Audits

Accessibility work is best treated as product quality work, not a last-minute compliance pass.

---

## What an Audit Looks For

- keyboard access
- semantic structure
- visible focus states
- form labels and errors
- color contrast
- screen reader announcements

---

## Fast Audit Pass

### 1. Keyboard-only test

Can you:

- tab through the page
- open menus
- submit forms
- dismiss modals

### 2. Inspect semantics

Check headings, landmarks, button vs link usage, and proper label associations.

### 3. Run automated tooling

Use axe, Lighthouse, or browser accessibility tooling to catch obvious problems.

Automation is helpful, but it does not replace manual checks.

---

## Common Failures

- clickable `div`s instead of buttons
- no focus ring
- placeholder used instead of label
- modal without focus trap
- icon-only button without accessible name

---

## Interview Answer

### How do you audit accessibility?

Start with keyboard navigation and semantic HTML, then use automated tools like axe to catch common issues, and finally test the most important journeys manually with screen-reader and focus management in mind. Accessibility auditing is a mix of tooling and human workflow checks.
