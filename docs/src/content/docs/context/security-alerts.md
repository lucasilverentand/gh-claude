---
title: Security Alerts
description: Collect Dependabot security alerts for vulnerability analysis
---

The `security_alerts` context type collects Dependabot security alerts from your repository, enabling agents to analyze vulnerabilities, prioritize fixes, and automate security responses.

## Basic Example

```yaml
name: Security Monitor
on:
  schedule:
    - cron: '0 9 * * *'

context:
  security_alerts:
    state: [open]
    severity: [critical, high]
  since: 24h
```

## Configuration Options

```yaml
context:
  security_alerts:
    severity: [critical, high, medium, low]  # Filter by severity
    state: [open, fixed, dismissed]          # Filter by state
    ecosystem: [npm, pip, maven]             # Filter by package ecosystem
    limit: 50                                # Max alerts to collect (default: 100)
```

## Collected Data

Each security alert includes:
- Package name and ecosystem
- Vulnerability severity (critical, high, medium, low)
- Alert state (open, fixed, dismissed)
- CVE identifier
- Affected version ranges
- Patched versions
- Advisory summary
- CVSS score
- Created and updated timestamps

## Examples

<details>
<summary>Example: Critical vulnerability response</summary>

```yaml
name: Critical CVE Monitor
on:
  schedule:
    - cron: '0 * * * *'  # Hourly

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  security_alerts:
    severity: [critical]
    state: [open]
  since: 1h
  min_items: 1
```

```markdown
Monitor for new critical security vulnerabilities.

If critical alerts are detected in the last hour:
1. Create a high-priority issue with:
   - Title: "CRITICAL: [Number] security vulnerabilities detected"
   - List each CVE with affected packages and patched versions
   - Label: security, priority/critical
   - Assign to security team

Include upgrade instructions and impact assessment.
```

</details>

<details>
<summary>Example: Weekly security report</summary>

```yaml
name: Security Report
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  security_alerts:
    state: [open, fixed]
  since: 7d
```

```markdown
Generate a weekly security report:

1. Create an issue titled "Security Report - Week of [date]"
2. Summarize:
   - New vulnerabilities discovered this week
   - Vulnerabilities fixed this week
   - Open vulnerabilities by severity
   - Packages requiring updates
3. Prioritize critical and high severity items
4. Add label: security-report

Skip creating the report if no security activity occurred.
```

</details>

<details>
<summary>Example: Ecosystem-specific monitoring</summary>

```yaml
name: NPM Security Monitor
on:
  schedule:
    - cron: '0 8 * * *'

permissions:
  pull_requests: write

outputs:
  add-comment: { max: 1 }

context:
  security_alerts:
    ecosystem: [npm]
    state: [open]
  dependabot_prs:
    states: [open]
  since: 24h
```

```markdown
Monitor npm security alerts and related Dependabot PRs.

For each open security alert in the npm ecosystem:
1. Find the corresponding Dependabot PR (if it exists)
2. Add a comment to the PR indicating the severity and CVE
3. Recommend prioritizing critical/high severity updates

This helps reviewers understand which dependency PRs are security-related.
```

</details>
