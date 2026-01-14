---
title: Discussions
description: Enable agents to create GitHub discussions
---

The `create-discussion` output allows your agent to create new discussions in GitHub Discussions. This is useful for community engagement, announcements, weekly digests, and open-ended conversations that don't fit into the issue or pull request workflow.

## Basic Example

```yaml
name: Weekly Digest
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  discussions: write

outputs:
  create-discussion: true
```

## Options

```yaml
outputs:
  create-discussion: true    # boolean | { max: number } — default: false
  # or with limit:
  create-discussion:
    max: 3                   # number — default: unlimited
```

**create-discussion** — Enable creating discussions. Requires `discussions: write` permission.

**max** — Maximum discussions to create per run.

## Permission Requirements

Creating discussions requires `discussions: write` permission in your agent configuration. Without this permission, the workflow will not have the necessary access to create discussions via the GitHub API.

```yaml
permissions:
  discussions: write
```

Additionally, GitHub Discussions must be enabled in your repository settings. If discussions are not enabled, the agent will fail when attempting to query or create discussions.

## How Discussions Are Created

When your agent decides to create a discussion, it writes a JSON file to `/tmp/outputs/create-discussion.json` with three required fields: `title`, `body`, and `category`. The title must be non-empty and cannot exceed 256 characters. The body should provide sufficient context and can include markdown formatting. The category must match an existing discussion category in your repository.

For multiple discussions, the agent uses numbered suffixes like `create-discussion-1.json` and `create-discussion-2.json`. The workflow validates all files before creating any discussions, ensuring that if one file has invalid data, no discussions are created.

Every discussion created by the agent automatically includes a footer linking back to the workflow run that generated it, providing traceability for automated content.

## Common Categories

GitHub Discussions comes with several default categories that your agent can use: "Announcements" for project news and updates, "General" for open-ended discussions, "Ideas" for feature suggestions, "Q&A" for questions and answers, and "Show and tell" for showcasing work. Your repository may have custom categories configured as well. The agent validates that the specified category exists before creating the discussion.

## Best Practices

Always set a reasonable `max` limit on discussion creation. Without limits, a misconfigured agent could create many discussions in a single run. For most use cases, creating one discussion per run is sufficient.

Be mindful that discussions are public and visible to everyone who can access your repository. Avoid including internal system details, sensitive metrics, or confidential information in generated discussions.

Provide clear instructions in your agent's markdown body about when to create discussions and what content to include. Guide the agent on which category to use based on the content type. For weekly digests, "Announcements" is typically appropriate. For promoting user questions, "Q&A" makes more sense.

Include a call to action in the discussion body to encourage community engagement. This could be asking for feedback, inviting contributions, or prompting readers to share their experiences.

## More Examples

<details>
<summary>Example: Weekly community digest</summary>

```yaml
name: Weekly Community Digest
on:
  schedule:
    - cron: '0 9 * * MON'

permissions:
  discussions: write

outputs:
  create-discussion: { max: 1 }

context:
  pull_requests:
    states: [merged]
  issues:
    states: [closed]
  since: 7d
```

In your agent instructions:

```markdown
Create a weekly digest discussion summarizing the past week's activity.

Title format: "Weekly Digest - [Current Date]"
Category: Announcements

Include sections for:
- PRs merged this week with brief descriptions
- Issues closed and their resolutions
- Notable contributors to thank
- Upcoming focus areas if apparent from recent activity

Only create the discussion if there was meaningful activity. Skip weeks with no merged PRs or closed issues.
```

</details>

<details>
<summary>Example: Release announcements</summary>

```yaml
name: Release Announcements
on:
  release:
    types: [published]

permissions:
  discussions: write

outputs:
  create-discussion: { max: 1 }
```

In your agent instructions:

```markdown
When a new release is published, create an announcement discussion.

Title: "[Release] Version [version number] - [Release Name]"
Category: Announcements

Include:
- Key highlights and new features
- Breaking changes with migration guidance
- Link to full release notes
- Thanks to contributors

Keep the tone celebratory and welcoming.
```

</details>

<details>
<summary>Example: Promoting questions from issues to Q&A</summary>

```yaml
name: Promote Questions to Discussions
on:
  issues:
    types: [opened]

permissions:
  discussions: write
  issues: write

outputs:
  create-discussion: { max: 1 }
  add-comment: { max: 1 }
```

In your agent instructions:

```markdown
When a new issue is opened, determine if it's a question rather than a bug report or feature request.

If it's a question:
1. Create a discussion in the "Q&A" category with the original question
2. Include a link back to the issue
3. Comment on the issue explaining that questions are better suited for Discussions and link to the new discussion

If it's clearly a bug or feature request, do nothing.
```

</details>

<details>
<summary>Example: Feature ideas forum</summary>

```yaml
name: Feature Ideas Curator
on:
  schedule:
    - cron: '0 0 * * SUN'

permissions:
  discussions: write

outputs:
  create-discussion: { max: 3 }

context:
  issues:
    labels: [enhancement, feature-request]
    states: [open]
  since: 7d
```

In your agent instructions:

```markdown
Review feature request issues opened in the past week.

For the most promising or popular requests (up to 3), create a discussion in the "Ideas" category to gather broader community input.

Title: "Idea: [Feature Name]"
Category: Ideas

Include the original issue description, link to the issue, and ask the community for their thoughts and use cases.
```

</details>
