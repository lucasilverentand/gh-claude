---
title: Daily Summary Agent
description: Generate daily activity summaries
---

This example shows how to create an agent that runs on a schedule and generates summary reports of repository activity. This agent uses the **inputs system** to automatically collect issues, PRs, commits, and other repository data, then creates comprehensive activity reports as GitHub Discussions.

## Complete Agent Definition

Create `.github/claude-agents/daily-summary.md`:

```markdown
---
name: Daily Activity Report
on:
  schedule:
    - cron: '0 9 * * 1-5'  # 9 AM weekdays
  workflow_dispatch: {}
permissions:
  discussions: write
  pull_requests: read
  issues: read
  contents: read
outputs:
  create-discussion: true
inputs:
  issues:
    states:
      - open
      - closed
    limit: 50
  pull_requests:
    states:
      - open
      - closed
      - merged
    limit: 50
  discussions:
    limit: 20
  commits:
    branches:
      - main
    limit: 100
  releases:
    prerelease: false
    draft: false
    limit: 10
  workflow_runs:
    status:
      - failure
      - success
    limit: 30
  since: last-run
  min_items: 1
allowed_users:
  - your-username  # Replace with your GitHub username
rate_limit_minutes: 720  # Once every 12 hours max
---

You are a daily activity report agent for this GitHub repository.

## Your Task

Analyze the collected repository data and create a comprehensive daily activity report. Your report should:

1. **Summarize Key Metrics**
   - Total number of issues (opened vs closed)
   - Total number of PRs (opened vs merged vs closed)
   - Active discussions
   - Commit activity
   - New releases
   - Workflow health (success vs failure rate)

2. **Highlight Important Items**
   - Critical issues that need attention
   - PRs ready for review or recently merged
   - Failed workflows that need investigation
   - Notable commits or features shipped

3. **Provide Insights**
   - Are there any concerning trends?
   - What's blocking progress?
   - What achievements should be celebrated?

## Output Format

Create a well-formatted daily report discussion with:
- Clear title: "Daily Report - YYYY-MM-DD"
- Executive summary at the top
- Detailed sections for each activity type
- Action items or recommendations
- Use emojis for visual organization

**Important**: Only include this in your output if there's meaningful activity to report. If it's a quiet day with minimal changes, keep the report concise.

Use the `create-discussion` output to post your report as a new discussion in the "Daily Update" category.
```

## Key Feature: Inputs System

This agent showcases the **inputs system**, which automatically collects repository data before Claude runs. This is different from issue triage or PR review, where Claude only sees the specific event (one issue or PR).

### What Gets Collected

The `inputs` configuration tells gh-claude to fetch:

```yaml
inputs:
  issues:
    states: [open, closed]
    limit: 50
  pull_requests:
    states: [open, closed, merged]
    limit: 50
  discussions:
    limit: 20
  commits:
    branches: [main]
    limit: 100
  releases:
    prerelease: false
    draft: false
    limit: 10
  workflow_runs:
    status: [failure, success]
    limit: 30
  since: last-run  # Only fetch data since the last successful run
  min_items: 1     # Skip if no data collected
```

### Time Filtering

The `since: last-run` setting is powerful:
- First run: Collects data from the past 24 hours
- Subsequent runs: Collects data since the last successful workflow run
- Prevents duplicate reporting
- Handles irregular schedules gracefully

You can also use specific time ranges:
- `since: 1h` - Last hour
- `since: 24h` - Last 24 hours
- `since: 7d` - Last 7 days
- `since: last-run` - Since last successful run (recommended)

### Minimum Items Threshold

`min_items: 1` means:
- If no activity occurred, the workflow skips Claude execution entirely
- Saves API costs on quiet days
- No empty reports cluttering discussions

## Generated Workflow Explained

The daily summary workflow has a different structure than event-triggered agents:

### Job 1: Pre-Flight Validation

Similar to other agents, but with additional `allowed_users` check:
- Only specified users can manually trigger via `workflow_dispatch`
- Scheduled runs bypass user authorization (since GitHub Actions triggers them)
- Rate limit: 720 minutes (12 hours) prevents excessive runs

### Job 2: Collect Inputs (Unique to Input-Based Agents)

This job runs **before** the Claude agent job:

1. **Fetch Issues**: Uses `gh api repos/{owner}/{repo}/issues` with state and time filters
2. **Fetch Pull Requests**: Similar API call with PR-specific filtering
3. **Fetch Discussions**: Uses GitHub GraphQL API for discussions
4. **Fetch Commits**: Gets commits from specified branches
5. **Fetch Releases**: Retrieves release information
6. **Fetch Workflow Runs**: Checks CI/CD health
7. **Format Data**: Structures collected data as markdown sections
8. **Check Threshold**: Counts total items and sets `has-inputs=true/false`
9. **Output Data**: Stores formatted markdown in `inputs-data` output variable

