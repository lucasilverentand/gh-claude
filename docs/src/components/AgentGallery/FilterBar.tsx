import type { CategoryInfo, OutputType } from '../../data/agents';

interface FilterBarProps {
  categories: CategoryInfo[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  outputTypes: OutputType[];
  outputLabels: Record<OutputType, string>;
  selectedOutputs: string[];
  onOutputChange: (outputs: string[]) => void;
}

export function FilterBar({
  categories,
  selectedCategories,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  outputTypes,
  outputLabels,
  selectedOutputs,
  onOutputChange,
}: FilterBarProps) {
  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      onCategoryChange(selectedCategories.filter((c) => c !== id));
    } else {
      onCategoryChange([...selectedCategories, id]);
    }
  };

  const toggleOutput = (output: string) => {
    if (selectedOutputs.includes(output)) {
      onOutputChange(selectedOutputs.filter((o) => o !== output));
    } else {
      onOutputChange([...selectedOutputs, output]);
    }
  };

  const clearAllFilters = () => {
    onCategoryChange([]);
    onStatusChange(null);
    onOutputChange([]);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedStatus !== null || selectedOutputs.length > 0;

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Status</label>
        <div className="filter-options">
          <button
            type="button"
            onClick={() => onStatusChange(null)}
            className={`filter-btn ${selectedStatus === null ? 'active' : ''}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('available')}
            className={`filter-btn ${selectedStatus === 'available' ? 'active' : ''}`}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('planned')}
            className={`filter-btn ${selectedStatus === 'planned' ? 'active' : ''}`}
          >
            Planned
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Category</label>
        <div className="filter-pills">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`filter-pill ${selectedCategories.includes(cat.id) ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Output Types</label>
        <div className="filter-pills">
          {outputTypes.map((output) => (
            <button
              key={output}
              type="button"
              onClick={() => toggleOutput(output)}
              className={`filter-pill ${selectedOutputs.includes(output) ? 'active' : ''}`}
            >
              {outputLabels[output]}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button type="button" onClick={clearAllFilters} className="clear-filters">
          Clear all filters
        </button>
      )}
    </div>
  );
}
