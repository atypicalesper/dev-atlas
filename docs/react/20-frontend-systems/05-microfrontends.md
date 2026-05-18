# Microfrontends

Microfrontends split a frontend platform into independently developed and deployed pieces owned by different teams.

The appeal is obvious:

- teams ship independently
- codebases stay smaller per team
- ownership becomes clearer

The danger is also obvious:

- UX fragmentation
- duplicated dependencies
- inconsistent routing and auth
- many deployable pieces with one user experience

Microfrontends are an organization strategy as much as a technical one.

---

## When They Make Sense

Microfrontends are strongest when:

- multiple teams own distinct product areas
- release independence matters
- the app is large enough that one repo and one deploy pipeline are slowing teams down

Examples:

- commerce shell + checkout team + account team
- enterprise product with tenant admin, analytics, billing, support, and workflow builders

They are usually overkill when one team could still own the app comfortably.

---

## Common Integration Models

### Build-time integration

Shared packages are imported into one app build.

Good:

- simple
- stable
- easier local development

Bad:

- not truly independently deployable

### Runtime integration / Module Federation

Parts of the UI are loaded from separately deployed builds at runtime.

Good:

- real deployment independence

Bad:

- dependency sharing is harder
- versioning mistakes can break runtime

### iframe isolation

Strong isolation, weak integration.

Good:

- security and ownership boundaries

Bad:

- poor seamless UX
- harder shared navigation and styling

---

## The Real Boundaries

The most important boundary is not "component." It is "business domain."

Good boundaries:

- billing
- analytics
- checkout
- support operations

Bad boundaries:

- navbar team
- button team
- random widget-by-widget ownership

If the domain boundary is weak, the microfrontend boundary will leak constantly.

---

## Shared Concerns You Must Centralize

Even independent frontends need shared platform contracts:

- design system
- auth/session
- routing conventions
- analytics events
- error tracking
- accessibility bar
- performance budgets

Without these, independence turns into inconsistency.

---

## Performance Concerns

Microfrontends can easily make performance worse:

- duplicate React copies
- duplicate design system code
- multiple data fetch waterfalls
- too many runtime chunks

Important guardrails:

- share core dependencies carefully
- lazy load non-critical zones
- set hard bundle budgets per slice
- keep the shell thin

The user experiences one app, not your org chart.

---

## What the Shell Usually Owns

The shell is typically responsible for:

- top-level routing
- navigation chrome
- auth bootstrap
- feature flags
- global theming
- shared observability setup

Child apps should own domain flows, not platform-wide policies.

---

## When Not to Use Microfrontends

Avoid them when:

- the app is still small
- there is only one effective team
- teams are not ready to own runtime, observability, and release contracts
- the real problem is poor modularity, not team independence

If a modular monolith solves the problem, prefer that first.

---

## Interview Answer

### What are microfrontends?

They are an architectural pattern where independent teams own separate slices of a frontend platform and integrate them into one user experience. The real benefit is team autonomy, not technical novelty.

### What are the biggest risks?

UX inconsistency, duplicated dependencies, runtime integration complexity, and weak domain boundaries. Microfrontends help when organization scale is the real bottleneck, but they hurt if adopted before the platform and teams are ready for the coordination cost.