**Important**: If `min_items` threshold isn't met, this job sets `has-inputs=false` and the Claude agent job is skipped.

### Job 3: Claude Agent Execution

Runs only if `needs.pre-flight.outputs.has-inputs == 'true'`

Context provided to Claude includes:
```markdown
## Issues (15 items)

### Opened
- #234 "Bug: Login fails on Safari" by @user1 (2024-01-15)
- #235 "Feature: Dark mode support" by @user2 (2024-01-15)

### Closed
- #230 "Fix typo in README" by @user3 (2024-01-15)

## Pull Requests (8 items)

### Merged
- #45 "Add authentication middleware" by @dev1 (merged 2024-01-15)

### Opened
- #47 "Update dependencies" by @dependabot (opened 2024-01-15)

## Commits (23 items)

- abc123 "Fix login bug" by @user1
- def456 "Update docs" by @user2

... (and so on for all input types)
```

Claude analyzes this pre-collected data and creates a comprehensive summary.

### Job 4: Execute Outputs

Validates and executes the `create-discussion` output:
- Checks JSON format
- Validates required fields (title, body, category)
- Creates discussion via GitHub API
- Reports errors if validation fails

## How It Works: Step-by-Step

### 1. Scheduled Trigger

Every weekday at 9 AM UTC, GitHub Actions triggers the workflow.

### 2. Pre-Flight Validation

Checks pass:
- API credentials configured
- Rate limit allows run (last run was >12 hours ago)

### 3. Input Collection

The workflow fetches data since the last successful run (yesterday 9 AM):

**Collected data**:
- 12 issues (5 opened, 7 closed)
- 8 pull requests (3 opened, 4 merged, 1 closed)
- 2 new discussions
- 45 commits to main branch
- 0 new releases
- 15 workflow runs (12 success, 3 failures)

**Total items**: 82 (exceeds `min_items: 1`, so `has-inputs=true`)

### 4. Data Formatted

The collection job formats data as markdown:
```markdown
## Issues (12 items)

### Opened (5)
- #456 "Bug: Export function throws error" by @contributor1 (2024-01-15T10:30:00Z)
  Labels: bug, needs-triage
  https://github.com/yourorg/repo/issues/456

- #457 "Feature request: Add dark mode" by @contributor2 (2024-01-15T11:45:00Z)
  Labels: enhancement
  https://github.com/yourorg/repo/issues/457
...

## Pull Requests (8 items)

### Merged (4)
- #123 "Fix export bug" by @dev1 (merged 2024-01-15T12:00:00Z)
  Files changed: 3, +45 -12
  https://github.com/yourorg/repo/pull/123
...

## Commits (45 items)

- abc123 "Fix export function error handling" by @dev1 (2024-01-15T11:30:00Z)
- def456 "Update dependencies" by @dependabot (2024-01-15T09:05:00Z)
...
```

### 5. Claude Analysis

Claude receives the formatted data and instructions, then:

1. **Analyzes metrics**:
   - 5 issues opened, 7 closed (net -2, good trend)
   - 4 PRs merged, 3 opened (active development)
   - 3 failed workflow runs (needs investigation)
2. **Identifies highlights**:
   - PR #123 fixes critical bug
   - Discussion about API redesign is active
   - Failed workflows need attention
3. **Generates insights**:
   - More issues closed than opened (positive trend)
   - CI failures need immediate attention
   - Active community engagement in discussions

