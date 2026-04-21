# Playwright E2E Testing

Playwright is a strong default for modern end-to-end browser testing because it is reliable, fast enough, and built around browser automation rather than DOM mocking.

---

## What E2E Tests Should Cover

Use E2E tests for workflows where integration between pieces matters:

- login
- checkout
- onboarding
- permissions
- critical CRUD flows

Do not use E2E for every branch of business logic. That makes suites slow and fragile.

---

## Why Playwright

- real browser automation
- auto-waiting reduces timing flake
- network interception and tracing
- multi-browser support
- strong parallelization

---

## Basic Example

```typescript
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('super-secret');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Welcome back')).toBeVisible();
});
```

---

## Good Practices

### Use stable selectors

Prefer:

- `getByRole`
- `getByLabel`
- `getByTestId`

Avoid brittle CSS selectors tied to layout.

### Keep setup cheap

Seed test data through APIs or fixtures instead of long UI setup when possible.

### Test user outcomes

Assert things the user cares about:

- visible success state
- redirected page
- persisted record

Not internal implementation details.

---

## Authentication Strategies

Common options:

- log in through the UI for a small number of smoke tests
- create a saved authenticated state for most tests
- mint test cookies or tokens in setup where allowed

The fastest suites usually avoid repeating the full login flow in every test.

---

## Debugging Failures

Playwright traces are the killer feature.

Capture:

- screenshot
- video
- trace
- console logs

Then inspect the failing run instead of guessing from CI output.

---

## Interview Answer

### When would you use Playwright?

Use Playwright for critical browser workflows where real rendering, routing, auth, and network behavior need to be exercised together. Keep the suite focused on a small set of high-value journeys and rely on lower-level tests for detailed business logic.
