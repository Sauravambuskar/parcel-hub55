interface ETASortBarProps {
  activeSort: string;
  onSortChange: (sort: string) => void;
  isLoading?: boolean;
}

const sortOptions = [
  { key: "best", label: "Best Match" },
  { key: "fastest", label: "Fastest" },
  { key: "cheapest", label: "Cheapest" },
  { key: "reliable", label: "Most Reliable" },
];

const ETASortBar = ({ activeSort, onSortChange, isLoading }: ETASortBarProps) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSortChange(opt.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              activeSort === opt.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {isLoading && (
        <p className="text-xs italic text-primary">
          ⚡ AI is calculating delivery confidence scores...
        </p>
      )}
    </div>
  );
};

export default ETASortBar;
