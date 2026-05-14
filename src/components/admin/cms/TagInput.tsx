import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder = 'Type a tag and press Enter' }: Props) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, '').trim();
    if (!t) return;
    if (value.includes(t)) { setInput(''); return; }
    onChange([...value, t]);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div
      className="flex flex-wrap items-center gap-1 min-h-10 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      onClick={(e) => {
        const inp = (e.currentTarget.querySelector('input') as HTMLInputElement | null);
        inp?.focus();
      }}
    >
      {value.map((t, i) => (
        <span key={`${t}-${i}`} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
          {t}
          <button type="button" onClick={() => remove(i)} className="hover:text-destructive" aria-label={`Remove ${t}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent outline-none py-0.5"
        value={input}
        placeholder={value.length === 0 ? placeholder : ''}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => input && add(input)}
      />
    </div>
  );
}
