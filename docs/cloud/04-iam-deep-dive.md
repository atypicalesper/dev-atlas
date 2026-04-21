# IAM Deep Dive

IAM answers one question:

```
Who can do what on which resource under which conditions?
```

For interviews and production work, the important part is understanding policy evaluation order, temporary credentials, and guardrails.

---

## Core Model

- **Principal**: user, role, service, or federated identity making the request
- **Action**: API operation like `s3:GetObject` or `dynamodb:PutItem`
- **Resource**: ARN the action targets
- **Condition**: extra checks such as IP range, MFA, tags, or time window

Minimal example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::app-assets/*"
    }
  ]
}
```

---

## How AWS Evaluates Permissions

Evaluation is easier if you remember these rules:

1. Start with implicit deny.
2. Collect matching identity-based and resource-based policies.
3. Apply permission boundaries and SCPs as caps.
4. If any explicit deny matches, the request is denied.
5. Otherwise an allow succeeds only if something explicitly allows it.

Think of it like:

```
Implicit deny
  + matching allows
  - explicit denies
  capped by boundaries / SCPs
```

---

## Users vs Roles vs Federation

### Users

Long-lived credentials for humans. Fine for small labs, but avoid for applications.

### Roles

Preferred for workloads. The app assumes a role and receives temporary credentials from STS.

### Federation

Humans authenticate with Google, Okta, Azure AD, or IAM Identity Center, then assume roles instead of managing AWS passwords directly.

Production default:

- Humans: SSO / federation
- Apps on AWS: IAM roles
- Apps outside AWS: `AssumeRole` with OIDC or external identity

---

## Resource Policies vs Identity Policies

Use **identity policies** when you control the caller.

Use **resource policies** when the resource must trust another principal directly.

Common examples:

- S3 bucket policy
- KMS key policy
- SNS topic policy
- SQS queue policy
- IAM role trust policy

Trust policy example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

This policy does not grant S3 or DynamoDB access. It only says who may assume the role.

---

## Permission Boundaries and SCPs

These are often confused.

### Permission Boundary

Attached to a user or role. It limits the **maximum** permissions that principal can ever receive.

### SCP

Applied at the AWS Organization account or OU level. It limits the **maximum** permissions for the entire account subtree.

Good mental model:

- Identity policy says "may do X"
- Boundary says "not above this ceiling"
- SCP says "the org never allows this"

---

## Conditions Matter

Conditions are where IAM becomes powerful.

Useful patterns:

- Require MFA for sensitive actions
- Restrict access to specific VPC endpoints
- Allow access only when tags match
- Limit role assumption by source account or external ID

Example:

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::reports/*",
  "Condition": {
    "StringEquals": {
      "aws:PrincipalTag/team": "analytics"
    }
  }
}
```

This is how attribute-based access control (ABAC) usually starts.

---

## Common Production Patterns

### EC2 / ECS / Lambda Accessing AWS APIs

Attach a role to the workload. Never hardcode access keys in config files.

### Cross-Account Access

Create a role in Account B that trusts Account A, then let Account A assume it.

### GitHub Actions Deploying to AWS

Use OIDC federation instead of storing long-lived AWS secrets in GitHub.

### S3 Uploads from Browser

Give the backend permission to create a pre-signed URL, not blanket bucket credentials to the browser.

---

## Failure Modes to Watch

- Overusing `Resource: "*"` for convenience
- Mixing trust policy and permission policy concepts
- Forgetting explicit denies from SCPs or bucket policies
- Using users with permanent keys for workloads
- Not rotating away from shared admin roles
- Debugging by attaching `AdministratorAccess` and forgetting to remove it

---

## Interview Answers

### How do you design least privilege in AWS?

Start from roles, not users. Grant the smallest resource scope possible, add conditions where useful, and use boundaries or SCPs for blast-radius control.

### Why use roles instead of access keys?

Roles issue short-lived credentials automatically, reduce secret sprawl, rotate by default, and integrate cleanly with EC2, ECS, Lambda, and federation.

### What wins when policies conflict?

Explicit deny always wins. Otherwise, some explicit allow must match for access to succeed.
