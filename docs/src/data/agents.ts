export type AgentStatus = 'available' | 'planned';

export type AgentCategory =
  | 'issue-management'
  | 'code-review'
  | 'repository-maintenance'
  | 'community-communication'
  | 'documentation'
  | 'security-compliance'
  | 'release-management'
  | 'project-intelligence';

export type OutputType =
  | 'add-comment'
  | 'add-label'
  | 'remove-label'
  | 'create-issue'
  | 'create-discussion'
  | 'create-pr'
  | 'update-file'
  | 'close-issue'
  | 'close-pr';

export interface AgentOutput {
  type: OutputType;
  config?: {
    max?: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  category: AgentCategory;
  description: string;
  outputs: AgentOutput[];
  allowedPaths?: string[];
  capabilities?: string[];
  exampleLink?: string;
  yamlSnippet: string;
}

export interface CategoryInfo {
  id: AgentCategory;
  label: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'issue-management',
    label: 'Issue Management',
    icon: 'document',
    description: 'Triage, categorize, and respond to issues automatically',
  },
  {
    id: 'code-review',
    label: 'Code Review',
    icon: 'magnifier',
    description: 'Analyze pull requests for quality, security, and style',
  },
  {
    id: 'repository-maintenance',
    label: 'Repository Maintenance',
    icon: 'setting',
    description: 'Keep your repository clean and organized',
  },
  {
    id: 'community-communication',
    label: 'Community & Communication',
    icon: 'comment',
    description: 'Engage with contributors and maintain community health',
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: 'open-book',
    description: 'Keep docs in sync with code changes',
  },
  {
    id: 'security-compliance',
    label: 'Security & Compliance',
    icon: 'shield',
    description: 'Monitor for vulnerabilities and enforce policies',
  },
  {
    id: 'release-management',
    label: 'Release Management',
    icon: 'rocket',
    description: 'Automate release notes and version management',
  },
  {
    id: 'project-intelligence',
    label: 'Project Intelligence',
    icon: 'star',
    description: 'Generate insights and analytics about your project',
  },
];

export const OUTPUT_LABELS: Record<OutputType, string> = {
  'add-comment': 'Add Comment',
  'add-label': 'Add Label',
  'remove-label': 'Remove Label',
  'create-issue': 'Create Issue',
  'create-discussion': 'Create Discussion',
  'create-pr': 'Create PR',
  'update-file': 'Update File',
  'close-issue': 'Close Issue',
  'close-pr': 'Close PR',
};