Claude creates `/tmp/outputs/create-discussion.json`:
```json
{
  "title": "Daily Report - 2024-01-15",
  "body": "# Daily Activity Report - January 15, 2024\n\n## 📊 Executive Summary\n\nActive day with **5 new issues**, **4 merged PRs**, and **45 commits**. Good progress overall, but **3 workflow failures** need attention.\n\n### Key Metrics\n- Issues: 5 opened, 7 closed (net -2 ✅)\n- Pull Requests: 3 opened, 4 merged, 1 closed\n- Commits: 45 commits to main\n- CI Health: 80% success rate (12/15 runs)\n\n## 🐛 Issues\n\n### Opened (5)\n- [#456](https://github.com/yourorg/repo/issues/456) **Bug: Export function throws error** by @contributor1\n  - **Priority**: High - Critical bug affecting exports\n- [#457](https://github.com/yourorg/repo/issues/457) **Feature request: Add dark mode** by @contributor2\n...\n\n### Closed (7)\nGreat progress closing issues today!\n- [#450](https://github.com/yourorg/repo/issues/450) Fixed login bug\n...\n\n## 🔀 Pull Requests\n\n### Merged (4) ✅\n- [#123](https://github.com/yourorg/repo/pull/123) **Fix export bug** by @dev1\n  - Addresses issue #456, improves error handling\n  - Files changed: 3, +45 -12\n...\n\n### Opened (3)\n- [#125](https://github.com/yourorg/repo/pull/125) **Update dependencies** by @dependabot\n...\n\n## 💬 Discussions (2)\n\n- **API Redesign Proposal** - Active discussion with 8 comments\n- **Performance optimization ideas** - New discussion started\n\n## 📦 Commits (45)\n\nTop contributors:\n- @dev1: 12 commits\n- @dev2: 8 commits\n- @dependabot: 5 commits\n\n## ⚠️ Action Items\n\n1. **CI Failures**: 3 workflow runs failed (builds on PR #124, #125)\n   - Investigate and fix ASAP\n2. **High Priority Issue**: #456 export bug needs immediate attention\n3. **Review Queue**: 3 PRs waiting for review\n\n## 🎉 Highlights\n\n- Merged critical bug fix (#123)\n- 7 issues resolved (great cleanup!)\n- Active community engagement in discussions\n\n---\n*Automated report generated by gh-claude*",
  "category": "General"
}
```

### 6. Discussion Created

The workflow validates the output and creates a new discussion in the repository with the report.

### 7. Team Sees Report

Team members receive a notification about the new discussion and can:
- Review the summary quickly
- Click links to investigate issues/PRs
- Respond to action items
- Discuss trends in the comments

## Expected Output Examples

### Example 1: Active Day

```markdown
# Daily Activity Report - January 15, 2024

## 📊 Executive Summary

Busy day with significant progress! **8 new issues**, **6 merged PRs**, and **1 new release**.

### Key Metrics
- Issues: 8 opened, 12 closed (net -4 ✅)
- Pull Requests: 5 opened, 6 merged
- Commits: 67 commits to main
- Release: v2.1.0 shipped!
- CI Health: 95% success rate

## 🐛 Issues

### Critical Issues Opened
⚠️ [#501] Security: XSS vulnerability in comment rendering
- **Action Required**: Immediate security patch needed

### Opened (7 more)
- [#502] Bug: Memory leak in WebSocket connection
- [#503] Feature: Add export to CSV functionality
...

### Closed (12) ✅
Great cleanup today!
...

## 🔀 Pull Requests

### Merged (6) ✅
- [#234] **Security fix: Sanitize user input** by @security-team
  - Addresses #501, critical security patch
- [#235] **Feature: CSV export** by @dev1
  - Implements #503
...

## 📦 Release: v2.1.0

🎉 New release shipped today!
- 3 new features
- 5 bug fixes
- 2 performance improvements

[View release notes](link)

## ⚠️ Action Items

1. **Security**: Issue #501 needs immediate patch (already merged in #234)
2. **Memory leak**: #502 needs investigation
3. **Review queue**: 5 PRs waiting for review

## 🎉 Highlights

- v2.1.0 released successfully
- Security vulnerability found and patched same day
- 12 issues resolved (highest this week!)
```

### Example 2: Quiet Day

```markdown
# Daily Activity Report - January 16, 2024

## 📊 Executive Summary

Quiet day with minimal activity. 2 dependency updates and routine maintenance.

### Key Metrics
- Issues: 1 opened, 1 closed
- Pull Requests: 2 opened (both Dependabot), 0 merged
- Commits: 5 commits to main
- CI Health: 100% success rate (3/3)

## 🐛 Issues

### Opened (1)
- [#510] Question: How to configure custom webhooks

### Closed (1)
- [#508] Docs: Fix typo in README

## 🔀 Pull Requests

### Opened (2)
Both are automated dependency updates:
- [#240] Bump typescript from 5.0.0 to 5.1.0
- [#241] Bump @types/node from 18.0.0 to 18.1.0

## 📦 Commits (5)

Minor updates and cleanup:
- Documentation improvements
- Test file cleanup

## 💬 Discussions

No new discussions today.

## 🎉 Highlights

- All CI runs passed ✅
- Dependencies staying up to date

Quiet day overall—time to focus on the next sprint!
```

### Example 3: CI Health Alert

