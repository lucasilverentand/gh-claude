---
title: Repository Dispatch
description: Trigger agents programmatically via the GitHub API
---

Repository dispatch triggers allow you to invoke agents programmatically through the GitHub API. This is useful when you want to trigger agents from external systems, CI/CD pipelines, or other automation workflows that need to communicate with your repository.

## Basic Example

```yaml
---
name: Deployment Notifier
on:
  repository_dispatch:
    types: [deployment-completed]
permissions:
  issues: write
---

Handle deployment completion notifications and update relevant issues.
```

## Configuration Options

```yaml
on:
  repository_dispatch:
    types: [deploy, release]  # string[]
```

**types** — Custom event types that trigger the agent. Match against the `event_type` field in the dispatch payload.

### Event Context

When an event is dispatched, the event type is available in your agent's context via `github.event.action`. Any data you include in the `client_payload` when dispatching the event is available via `github.event.client_payload`.

## Best Practices

Choose descriptive, semantic event type names that clearly communicate what happened. Names like `deployment-completed` or `security-scan-failed` are far more maintainable than generic names like `event1` or `webhook`. When working with multiple systems, consider prefixing event types with the source system name, such as `jenkins-build-completed` or `datadog-alert-triggered`.

Include all necessary context in your `client_payload` when dispatching events. The agent has access to this payload, so including relevant information like environment names, version numbers, timestamps, and user identifiers helps the agent make better decisions without needing additional API calls.

Validate and sanitize data from external sources. Since repository dispatch events can come from anywhere with the appropriate token, treat the payload data with appropriate caution, especially if the event originates from systems outside your direct control.

Document the events your repository accepts. Maintaining a clear record of which event types your agents listen for, what payload structure they expect, and which systems dispatch those events helps team members understand the integration points and troubleshoot issues.

## More Examples

<details>
<summary>Example: CI/CD integration with multiple event types</summary>

```yaml
---
name: Pipeline Status Handler
on:
  repository_dispatch:
    types: [build-started, build-completed, build-failed, deploy-completed]
permissions:
  issues: write
  discussions: write
---

Handle CI/CD pipeline events from our external build system.

Check the event type from github.event.action and the payload from github.event.client_payload to determine the appropriate response.

For build-started events, post a status update to the relevant PR or issue.
For build-completed events, close any blocking issues and notify the team.
For build-failed events, create an issue with the failure details and tag the relevant team.
For deploy-completed events, post a summary to the team discussion.
```

</details>

<details>
<summary>Example: External webhook handler</summary>

```yaml
---
name: Customer Feedback Processor
on:
  repository_dispatch:
    types: [customer-feedback]
permissions:
  issues: write
---

Process customer feedback submitted through our support portal.

The client_payload contains:
- feedback_id: Unique identifier for the feedback
- customer_tier: The customer's subscription tier
- category: Type of feedback (bug, feature-request, question)
- summary: Brief description of the feedback
- priority: Urgency level from the support team

Create or update issues based on the feedback category and priority.
Tag the appropriate team based on the category.
```

</details>

<details>
<summary>Example: Triggering via GitHub CLI</summary>

You can dispatch events using the GitHub CLI:

```bash
gh api repos/OWNER/REPO/dispatches \
  -f event_type=deployment-completed \
  -f client_payload[environment]=production \
  -f client_payload[version]=1.2.3 \
  -f client_payload[deployed_by]=alice
```

Or using curl:

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{
    "event_type": "deployment-completed",
    "client_payload": {
      "environment": "production",
      "version": "1.2.3",
      "deployed_by": "alice"
    }
  }'
```

</details>

<details>
<summary>Example: Cross-repository coordination</summary>

```yaml
---
name: Dependency Update Handler
on:
  repository_dispatch:
    types: [dependency-updated]
permissions:
  issues: write
  pull_requests: write
---

Handle notifications when a dependency repository publishes a new version.

The client_payload includes:
- package_name: Name of the updated package
- old_version: Previous version
- new_version: New version
- changelog_url: Link to the changelog
- breaking_changes: Boolean indicating if there are breaking changes

If breaking_changes is true, create an issue to track the upgrade.
Otherwise, create a PR that updates the dependency version.
```

</details>
