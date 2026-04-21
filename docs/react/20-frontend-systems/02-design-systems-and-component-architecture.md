# Design Systems and Component Architecture

A design system is not just a component library. It is a shared language for product UI.

---

## Layers

### Tokens

Colors, spacing, typography, radius, shadows, motion.

### Primitives

Buttons, inputs, text, stack, card, dialog.

### Patterns

Forms, tables, navigation, empty states.

### Product Screens

Actual feature composition.

---

## Why Architecture Matters

Without boundaries:

- every screen invents its own patterns
- design drift spreads
- accessibility fixes get duplicated
- refactors become expensive

---

## Good Rules

- keep tokens centralized
- keep primitives flexible but small
- avoid putting business logic into primitives
- document intended usage, not just API surface

---

## Interview Answer

### What makes a good component architecture?

A good component architecture separates design tokens, reusable primitives, and product-specific composition so teams can move quickly without creating visual drift or duplicating accessibility and interaction logic everywhere.
