# Contract Testing

Contract testing sits between unit tests and full end-to-end tests.

It checks that two services agree on their API contract without needing the whole system running together.

---

## What It Solves

Imagine:

- frontend expects `user.name`
- backend changes response to `fullName`

Both services might pass their own tests, but the integration breaks.

Contract tests catch this earlier.

---

## Consumer-Driven Contract Testing

The consumer defines expectations:

- request shape
- response shape
- required fields
- status codes

The provider then verifies it still satisfies those expectations.

This is common with Pact-style workflows.

---

## Good Use Cases

- frontend talking to backend APIs
- microservices with owned interfaces
- external integrations wrapped by an internal adapter

---

## What Contract Tests Should Check

- field presence and types
- enum values
- status codes
- important error shapes

They should not try to validate every business rule in the provider.

---

## Benefits

- faster feedback than full integrated environments
- safer independent deployments
- clearer API ownership between teams

---

## Limitations

- does not replace integration testing
- can become noisy if contracts are poorly scoped
- brittle if teams contract on incidental fields

Test the meaningful interface, not every byte.

---

## Interview Answer

### What is contract testing?

Contract testing verifies that the interaction expected by a consumer is still honored by the provider. It helps independently deployed services catch integration mismatches earlier than full end-to-end testing, but it complements rather than replaces integration tests.
