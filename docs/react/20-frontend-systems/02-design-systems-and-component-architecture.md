# Design Systems and Component Architecture

A design system is not a component library — it's a **shared language** for product UI. A library gives you `<Button>`. A design system gives you a policy for *what buttons exist, how they behave, when they're used, and how they compose into patterns*. The difference shows up the moment a second team tries to build a screen without copying yours.

Most frontend teams eventually hit the same wall: every screen invents its own spacing scale, every modal reinvents focus trapping, and a "small design change" ripples across forty files. Component architecture is how you stop that.

---

## The Four Layers

A well-structured system has four distinct layers, each with its own responsibility. Crossing the layers is where architectures rot.

### 1. Tokens

Raw design decisions as data: colors, spacing scale, typography, radii, shadows, motion curves. Tokens are not components — they're the atoms every component consumes.

```ts
// tokens.ts
export const tokens = {
  color: {
    fg: 'var(--fg)',
    accent: 'var(--accent)',
    danger: 'hsl(0 72% 50%)',
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: { sm: 6, md: 10, lg: 16 },
  shadow: { sm: '0 1px 2px rgb(0 0 0 / 0.08)' },
};
```

### 2. Primitives

Small, unopinionated building blocks: `Button`, `Input`, `Stack`, `Text`, `Dialog`, `Menu`. Primitives consume tokens. They must **not** contain business logic — a `SubmitPaymentButton` does not belong at this layer.

```tsx
// Button.tsx — a primitive
type Variant = 'primary' | 'secondary' | 'ghost';
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}
export function Button({ variant = 'primary', size = 'md', ...rest }: Props) {
  return <button data-variant={variant} data-size={size} {...rest} />;
}
```

### 3. Patterns

Compositions of primitives that solve **recurring product problems**: `FormField`, `DataTable`, `EmptyState`, `ConfirmDialog`. Patterns carry opinionated UX defaults (label-error-hint layout, keyboard semantics) but still no domain logic.

### 4. Product Screens

Business-specific compositions: `CheckoutPage`, `InvoiceTable`. This is the only layer that knows about your domain.

**The rule of thumb:** tokens change slowest, screens change fastest. If a screen-level change forces a token change, your abstractions are leaking.

---

## Why Architecture Matters

Without clear boundaries:

- every screen reinvents spacing and color usage → visual drift
- accessibility fixes land in one modal but miss three others
- a designer changes the primary color and twelve hardcoded hex values don't update
- refactors get expensive because business logic is baked into `Button`

With boundaries, a token change is a one-line PR, and a primitive upgrade lifts every screen at once.

---

## Concrete Example: the Slot Pattern

One of the most powerful architecture techniques is the **slot / compound component** pattern — it keeps primitives flexible without ballooning the prop surface.

```tsx
// Instead of Dialog with 20 props, expose slots
<Dialog>
  <Dialog.Trigger asChild><Button>Delete</Button></Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Are you sure?</Dialog.Title>
    <Dialog.Description>This action is permanent.</Dialog.Description>
    <Dialog.Footer>
      <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
      <Button variant="danger">Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

The primitive owns behavior (focus trap, escape key, portal rendering). The consumer owns layout and copy. Neither blocks the other.

---

## Good Rules

- **Tokens are centralized.** If a hex lives outside the token file, it's a bug.
- **Primitives stay small.** The moment a primitive has more than ~8 meaningful props, split it.
- **No business logic in primitives.** `Button` knows about `variant`; it does not know about your checkout.
- **Document *intent*, not just API.** "Use `ConfirmDialog` for destructive actions" matters more than listing props — IDEs already list props.
- **Versioning discipline.** Breaking changes in primitives are expensive. Prefer additive props and deprecation windows.

---

## Interview / Trick Questions

### 1. What's the difference between a component library and a design system?

A component library is a set of reusable React components. A design system is the surrounding contract: tokens, patterns, accessibility guarantees, usage guidelines, and governance. You can build a library without a system; you cannot build a system without also building the library plus the rules around it.

### 2. Why shouldn't business logic live in design system primitives?

Because primitives are reused across domains. A `Button` that knows about payments can't be used in the settings page. Business logic belongs in product screens or feature-specific components that *compose* primitives.

### 3. A designer asks you to change the primary blue across the whole app. How long should it take?

In a healthy system: one line (update the token). If it takes longer, you have hardcoded colors, which means the token layer is broken — that's the real bug to fix, not the color.

### 4. When should you break something out of a primitive into a pattern?

When two or more screens compose the same set of primitives in the same configuration with the same accessibility semantics. One instance is a coincidence; two is a pattern. Wait for the second before abstracting.

### 5. Trick: How do you handle a team that wants to bypass the design system "just this once"?

You let them — but track it. Escape hatches are fine; silent escape hatches are not. Record the bypass as tech debt with a reason. Three bypasses for the same reason means the system has a gap, not that the team is wrong.

### 6. What makes a good component architecture?

It separates tokens, reusable primitives, recurring patterns, and product-specific composition so teams move quickly without visual drift or duplicated accessibility logic. Good architectures are judged not by how they look on day one but by how painful the tenth refactor is.