```markdown
# Daily Activity Report - January 17, 2024

## 📊 Executive Summary

⚠️ **CI health degraded** - Multiple workflow failures need investigation.

### Key Metrics
- Issues: 3 opened, 2 closed
- Pull Requests: 4 opened, 1 merged
- Commits: 34 commits to main
- CI Health: 40% success rate (6/15 runs) ⚠️

## ⚠️ Critical: CI Failures

**9 workflow runs failed** - this is unusual and needs immediate attention.

### Failure Analysis
- **Build errors** (5 failures): TypeScript compilation errors on main
- **Test failures** (3 failures): Integration tests timing out
- **Lint errors** (1 failure): ESLint violations

### Affected PRs
- #245, #246, #247, #248 - All blocked by failing builds

## 🐛 Issues

...

## ⚠️ Urgent Action Items

1. **Fix main branch build**: TypeScript errors blocking all PRs
2. **Investigate test timeouts**: Integration tests failing intermittently
3. **Unblock PRs**: 4 PRs waiting on CI fixes

## Recommendations

- Consider reverting recent changes to main if root cause not found quickly
- Review recent commits for breaking changes
- Check if external service dependencies are causing test failures
```

## Variations and Customization Ideas

### 1. Weekly Digest Instead of Daily

```yaml
on:
  schedule:
    - cron: '0 9 * * MON'  # Every Monday at 9 AM

inputs:
  since: 7d  # Last 7 days instead of last-run
```

### 2. Focus on Specific Activity Types

Only track issues and PRs:

```yaml
inputs:
  issues:
    states: [open, closed]
    limit: 100
  pull_requests:
    states: [open, closed, merged]
    limit: 100
  since: last-run
  min_items: 1
  # Omit discussions, commits, releases, workflow_runs
```

### 3. Team-Specific Reports

Create separate reports for different teams:

```markdown
## Frontend Team Activity

Filter the data for frontend-related items:
- Issues with `component: frontend` label
- PRs modifying files in `src/frontend/`
- Commits by frontend team members

## Backend Team Activity

- Issues with `component: backend` label
- PRs modifying files in `src/backend/`
- Commits by backend team members
```

### 4. Contributor Recognition

Highlight top contributors:

```markdown
## 🏆 Top Contributors

Based on today's activity:
1. @dev1 - 12 commits, 3 PRs merged
2. @dev2 - 8 commits, 2 issues resolved
3. @contributor1 - First-time contributor! 🎉

Thank you for your contributions!
```

### 5. Trend Analysis

Compare to previous periods:

```markdown
## 📈 Trends

Compared to last week:
- Issues opened: +20% ⬆️
- PRs merged: -10% ⬇️
- CI success rate: +5% ⬆️

The increase in issues is expected with the recent release.
```

### 6. Custom Time Zones

Adjust schedule for your team's timezone:

```yaml
on:
  schedule:
    - cron: '0 13 * * 1-5'  # 1 PM UTC = 9 AM EST
    - cron: '0 17 * * 1-5'  # 5 PM UTC = 1 PM EST (afternoon update)
```

### 7. Slack/Email Integration

Post summary to external channels:

```markdown
## Slack Summary

For the Slack #daily-updates channel:

📊 Today: 5 issues, 4 PRs merged, 3 CI failures
⚠️ Action needed: CI health degraded
🎉 Highlight: v2.1.0 released

[Full report](link to discussion)
```

Then use another workflow to post to Slack.

### 8. Milestone Progress

Track progress toward milestones:

```markdown
## 🎯 Milestone Progress

### v3.0.0 Release (Due: Jan 31)
- Open issues: 12 (was 15 yesterday)
- Completed: 78% (45/58 issues)
- On track: ✅

### Q1 Goals
- Performance improvements: 3/5 completed
- New features: 2/3 completed
```

## Common Issues and Troubleshooting

### Issue: Report is empty even with activity

**Possible causes**:
1. `min_items` threshold not met
2. `since` filter excludes all data
3. Input collection failing

**Debug**:
- Check the "pre-flight" job logs for `has-inputs` output
- Look at "collect-inputs" step output to see what was fetched
- Verify time filtering is working correctly

**Fix**:
```yaml
min_items: 0  # Always run even with no data
# Or
since: 24h  # Use fixed time window instead of last-run
```

### Issue: Too much data, report is overwhelming

**Possible causes**:
- Limits are too high
- Time window too large
- Too many input types enabled

**Fix**:
```yaml
inputs:
  issues:
    limit: 20  # Reduce from 50
  pull_requests:
    limit: 20  # Reduce from 50
  commits:
    limit: 20  # Reduce from 100
  # Only show critical data
```

