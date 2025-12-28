import { useState } from 'react';
import type { Agent, OutputType } from '../../data/agents';

interface AgentCardProps {
  agent: Agent;
  outputLabels: Record<OutputType, string>;
}

export function AgentCard({ agent, outputLabels }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="agent-card">
      <header className="agent-card-header">
        <h3 className="agent-card-title">{agent.name}</h3>
        <span className={`status-badge status-${agent.status}`}>
          {agent.status === 'available' ? 'Available' : 'Planned'}
        </span>
      </header>

      <p className="agent-card-description">{agent.description}</p>

      <div className="output-tags">
        {agent.outputs.map((output) => (
          <span key={output.type} className="output-tag">
            {outputLabels[output.type]}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="expand-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Hide config' : 'Show config'}
      </button>

      {isExpanded && (
        <pre className="yaml-snippet">
          <code>{agent.yamlSnippet}</code>
        </pre>
      )}

      {agent.capabilities && agent.capabilities.length > 0 && (
        <details className="capabilities">
          <summary>Capabilities</summary>
          <ul>
            {agent.capabilities.map((cap, i) => (
              <li key={i}>{cap}</li>
            ))}
          </ul>
        </details>
      )}

      {agent.exampleLink && (
        <a href={agent.exampleLink} className="example-link">
          View Example &rarr;
        </a>
      )}
    </article>
  );
}
