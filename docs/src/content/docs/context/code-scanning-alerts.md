---
title: Code Scanning Alerts
description: Collect CodeQL and security scanning results
---

The `code_scanning_alerts` context type collects code scanning alerts from GitHub Advanced Security (CodeQL, third-party tools), enabling agents to track security issues, monitor code quality, and automate remediation workflows.

## Basic Example

```yaml
name: Code Scanning Monitor
on:
  schedule:
    - cron: '0 9 * * *'

context:
  code_scanning_alerts:
    state: [open]
    severity: [error, warning]
  since: 24h
```

## Configuration Options

```yaml
context:
  code_scanning_alerts:
    severity: [critical, high, medium, low, warning, note, error]  # Filter by severity
    state: [open, fixed, dismissed]                                # Filter by state
    tool: [CodeQL, Semgrep]                                        # Filter by scanning tool
    limit: 100                                                     # Max alerts (default: 100)
```

## Collected Data

Each code scanning alert includes:
- Alert number and state
- Severity level
- Rule ID and description
- Tool name (CodeQL, Semgrep, etc.)
- Affected file and line number
- Alert message
- Created and updated timestamps
- Fix status

## Examples

<details>
<summary>Example: High severity alert tracking</summary>

```yaml
name: Critical Code Issues
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  code_scanning_alerts:
    severity: [critical, high, error]
    state: [open]
    tool: [CodeQL]
  since: 6h
  min_items: 1
```

```markdown
Monitor for new critical or high severity code scanning alerts.

If new high-severity alerts are detected:
1. Create an issue titled "Security: [N] critical code scanning alerts detected"
2. List each alert with:
   - Severity and rule description
   - Affected file and line number
   - Recommended fix (if available)
3. Add labels: security, code-quality
4. Assign to security team

Include links to the alerts in GitHub Security tab.
```

</details>

<details>
<summary>Example: Weekly code quality report</summary>

```yaml
name: Code Quality Report
on:
  schedule:
    - cron: '0 9 * * FRI'

permissions:
  issues: write

outputs:
  create-issue: { max: 1 }

context:
  code_scanning_alerts:
    state: [open, fixed]
  since: 7d
```

```markdown
Generate a weekly code quality report:

1. Create an issue titled "Code Quality Report - Week of [date]"
2. Summarize:
   - New alerts opened this week
   - Alerts fixed this week
   - Open alerts by severity
   - Most common rule violations
   - Trends (improving or declining)
3. Add label: code-quality-report

Skip if no code scanning activity occurred this week.
```

</details>

<details>
<summary>Example: Alert auto-triage</summary>

```yaml
name: Code Scan Triage
on:
  schedule:
    - cron: '0 8 * * *'

permissions:
  issues: write

outputs:
  create-issue: true

context:
  code_scanning_alerts:
    state: [open]
    severity: [error, warning]
```

```markdown
Triage open code scanning alerts:

Group alerts by:
- Rule ID
- Affected file/component
- Severity

For each group with 3+ similar alerts:
1. Create a tracking issue for that pattern
2. Title: "[Code Quality] Multiple [rule-name] violations in [component]"
3. List all affected locations
4. Suggest a systematic fix approach

This helps identify patterns requiring architectural fixes rather than one-off patches.
```

</details>
