'use client';

import { usePathname } from 'next/navigation';
import {
  BarChart3, ArrowLeftRight, TrendingUp, AlertTriangle,
  ClipboardList, Calculator, Footprints,
  FileText, Receipt, XCircle, Calendar,
  CheckCircle, ArrowRightLeft,
  Crown, UserPlus, User, Download,
  Package, Trophy,
  BookOpen, Book, Upload,
  Building2, Landmark,
  Ticket, Clock,
  Lightbulb, LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getSuggestionsForRoute } from '@/lib/chat-suggestions';

const ICON_MAP: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  'arrow-left-right': ArrowLeftRight,
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  'clipboard-list': ClipboardList,
  'calculator': Calculator,
  'footprints': Footprints,
  'file-text': FileText,
  'receipt': Receipt,
  'x-circle': XCircle,
  'calendar': Calendar,
  'check-circle': CheckCircle,
  'arrow-right-left': ArrowRightLeft,
  'crown': Crown,
  'user-plus': UserPlus,
  'user': User,
  'download': Download,
  'package': Package,
  'trophy': Trophy,
  'book-open': BookOpen,
  'book': Book,
  'upload': Upload,
  'building-2': Building2,
  'landmark': Landmark,
  'ticket': Ticket,
  'clock': Clock,
  'lightbulb': Lightbulb,
  'life-buoy': LifeBuoy,
};

interface ChatSuggestionsProps {
  onSelect: (text: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const pathname = usePathname();
  const suggestions = getSuggestionsForRoute(pathname);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
      {suggestions.slice(0, 4).map((suggestion) => {
        const Icon = suggestion.icon ? ICON_MAP[suggestion.icon] : null;
        return (
          <button
            key={suggestion.text}
            onClick={() => onSelect(suggestion.text)}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-facturo-violet-200 dark:border-facturo-violet-800 bg-facturo-violet-50 dark:bg-facturo-violet-950/50 text-facturo-violet-700 dark:text-facturo-violet-300 hover:bg-facturo-violet-100 dark:hover:bg-facturo-violet-900/50 transition-colors whitespace-nowrap"
          >
            {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
            {suggestion.text}
          </button>
        );
      })}
    </div>
  );
}
