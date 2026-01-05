import { useState, useMemo } from 'react';
import type { Agent, CategoryInfo, OutputType } from '../../data/agents';
import { FilterBar } from './FilterBar';
import { SearchInput } from './SearchInput';
import { AgentCard } from './AgentCard';

interface AgentGalleryClientProps {
  agents: Agent[];
  categories: CategoryInfo[];
  outputLabels: Record<OutputType, string>;
}

export default function AgentGalleryClient({
  agents,
  categories,
  outputLabels,
}: AgentGalleryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);

  const allOutputTypes = useMemo(() => {
    const outputs = new Set<OutputType>();
    for (const agent of agents) {
      for (const o of agent.outputs) {
        outputs.add(o.type);
      }
    }
    return Array.from(outputs).sort();
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(agent.category)) {
        return false;
      }

      if (selectedStatus && agent.status !== selectedStatus) {
        return false;
      }

      if (selectedOutputs.length > 0) {
        const agentOutputTypes = agent.outputs.map((o) => o.type);
        const hasMatchingOutput = selectedOutputs.some((output) =>
          agentOutputTypes.includes(output as OutputType)
        );
        if (!hasMatchingOutput) return false;
      }

      return true;
    });
  }, [agents, searchQuery, selectedCategories, selectedStatus, selectedOutputs]);

  const groupedAgents = useMemo(() => {
    const groups: Record<string, Agent[]> = {};
    for (const agent of filteredAgents) {
      if (!groups[agent.category]) {
        groups[agent.category] = [];
      }
      groups[agent.category].push(agent);
    }
    return groups;
  }, [filteredAgents]);

  const categoryOrder = categories.map((c) => c.id);

  return (
    <div className="agent-gallery">
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      <FilterBar
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        outputTypes={allOutputTypes}
        outputLabels={outputLabels}
        selectedOutputs={selectedOutputs}
        onOutputChange={setSelectedOutputs}
      />

      <div className="results-summary">
        Showing {filteredAgents.length} of {agents.length} agents
      </div>

      {categoryOrder.map((categoryId) => {
        const categoryAgents = groupedAgents[categoryId];
        if (!categoryAgents || categoryAgents.length === 0) return null;

        const category = categories.find((c) => c.id === categoryId);
        return (
          <section key={categoryId} className="agent-category-section">
            <h2>{category?.label}</h2>
            <div className="agent-grid">
              {categoryAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} outputLabels={outputLabels} />
              ))}
            </div>
          </section>
        );
      })}

      {filteredAgents.length === 0 && (
        <div className="no-results">No agents match your filters. Try adjusting your search or filters.</div>
      )}
    </div>
  );
}
