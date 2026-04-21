# Forms at Scale

Small forms are easy. Large product forms become systems problems.

Issues show up around:

- validation
- async submission
- partial save
- field dependencies
- accessibility
- performance

---

## What Breaks First

- duplicated validation logic across client and server
- hard-to-follow conditional fields
- rerender storms in very large forms
- error messages that do not map cleanly to fields

---

## Useful Practices

- keep validation rules centralized
- separate field components from business-specific form flows
- preserve user input on failure
- make server errors map back to field-level UI
- autosave only when the UX clearly supports it

---

## Interview Answer

### What changes when forms get large?

The challenge stops being "how do I render inputs" and becomes "how do I manage validation, dependencies, performance, accessibility, and recovery from failure across many fields and workflows." Treat form state and validation as first-class architecture.
