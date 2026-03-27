'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SECTION_LABELS, REQUIRED_SECTIONS, type TemplateConfig, type SectionConfig } from '../lib/constants';

interface SectionsTabProps {
  config: TemplateConfig;
  onToggleSection: (key: string) => void;
  onReorderSections: (sections: Record<string, SectionConfig>) => void;
}

interface SectionItem {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  isRequired: boolean;
}

function SortableSection({
  section,
  onToggle,
}: {
  section: SectionItem;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.key, disabled: section.isRequired });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 py-2.5 px-3 rounded-md border border-transparent transition-colors ${
        isDragging ? 'bg-muted/80 border-border shadow-sm z-10' : 'hover:bg-muted/50'
      }`}
    >
      {/* Drag handle or lock */}
      {section.isRequired ? (
        <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      ) : (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing shrink-0 touch-none"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Label */}
      <span className="flex-1 text-sm">{section.label}</span>

      {/* Required badge */}
      {section.isRequired && (
        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
          Obligatorio
        </span>
      )}

      {/* Toggle */}
      <Switch
        checked={section.visible}
        onCheckedChange={onToggle}
        disabled={section.isRequired}
      />
    </div>
  );
}

export function SectionsTab({ config, onToggleSection, onReorderSections }: SectionsTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sections: SectionItem[] = React.useMemo(() => {
    return Object.entries(config.sections)
      .map(([key, section]) => ({
        key,
        label: SECTION_LABELS[key] || key,
        visible: section.visible,
        order: section.order ?? 0,
        isRequired: (REQUIRED_SECTIONS as readonly string[]).includes(key),
      }))
      .sort((a, b) => a.order - b.order);
  }, [config.sections]);

  const sectionIds = sections.map((s) => s.key);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.key === active.id);
    const newIndex = sections.findIndex((s) => s.key === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);

    // Validate constraints
    const headerIdx = reordered.findIndex((s) => s.key === 'header');
    const footerIdx = reordered.findIndex((s) => s.key === 'footer');

    if (headerIdx !== 0 || (footerIdx !== -1 && footerIdx !== reordered.length - 1)) {
      return; // Invalid order, don't apply
    }

    // Build updated sections record
    const updated: Record<string, SectionConfig> = {};
    reordered.forEach((section, index) => {
      updated[section.key] = {
        visible: section.visible,
        order: index + 1,
      };
    });

    onReorderSections(updated);
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-3">
        Arrastra para reordenar. Las secciones obligatorias no se pueden mover ni ocultar.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SortableSection
              key={section.key}
              section={section}
              onToggle={() => onToggleSection(section.key)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