Or in instructions:
```markdown
Focus on the most important items:
- Only mention high-priority issues
- Highlight merged PRs, skip opened ones
- Summarize commits by contributor, don't list all
```

### Issue: Reports miss recent activity

**Possible causes**:
- Time filtering issues (timezone mismatch)
- `last-run` reference uses wrong workflow

**Fix**:
```yaml
since: 24h  # Use fixed 24-hour window
```

Or verify cron schedule matches your expectations.

### Issue: Cost is too high

**Possible causes**:
- Large amounts of input data
- Daily schedule too frequent
- Reports are very detailed

**Optimizations**:
1. **Reduce frequency**:
   ```yaml
   schedule:
     - cron: '0 9 * * MON,WED,FRI'  # 3x per week instead of daily
   ```

2. **Reduce data collection**:
   ```yaml
   inputs:
     issues:
       limit: 10  # Lower limits
     pull_requests:
       limit: 10
     # Remove unused inputs
   ```

3. **Use concise reporting**:
   ```markdown
   Keep reports under 500 words. Use bullet points, avoid prose.
   ```

4. **Skip quiet days**:
   ```yaml
   min_items: 10  # Only run if meaningful activity
   ```

### Issue: Discussion category doesn't exist

**Possible causes**:
- Repository doesn't have discussions enabled
- Category name is incorrect

**Fix**:
1. Enable discussions in repository settings
2. Create a "Daily Updates" or "General" category
3. Update the output to match existing category:
   ```json
   {
     "category": "General"  # or whatever category exists
   }
   ```

### Issue: Workflow runs every time manually triggered

**Possible causes**:
- Rate limit bypassed for `workflow_dispatch`

**Expected behavior**: Rate limiting should still apply. Check the `allowed_users` list ensures only authorized users can manually trigger.

## Cost Estimate

Typical cost per daily report:

- **Model**: Claude 3.5 Sonnet
- **Input tokens**: ~5,000-15,000 (large amounts of collected data)
  - Varies significantly based on repository activity
- **Output tokens**: ~1,000-2,000 (comprehensive report)
- **Cost per run**: ~$0.05-$0.15 (5-15 cents)

For a repository running daily reports:
- Frequency: 5 days/week (weekdays only)
- Runs per month: ~20
- Monthly cost: ~$1-$3

**Cost optimization strategies**:

1. **Reduce frequency**: Weekly instead of daily saves 75% cost
2. **Lower data limits**: Reduce `limit` values by 50%
3. **Skip quiet days**: Set `min_items: 10` to avoid empty reports
4. **Concise reports**: Instruct Claude to be brief
5. **Use Haiku for simple summaries**: 10x cheaper

**Example budget-optimized configuration**:
```yaml
schedule:
  - cron: '0 9 * * MON'  # Weekly only

inputs:
  issues:
    limit: 20  # Reduced from 50
  pull_requests:
    limit: 20  # Reduced from 50
  commits:
    limit: 30  # Reduced from 100
  since: 7d
  min_items: 5  # Skip very quiet weeks

claude:
  model: claude-3-5-haiku-20241022  # Use Haiku instead of Sonnet
```

This reduces cost to ~$0.10/week = ~$0.40/month.

## Advanced: Multi-Repository Dashboard

Create a summary across multiple repositories:

### Setup

Create one "dashboard" repository with a daily summary agent that:

1. Uses GitHub API to fetch data from multiple repos
2. Aggregates activity across all repositories
3. Posts organization-wide summary

```markdown
## Your Task

Fetch activity from these repositories:
- yourorg/repo1
- yourorg/repo2
- yourorg/repo3

For each repository, collect:
- Open issues and PRs
- Recent merges
- CI health

Create an organization-wide summary showing:
- Most active repositories
- Cross-repo trends
- Organization-wide metrics
```

### Example Output

```markdown
# Organization Activity Report - January 15, 2024

## 📊 Overview

Activity across 12 repositories:
- 23 issues opened, 31 closed
- 15 PRs merged, 8 opened
- Average CI health: 92%

## 🔥 Most Active Repositories

1. **repo1**: 15 issues, 8 PRs merged
2. **repo2**: 8 issues, 5 PRs merged
3. **repo3**: 5 issues, 2 PRs merged

## ⚠️ Repositories Needing Attention

- **repo4**: CI health 60% (investigate)
- **repo5**: 12 stale PRs (> 30 days old)
```

## Related Examples

- [Issue Triage](issue-triage/) - Automatically triage incoming issues
- [PR Review](pr-review/) - Automatically review pull requests
