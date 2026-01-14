---
title: Discussion Events
description: Respond to GitHub Discussions activity
---

Discussion triggers allow your agent to respond when users create, edit, answer, or otherwise interact with GitHub Discussions in your repository. This is particularly useful for community support, Q&A automation, and maintaining an active discussion space.

## Basic Example

```yaml
---
name: Discussion Welcome
on:
  discussion:
    types: [created]
permissions:
  discussions: write
---

Welcome new discussion participants and provide helpful resources.
```

## Configuration Options

```yaml
on:
  discussion:
    types: [created, answered]  # string[] — default: all types
```

**types** — Which discussion events trigger the agent: `created`, `edited`, `deleted`, `transferred`, `pinned`, `unpinned`, `labeled`, `unlabeled`, `locked`, `unlocked`, `category_changed`, `answered`, `unanswered`.

## Best Practices

Discussions are community-driven spaces where the tone and approach matter significantly. Agents should be welcoming and helpful without being overwhelming or condescending. A good discussion agent provides value by surfacing relevant resources, routing discussions to appropriate categories, or helping answer common questions, but it should never attempt to fully automate all community interaction.

When working with Q&A discussions, consider triggering on the `answered` event to thank participants or suggest related resources. For new discussions, the `created` event lets you welcome newcomers and point them toward relevant documentation or existing discussions that might help.

Different discussion categories serve different purposes. Announcements are typically for project updates with restricted posting, while Q&A is for questions seeking answers, and Ideas is for feature proposals. Tailor your agent's behavior based on the category context, which is available in the event payload.

Rate limiting is important for discussion agents since discussions can be edited frequently. Consider setting a reasonable `rate_limit_minutes` value to prevent your agent from running too often on rapidly edited content.

Be thoughtful about what your agent writes. Discussion participants often prefer human interaction, so use agents to augment rather than replace community engagement. Agents work well for initial triage, welcoming newcomers, and surfacing relevant links, but substantive answers often benefit from human expertise.

## More Examples

<details>
<summary>Example: Q&A Helper</summary>

```yaml
---
name: Q&A Helper
on:
  discussion:
    types: [created, edited]
permissions:
  discussions: write
---

For discussions in the Q&A category:
1. Analyze the question
2. Search for similar existing discussions
3. Provide relevant documentation links
4. Suggest potential answers if the question matches known patterns
```

</details>

<details>
<summary>Example: Category Router</summary>

```yaml
---
name: Category Suggester
on:
  discussion:
    types: [created]
permissions:
  discussions: write
---

Analyze the discussion content and determine if it is in the most appropriate category.
If the content appears to be a bug report, suggest converting it to an issue.
If it matches a different category better, politely suggest moving it.
Link to any related existing discussions that might be helpful.
```

</details>

<details>
<summary>Example: Discussion Labeler</summary>

```yaml
---
name: Discussion Labeler
on:
  discussion:
    types: [created, edited]
permissions:
  discussions: write
outputs:
  add-label: true
---

Analyze the discussion content and apply appropriate labels:
- Use 'question' for help requests
- Use 'idea' for feature proposals
- Use 'showcase' for community project showcases
- Apply topic-specific labels like 'api', 'ui', or 'performance' based on content
```

</details>

<details>
<summary>Example: Answer Acknowledgment</summary>

```yaml
---
name: Answer Thanks
on:
  discussion:
    types: [answered]
permissions:
  discussions: write
---

When a discussion is marked as answered:
1. Thank both the question asker and the person who provided the answer
2. Suggest related resources that might be helpful
3. Encourage the participants to share their knowledge in other discussions
```

</details>

<details>
<summary>Example: Weekly Discussion Digest (Scheduled)</summary>

```yaml
---
name: Discussion Digest
on:
  schedule:
    - cron: '0 9 * * MON'
permissions:
  discussions: write
context:
  discussions:
    limit: 50
  since: 7d
---

Review discussions from the past week and create a summary:
1. Highlight popular discussions with the most engagement
2. List unanswered Q&A discussions that need attention
3. Celebrate helpful community members who provided answers
4. Post the digest as a new announcement discussion
```

</details>
