# AWS Observability and Cost Debugging

In production, "the system is slow" and "the AWS bill jumped" are often the same problem seen from different angles.

The goal is to connect:

```
traffic → resource usage → latency/errors → cloud cost
```

---

## Observability Pillars in AWS

### Metrics

Use CloudWatch metrics for:

- CPU, memory, disk, network
- ALB request counts and latency
- Lambda invocations, duration, errors, throttles
- RDS CPU, connections, read/write IOPS
- SQS queue depth and age of oldest message

### Logs

Centralize logs in CloudWatch Logs or ship to your log platform.

Important rule: structured logs beat grep-friendly text logs.

### Traces

Use OpenTelemetry and X-Ray compatible tracing to answer:

- where time is spent
- which downstream caused the spike
- which tenant or endpoint is expensive

---

## Cost Debugging Workflow

### 1. Find what changed

Check:

- Cost Explorer by service, account, and tag
- billing anomalies
- deployment history
- traffic and tenant distribution

### 2. Correlate with workload

Examples:

- Lambda cost spike + higher invocation count = traffic or retry storm
- RDS cost spike + higher IOPS = bad query or missing index
- NAT gateway spike + transfer costs = chatty cross-AZ or internet egress

### 3. Identify the technical driver

Typical root causes:

- unbounded retries
- noisy cron job
- expensive SQL plan
- huge logs
- high-cardinality metrics
- over-provisioned autoscaling minimums

---

## High-Leverage AWS Cost Hotspots

### NAT Gateway

Often shocks teams. Cross-AZ traffic and internet egress through NAT can get expensive fast.

### CloudWatch Logs

Verbose logs plus long retention can quietly become a real bill.

### Lambda

Retries, recursive events, and excessive memory settings inflate cost.

### RDS

Bigger instance class, storage IOPS, and replica count all matter.

### Data Transfer

Cross-region and cross-AZ traffic are common hidden costs.

---

## Tagging Strategy

You cannot debug shared-cloud cost well without tags.

At minimum tag by:

- service
- environment
- team
- owner
- cost center

This enables allocation, dashboards, and anomaly ownership.

---

## Practical Dashboards

Helpful dashboards combine:

- request rate
- p95 latency
- error rate
- queue depth
- DB connections
- spend by service

Put technical and cost views side by side.

---

## Interview Answer

### How do you debug a sudden AWS cost spike?

Start with Cost Explorer to isolate the service and time window, correlate that with traffic and deployment changes, then use metrics, logs, and traces to find the technical root cause. The fix is usually not "optimize cloud cost" in the abstract, but "remove the retry storm, bad query, or over-provisioned component" causing the spend.
