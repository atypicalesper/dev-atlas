# Terraform vs CDK

Both tools define infrastructure as code. The difference is where abstraction lives.

```
Terraform = declarative IaC language and ecosystem
CDK       = infrastructure defined in general-purpose code
```

Neither is universally better. The tradeoff is readability, abstraction, and ecosystem fit.

---

## Terraform

Terraform uses HCL and has a very large provider ecosystem.

Pros:

- cloud-agnostic
- mature community and modules
- readable declarative diff model
- easier for infra teams to standardize

Cons:

- abstractions can get clunky
- loops and composition are weaker than real programming languages
- large monolithic states can become painful

Terraform is great when:

- infra spans multiple providers
- platform teams want a common standard
- teams value explicit plans and simple review diffs

---

## CDK

CDK uses TypeScript, Python, Java, or other languages to generate CloudFormation.

Pros:

- real programming language abstractions
- easy reuse of functions, classes, and config
- strong fit for app teams already living in TypeScript/Python

Cons:

- can become "too clever"
- generated CloudFormation can be harder to reason about
- primarily AWS-focused

CDK is great when:

- you are strongly AWS-centric
- app engineers own a lot of their own infrastructure
- you want reusable constructs in normal code

---

## Key Decision Points

### Ecosystem

- Terraform wins for multi-cloud and breadth of providers
- CDK wins for AWS-native developer ergonomics

### Reviewability

- Terraform usually produces clearer infra diffs
- CDK can hide changes behind abstraction unless teams are disciplined

### Abstraction

- CDK is more expressive
- Terraform encourages simpler, more explicit infra definitions

### Team Skill Set

- infra/platform-heavy orgs often prefer Terraform
- app-heavy AWS orgs often enjoy CDK

---

## Common Hybrid Pattern

Some teams use:

- Terraform for foundational platform resources
- CDK for application-specific AWS stacks

This can work, but be careful about ownership boundaries and duplicated state.

---

## Failure Modes

- Terraform: giant states, over-modularization, weak ownership
- CDK: abstraction for abstraction's sake, logic-heavy constructs, generated changes that reviewers do not understand

The tool is usually not the problem. Unclear boundaries are.

---

## Interview Answer

### Terraform vs CDK?

Terraform is better when you want cloud-agnostic, declarative, review-friendly infrastructure with a broad ecosystem. CDK is better when you are AWS-focused and want to model infrastructure with reusable abstractions in a general-purpose language. Pick based on team workflow and platform scope, not trendiness.
