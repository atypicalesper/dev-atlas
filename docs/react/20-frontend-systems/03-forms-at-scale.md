# Forms at Scale

A form with three fields is a UI problem. A form with forty fields, branching logic, async validation, multi-step flow, and server errors that must map back to individual inputs is a **systems problem**. The shift happens silently — one day you're adding a field, the next day you're debugging why every keystroke rerenders 200 components.

The hard parts aren't the inputs. They are: **validation topology, render performance, field dependencies, error recovery, accessibility, and partial save semantics.**

---

## What Actually Breaks First

Failures almost always show up in this order:

1. **Duplicated validation** — the same rule drifts on client vs server. Submissions pass the client check and fail the server one, or vice versa.
2. **Rerender storms** — every keystroke on one field rerenders the entire form, including 30 unrelated controls. Feels fine at 10 fields, unusable at 50.
3. **Conditional field logic spaghetti** — "if `employmentType === 'self-employed'` show `businessName` unless `country === 'US'` and `state === 'CA'`" in a single if-else tree nobody dares touch.
4. **Server errors that don't map to fields** — API returns `{ error: "Invalid" }`, user sees a red banner with no indication of *which* field to fix.
5. **Lost input on failure** — submit fails, component unmounts, user retypes everything.

---

## Architecture Choices

### Controlled vs uncontrolled

At scale, **uncontrolled inputs** (`react-hook-form`-style, reading from refs / form state) beat fully controlled ones because they avoid rerendering the whole tree on every keystroke. The mental model is closer to the platform form element.

### Validation placement

There are three valid places:

| Layer | Good for |
|---|---|
| Schema (Zod / Yup) | Shape, types, ranges — shared client/server |
| Field-level async | "Is this email already taken?" |
| Submission-level | Cross-field invariants only checkable at the end |

The trap is running the same rule in two layers and letting them drift. Centralize the schema.

---

## Concrete Example: Shared Zod Schema

```ts
// schema.ts — imported by both client form and server handler
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Use at least 12 characters'),
  country: z.enum(['US', 'CA', 'UK']),
  state: z.string().optional(),
}).refine(
  data => data.country !== 'US' || !!data.state,
  { message: 'State is required for US', path: ['state'] }
);

export type SignupInput = z.infer<typeof signupSchema>;
```

```tsx
// client
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors }, setError } =
  useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

async function onSubmit(data: SignupInput) {
  const res = await fetch('/api/signup', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const { fieldErrors } = await res.json();
    for (const [field, msg] of Object.entries(fieldErrors)) {
      setError(field as keyof SignupInput, { message: msg as string });
    }
  }
}
```

```ts
// server — same schema
const parsed = signupSchema.safeParse(await req.json());
if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  return Response.json({ fieldErrors }, { status: 400 });
}
```

One schema, two consumers, server errors that map cleanly to `setError(field, ...)` on the client.

---

## Performance Patterns

- **Isolate re-renders** with `<Controller>` or subscribed-field hooks so typing in field A doesn't rerender field Z.
- **Defer expensive validators** with debounce (`400ms` is a safe default for async field checks).
- **Memoize option lists** (dropdown sources, country lists) — recomputing on every render is the #1 cause of mystery lag.
- **Virtualize** very long repeating sections (invoice line items, survey questions).

---

## Preserving Input on Failure

Nothing destroys trust faster than losing what the user typed. Rules:

- Never unmount the form on submit error.
- Persist draft state to `localStorage` or `sessionStorage` for multi-step flows.
- For async submissions, keep the submit button in a *loading* state rather than disabling the form, so the user can still read what they typed.

---

## Accessibility Must-Haves

- Every input has a real `<label>` — not placeholder-as-label.
- Errors use `aria-describedby` pointing to the error node, and `aria-invalid="true"` on the input.
- On submit failure, focus moves to the first invalid field.
- Field groups use `<fieldset>` + `<legend>`.

---

## Interview / Trick Questions

### 1. Why do large forms slow down, and how do you fix it?

Every controlled input triggers a rerender of its parent on change. At scale, that cascades. Fix with uncontrolled state (react-hook-form), field-level subscriptions, or isolated sub-forms. The framework choice usually matters more than micro-optimizations.

### 2. Where should validation live — client, server, or both?

Both, sharing the same schema. Client validation is UX; server validation is correctness and security. Never trust client validation alone — you don't control the client. Never skip client validation — the round-trip UX is awful.

### 3. Trick: You disable the submit button until the form is valid. Is that good UX?

Often no. Users can't tell *why* the button is disabled. Better: keep it enabled, validate on submit, and focus the first error. Disabled buttons hide problems; visible errors solve them.

### 4. A user reports that they lost 10 minutes of data when the API returned 500. What's wrong architecturally?

Form state is coupled to submission. The form should keep its state regardless of submission outcome, and drafts of long forms should autosave to local storage so a crash or network failure doesn't nuke progress.

### 5. How do you handle cross-field validation like "end date must be after start date"?

At the schema level with a refinement, not scattered across field-level validators. Point the error at the later field (`path: ['endDate']`) so the UI knows where to surface it.

### 6. Trick: When is autosave the wrong choice?

When the user has a clear "draft vs submit" mental model — job applications, legal forms, anything with consequences on submit. Autosave there creates anxiety ("did I just apply?"). Save when the UX clearly signals persistence; otherwise, save-on-blur of completed sections.

### 7. What changes when forms get large?

The problem stops being "how do I render inputs" and becomes "how do I manage validation topology, field interdependencies, render performance, accessibility, and recovery from partial failure." Treat form state as first-class architecture, not a component concern.
