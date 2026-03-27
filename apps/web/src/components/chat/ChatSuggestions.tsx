'use client';

import { usePathname } from 'next/navigation';
import { getSuggestionsForRoute } from '@/lib/chat-suggestions';

interface ChatSuggestionsProps {
  onSelect: (text: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const pathname = usePathname();
  const suggestions = getSuggestionsForRoute(pathname);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
      {suggestions.slice(0, 4).map((suggestion) => (
        <button
          key={suggestion.text}
          onClick={() => onSelect(suggestion.text)}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-facturo-violet-200 dark:border-facturo-violet-800 bg-facturo-violet-50 dark:bg-facturo-violet-950/50 text-facturo-violet-700 dark:text-facturo-violet-300 hover:bg-facturo-violet-100 dark:hover:bg-facturo-violet-900/50 transition-colors whitespace-nowrap"
        >
          {suggestion.icon && <span className="mr-1">{suggestion.icon}</span>}
          {suggestion.text}
        </button>
      ))}
    </div>
  );
}