export const AGENTS: Agent[] = [
  // Issue Management Agents
  {
    id: 'issue-triage',
    name: 'Issue Triage Agent',
    status: 'available',
    category: 'issue-management',
    description:
      'Automatically categorizes and prioritizes new issues, welcomes contributors, and adds appropriate labels.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }, { type: 'add-label' }],
    exampleLink: '/gh-claude/examples/issue-triage',
    yamlSnippet: `on:
  issues:
    types: [opened]
outputs:
  add-comment: { max: 1 }
  add-label: true`,
  },
  {
    id: 'duplicate-detective',
    name: 'Duplicate Detective Agent',
    status: 'planned',
    category: 'issue-management',
    description:
      'Analyzes new issues against existing open and closed issues to detect potential duplicates. Links related issues together and suggests closing duplicates.',
    outputs: [
      { type: 'add-comment', config: { max: 1 } },
      { type: 'add-label' },
      { type: 'close-issue' },
    ],
    capabilities: [
      'Semantic similarity matching across issue titles and bodies',
      'Links to potential duplicates with confidence scores',
      'Suggests merging discussions when appropriate',
      'Learns from manual duplicate resolutions',
    ],
    yamlSnippet: `on:
  issues:
    types: [opened, edited]
outputs:
  add-comment: { max: 1 }
  add-label: true
  close-issue: true`,
  },
  {
    id: 'issue-decomposer',
    name: 'Issue Decomposer Agent',
    status: 'planned',
    category: 'issue-management',
    description:
      'Breaks down large, complex issues into smaller, actionable tasks. Creates linked sub-issues and suggests an implementation order.',
    outputs: [
      { type: 'create-issue', config: { max: 10 } },
      { type: 'add-comment', config: { max: 1 } },
      { type: 'add-label' },
    ],
    capabilities: [
      'Identifies components and dependencies within large issues',
      'Creates well-structured sub-issues with clear acceptance criteria',
      'Establishes parent-child relationships',
      'Suggests milestone assignments',
    ],
    yamlSnippet: `on:
  issues:
    types: [labeled]
    labels: [epic, large]
outputs:
  create-issue: { max: 10 }
  add-comment: { max: 1 }
  add-label: true`,
  },
  {
    id: 'bug-reproducer',
    name: 'Bug Reproducer Agent',
    status: 'planned',
    category: 'issue-management',
    description:
      'Analyzes bug reports and attempts to create minimal reproduction steps. Identifies missing information and guides reporters through providing necessary details.',
    outputs: [{ type: 'add-comment', config: { max: 2 } }, { type: 'add-label' }],
    capabilities: [
      'Extracts and validates reproduction steps',
      'Identifies missing environment information',
      'Generates reproduction checklists',
      'Tags issues as `needs-reproduction` or `reproduced`',
    ],
    yamlSnippet: `on:
  issues:
    types: [opened, edited]
    labels: [bug]
outputs:
  add-comment: { max: 2 }
  add-label: true`,
  },

  // Code Review Agents
  {
    id: 'pr-review',
    name: 'PR Review Agent',
    status: 'available',
    category: 'code-review',
    description:
      'Performs initial code review on pull requests, checking for common issues, missing tests, and documentation gaps.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }, { type: 'add-label' }],
    exampleLink: '/gh-claude/examples/pr-review',
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
outputs:
  add-comment: { max: 1 }
  add-label: true`,
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner Agent',
    status: 'planned',
    category: 'code-review',
    description:
      'Deep security analysis of code changes. Identifies potential vulnerabilities, insecure patterns, and suggests fixes.',
    outputs: [{ type: 'add-comment', config: { max: 3 } }, { type: 'add-label' }],
    capabilities: [
      'OWASP Top 10 vulnerability detection',
      'Secrets and credential exposure scanning',
      'Dependency vulnerability cross-referencing',
      'Security-focused code suggestions',
      'Compliance checkpoint verification',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
outputs:
  add-comment: { max: 3 }
  add-label: true`,
  },
  {
    id: 'architecture-guardian',
    name: 'Architecture Guardian Agent',
    status: 'planned',
    category: 'code-review',
    description:
      'Enforces architectural decisions and patterns. Detects violations of established conventions and suggests corrections.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }, { type: 'add-label' }],
    capabilities: [
      'Layer boundary enforcement (e.g., no UI calling database directly)',
      'Dependency direction validation',
      'Pattern consistency checking',
      'Module boundary protection',
      'Custom architecture rule definitions',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
outputs:
  add-comment: { max: 1 }
  add-label: true`,
  },
  {
    id: 'performance-analyst',
    name: 'Performance Analyst Agent',
    status: 'planned',
    category: 'code-review',
    description:
      'Analyzes code changes for potential performance implications. Identifies inefficient patterns and suggests optimizations.',
    outputs: [{ type: 'add-comment', config: { max: 2 } }, { type: 'add-label' }],
    capabilities: [
      'Algorithm complexity analysis',
      'N+1 query detection',
      'Memory leak pattern identification',
      'Bundle size impact estimation',
      'Database query optimization suggestions',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
outputs:
  add-comment: { max: 2 }
  add-label: true`,
  },
  {
    id: 'test-coverage-advisor',
    name: 'Test Coverage Advisor Agent',
    status: 'planned',
    category: 'code-review',
    description:
      'Analyzes PR changes and suggests specific test cases that should be written. Can generate test skeletons for new functionality.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }, { type: 'update-file' }],
    allowedPaths: ['tests/**', '**/*.test.*', '**/*.spec.*'],
    capabilities: [
      'Edge case identification',
      'Test skeleton generation',
      'Coverage gap analysis',
      'Integration test suggestions',
      'Mutation testing recommendations',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
outputs:
  add-comment: { max: 1 }
  update-file: true
allowed-paths:
  - "tests/**"
  - "**/*.test.*"
  - "**/*.spec.*"`,
  },

  // Repository Maintenance Agents
  {
    id: 'stale-issue-manager',
    name: 'Stale Issue Manager',
    status: 'available',
    category: 'repository-maintenance',
    description:
      'Identifies inactive issues, adds warning labels, and closes after extended inactivity.',
    outputs: [{ type: 'add-label' }, { type: 'add-comment' }, { type: 'close-issue' }],
    exampleLink: '/gh-claude/examples/daily-summary',
    yamlSnippet: `on:
  schedule:
    - cron: '0 9 * * 1'
outputs:
  add-label: true
  add-comment: true
  close-issue: true`,
  },
  {
    id: 'dependency-shepherd',
    name: 'Dependency Shepherd Agent',
    status: 'planned',
    category: 'repository-maintenance',
    description:
      'Monitors dependency updates and creates organized, prioritized PRs for updates. Groups related updates and assesses breaking change risk.',
    outputs: [{ type: 'create-pr', config: { max: 5 } }, { type: 'add-label' }],
    capabilities: [
      'Semantic versioning analysis',
      'Breaking change detection from changelogs',
      'Dependency grouping (e.g., all testing libs together)',
      'Security update prioritization',
      'Compatibility verification suggestions',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 6 * * 1'
  repository_dispatch:
    types: [dependency-update]
outputs:
  create-pr: { max: 5 }
  add-label: true`,
  },
  {
    id: 'branch-janitor',
    name: 'Branch Janitor Agent',
    status: 'planned',
    category: 'repository-maintenance',
    description:
      'Cleans up merged and stale branches. Notifies owners before deletion and maintains branch hygiene.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }],
    capabilities: [
      'Merged branch identification and cleanup',
      'Stale branch detection with owner notification',
      'Protected branch awareness',
      'Branch naming convention enforcement',
      'Activity-based retention policies',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 0 * * 0'
  pull_request:
    types: [closed]
outputs:
  add-comment: { max: 1 }`,
  },
  {
    id: 'label-librarian',
    name: 'Label Librarian Agent',
    status: 'planned',
    category: 'repository-maintenance',
    description:
      'Maintains label consistency across the repository. Suggests label consolidation, creates missing standard labels, and enforces naming conventions.',
    outputs: [
      { type: 'add-label' },
      { type: 'remove-label' },
      { type: 'add-comment', config: { max: 1 } },
    ],
    capabilities: [
      'Label taxonomy management',
      'Duplicate label detection',
      'Automatic label normalization',
      'Color scheme consistency',
      'Usage analytics and cleanup suggestions',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 0 1 * *'
  issues:
    types: [labeled]
outputs:
  add-label: true
  remove-label: true
  add-comment: { max: 1 }`,
  },

  // Community & Communication Agents
  {
    id: 'first-timer-welcome',
    name: 'First-Timer Welcome Agent',
    status: 'planned',
    category: 'community-communication',
    description:
      'Provides a warm welcome to first-time contributors. Guides them through contribution guidelines and offers mentorship resources.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }, { type: 'add-label' }],
    capabilities: [
      'First-time contributor detection',
      'Personalized welcome messages',
      'Contribution guide summarization',
      'Mentor assignment suggestions',
      'Good first issue recommendations',
    ],
    yamlSnippet: `on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]
outputs:
  add-comment: { max: 1 }
  add-label: true`,
  },
  {
    id: 'discussion-facilitator',
    name: 'Discussion Facilitator Agent',
    status: 'planned',
    category: 'community-communication',
    description:
      'Monitors discussions and helps keep conversations productive. Summarizes long threads, identifies action items, and suggests resolutions.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }],
    capabilities: [
      'Thread summarization',
      'Action item extraction',
      'Decision documentation',
      'Off-topic detection',
      'Resolution suggestions',
    ],
    yamlSnippet: `on:
  discussion:
    types: [created]
  discussion_comment:
    types: [created]
outputs:
  add-comment: { max: 1 }`,
  },
  {
    id: 'contributor-spotlight',
    name: 'Contributor Spotlight Agent',
    status: 'planned',
    category: 'community-communication',
    description:
      'Celebrates contributor achievements and milestones. Creates periodic recognition posts and maintains contributor statistics.',
    outputs: [{ type: 'create-issue', config: { max: 1 } }],
    capabilities: [
      'Contribution milestone tracking',
      'Monthly/quarterly recognition posts',
      'First PR celebrations',
      'Streak and consistency tracking',
      'Leaderboard generation',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 12 1 * *'
outputs:
  create-issue: { max: 1 }`,
  },
  {
    id: 'translation-coordinator',
    name: 'Translation Coordinator Agent',
    status: 'planned',
    category: 'community-communication',
    description:
      'Manages internationalization efforts. Identifies untranslated content, coordinates translation PRs, and validates translations.',
    outputs: [
      { type: 'add-comment', config: { max: 2 } },
      { type: 'add-label' },
      { type: 'create-issue', config: { max: 5 } },
    ],
    capabilities: [
      'Missing translation detection',
      'Translation PR coordination',
      'String extraction automation',
      'Translation quality suggestions',
      'Locale coverage tracking',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
  issues:
    types: [opened]
    labels: [translation]
outputs:
  add-comment: { max: 2 }
  add-label: true
  create-issue: { max: 5 }`,
  },

  // Documentation Agents
  {
    id: 'doc-sync',
    name: 'Doc Sync Agent',
    status: 'planned',
    category: 'documentation',
    description:
      'Monitors code changes and identifies documentation that needs updating. Creates issues for doc updates and can draft documentation changes.',
    outputs: [
      { type: 'create-issue', config: { max: 3 } },
      { type: 'add-comment', config: { max: 1 } },
    ],
    capabilities: [
      'API change to doc mapping',
      'README staleness detection',
      'Changelog preparation',
      'Example code validation',
      'Documentation coverage analysis',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [closed]
    branches: [main]
outputs:
  create-issue: { max: 3 }
  add-comment: { max: 1 }`,
  },
  {
    id: 'api-documentarian',
    name: 'API Documentarian Agent',
    status: 'planned',
    category: 'documentation',
    description:
      'Automatically generates and updates API documentation from code changes. Maintains OpenAPI specs and SDK documentation.',
    outputs: [{ type: 'update-file' }, { type: 'create-pr', config: { max: 1 } }],
    allowedPaths: ['docs/api/**', 'openapi.yaml'],
    capabilities: [
      'OpenAPI spec generation',
      'Endpoint documentation extraction',
      'Request/response example generation',
      'Breaking change documentation',
      'SDK code sample updates',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [closed]
    branches: [main]
outputs:
  update-file: true
  create-pr: { max: 1 }
allowed-paths:
  - "docs/api/**"
  - "openapi.yaml"`,
  },
  {
    id: 'tutorial-guardian',
    name: 'Tutorial Guardian Agent',
    status: 'planned',
    category: 'documentation',
    description:
      'Validates that tutorials and guides still work with the current codebase. Runs through documented steps and reports issues.',
    outputs: [{ type: 'create-issue', config: { max: 5 } }, { type: 'add-label' }],
    capabilities: [
      'Tutorial step validation',
      'Code snippet testing',
      'Dependency version checking',
      'Screenshot staleness detection',
      'Interactive example verification',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 0 * * 0'
  pull_request:
    types: [closed]
    branches: [main]
outputs:
  create-issue: { max: 5 }
  add-label: true`,
  },

  // Security & Compliance Agents
  {
    id: 'license-auditor',
    name: 'License Auditor Agent',
    status: 'planned',
    category: 'security-compliance',
    description:
      'Monitors dependencies for license compliance. Alerts on incompatible licenses and maintains license documentation.',
    outputs: [
      { type: 'add-comment', config: { max: 1 } },
      { type: 'add-label' },
      { type: 'create-issue', config: { max: 1 } },
    ],
    capabilities: [
      'Dependency license scanning',
      'License compatibility checking',
      'SBOM generation',
      'License file maintenance',
      'Compliance report generation',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
  schedule:
    - cron: '0 0 * * 1'
outputs:
  add-comment: { max: 1 }
  add-label: true
  create-issue: { max: 1 }`,
  },
  {
    id: 'secret-sentinel',
    name: 'Secret Sentinel Agent',
    status: 'planned',
    category: 'security-compliance',
    description:
      'Scans commits and PRs for accidentally committed secrets. Provides immediate alerts and remediation guidance.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }, { type: 'add-label' }],
    capabilities: [
      'Pattern-based secret detection',
      'Entropy analysis for random strings',
      'Known secret format recognition',
      'Remediation step guidance',
      'Historical commit scanning',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize]
  push:
    branches: ['**']
outputs:
  add-comment: { max: 1 }
  add-label: true`,
  },
  {
    id: 'compliance-checker',
    name: 'Compliance Checker Agent',
    status: 'planned',
    category: 'security-compliance',
    description:
      'Enforces regulatory and organizational compliance requirements. Validates that PRs meet defined standards before merge.',
    outputs: [{ type: 'add-comment', config: { max: 1 } }, { type: 'add-label' }],
    capabilities: [
      'Custom compliance rule enforcement',
      'Audit trail documentation',
      'Required approver verification',
      'Policy violation reporting',
      'Compliance certificate generation',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
outputs:
  add-comment: { max: 1 }
  add-label: true`,
  },

  // Release Management Agents
  {
    id: 'changelog-curator',
    name: 'Changelog Curator Agent',
    status: 'planned',
    category: 'release-management',
    description:
      'Automatically generates and maintains changelogs from merged PRs. Categorizes changes and writes human-readable release notes.',
    outputs: [{ type: 'update-file' }, { type: 'create-pr', config: { max: 1 } }],
    allowedPaths: ['CHANGELOG.md', 'RELEASE_NOTES.md'],
    capabilities: [
      'PR categorization (features, fixes, breaking changes)',
      'Conventional commit parsing',
      'Release note prose generation',
      'Contributor attribution',
      'Version bump suggestions',
    ],
    yamlSnippet: `on:
  pull_request:
    types: [closed]
    branches: [main]
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version'
        required: true
outputs:
  update-file: true
  create-pr: { max: 1 }
allowed-paths:
  - "CHANGELOG.md"
  - "RELEASE_NOTES.md"`,
  },
  {
    id: 'release-captain',
    name: 'Release Captain Agent',
    status: 'planned',
    category: 'release-management',
    description:
      'Orchestrates the release process. Creates release branches, manages version bumps, and coordinates release activities.',
    outputs: [
      { type: 'create-pr', config: { max: 2 } },
      { type: 'update-file' },
      { type: 'add-comment', config: { max: 3 } },
    ],
    allowedPaths: ['package.json', 'version.txt', 'CHANGELOG.md'],
    capabilities: [
      'Semantic version management',
      'Release branch creation',
      'Pre-release checklist validation',
      'Release announcement drafting',
      'Post-release task creation',
    ],
    yamlSnippet: `on:
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type (major, minor, patch)'
        required: true
outputs:
  create-pr: { max: 2 }
  update-file: true
  add-comment: { max: 3 }
allowed-paths:
  - "package.json"
  - "version.txt"
  - "CHANGELOG.md"`,
  },
  {
    id: 'migration-guide-writer',
    name: 'Migration Guide Writer Agent',
    status: 'planned',
    category: 'release-management',
    description:
      'Analyzes breaking changes between versions and generates migration guides for users upgrading.',
    outputs: [{ type: 'update-file' }, { type: 'create-pr', config: { max: 1 } }],
    allowedPaths: ['docs/migration/**'],
    capabilities: [
      'Breaking change extraction',
      'Step-by-step migration instructions',
      'Code transformation examples',
      'Deprecation timeline documentation',
      'Compatibility matrix generation',
    ],
    yamlSnippet: `on:
  workflow_dispatch:
    inputs:
      from_version:
        description: 'Previous version'
        required: true
      to_version:
        description: 'New version'
        required: true
outputs:
  update-file: true
  create-pr: { max: 1 }
allowed-paths:
  - "docs/migration/**"`,
  },

  // Project Intelligence Agents
  {
    id: 'daily-summary',
    name: 'Daily Summary Agent',
    status: 'available',
    category: 'project-intelligence',
    description:
      'Generates daily activity summaries including new issues, merged PRs, and project metrics.',
    outputs: [{ type: 'create-issue', config: { max: 1 } }],
    exampleLink: '/gh-claude/examples/daily-summary',
    yamlSnippet: `on:
  schedule:
    - cron: '0 17 * * *'
outputs:
  create-issue: { max: 1 }`,
  },
  {
    id: 'velocity-tracker',
    name: 'Velocity Tracker Agent',
    status: 'planned',
    category: 'project-intelligence',
    description:
      'Tracks project velocity and generates sprint/milestone reports. Identifies bottlenecks and suggests process improvements.',
    outputs: [
      { type: 'create-issue', config: { max: 1 } },
      { type: 'add-comment', config: { max: 1 } },
    ],
    capabilities: [
      'Sprint velocity calculation',
      'Burndown chart data generation',
      'Bottleneck identification',
      'Cycle time analysis',
      'Predictive completion estimates',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 9 * * 1'
  milestone:
    types: [closed]
outputs:
  create-issue: { max: 1 }
  add-comment: { max: 1 }`,
  },
  {
    id: 'tech-debt-tracker',
    name: 'Tech Debt Tracker Agent',
    status: 'planned',
    category: 'project-intelligence',
    description:
      'Identifies and tracks technical debt across the codebase. Creates and maintains a tech debt backlog with prioritization.',
    outputs: [
      { type: 'create-issue', config: { max: 10 } },
      { type: 'add-label' },
      { type: 'add-comment', config: { max: 1 } },
    ],
    capabilities: [
      'TODO/FIXME/HACK comment tracking',
      'Code complexity hotspot identification',
      'Dependency age analysis',
      'Test coverage gap tracking',
      'Refactoring opportunity detection',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 0 1 * *'
  pull_request:
    types: [closed]
    branches: [main]
outputs:
  create-issue: { max: 10 }
  add-label: true
  add-comment: { max: 1 }`,
  },
  {
    id: 'trend-analyst',
    name: 'Trend Analyst Agent',
    status: 'planned',
    category: 'project-intelligence',
    description:
      'Analyzes issue and PR trends over time. Identifies patterns in bugs, feature requests, and community engagement.',
    outputs: [{ type: 'create-issue', config: { max: 1 } }],
    capabilities: [
      'Issue volume trend analysis',
      'Bug category patterns',
      'Response time metrics',
      'Community growth tracking',
      'Seasonal pattern identification',
    ],
    yamlSnippet: `on:
  schedule:
    - cron: '0 0 1 * *'
outputs:
  create-issue: { max: 1 }`,
  },
];
