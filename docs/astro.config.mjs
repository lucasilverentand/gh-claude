import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide';
import starlightLinksValidator from 'starlight-links-validator';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://lucasilverentand.github.io',
  base: '/repo-agents',
  integrations: [
    starlight({
      title: 'Repo Agents',
      description: 'CLI tool for creating AI-powered GitHub Actions workflows from markdown agent definitions',
      plugins: [starlightThemeRapide(), starlightLinksValidator()],
      social: [
        {
          label: 'GitHub',
          icon: 'github',
          href: 'https://github.com/lucasilverentand/repo-agents',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' }
        },
        {
          label: 'Anatomy of an Agent',
          items: [
            { slug: 'anatomy/what-is-an-agent' },
            { slug: 'anatomy/triggers' },
            { slug: 'anatomy/context' },
            { slug: 'anatomy/outputs' },
            { slug: 'anatomy/audit' },
          ]
        },
        {
          label: 'Agent Stages',
          collapsed: true,
          items: [
            { slug: 'stages/dispatcher' },
            { slug: 'stages/pre-flight' },
            { slug: 'stages/context-building' },
            { slug: 'stages/agent-execution' },
            { slug: 'stages/publish-outputs' },
            { slug: 'stages/audit' },
          ]
        },
        {
          label: "Trigger Types",
          autogenerate: {
            directory: "triggers"
          }
        },
        {
          label: "Context Types",
          autogenerate: {
            directory: "context"
          }
        },
        {
          label: "Output Types",
          autogenerate: {
            directory: "outputs"
          }
        }
      ]
    }),
    react(),
  ],
});
