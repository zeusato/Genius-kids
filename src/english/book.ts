import type { EnglishContent } from './content';

export interface BookPage {
  id: string;
  title: string;
  kind: 'overview' | 'formula' | 'section' | 'examples' | 'mistake' | 'tips' | 'letters' | 'phrases';
  index?: number;
  exampleIds?: string[];
}
export function bookPages(content: EnglishContent): BookPage[] {
  if (content.level === 'K') return [
    { id: 'intro', title: 'Cùng làm quen tiếng Anh', kind: 'overview' },
    ...[0, 1, 2, 3].map(index => ({ id: `letters-${index}`, title: `Chữ cái ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index * 7]}–${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.min(index * 7 + 6, 25)]}`, kind: 'letters' as const, index })),
    ...Array.from({ length: Math.ceil(content.phrases.length / 4) }, (_, index) => ({ id: `phrases-${index}`, title: `Giao tiếp: ${content.phrases[index * 4].en}`, kind: 'phrases' as const, index })),
  ];
  const theory = content.theory;
  if (!theory) return [];
  return [
    { id: 'intro', title: 'Bắt đầu chương', kind: 'overview' },
    ...theory.formulas.map((f, index) => ({ id: `formula-${index}`, title: f.label, kind: 'formula' as const, index })),
    ...theory.sections.flatMap((section, index) => [
      { id: `section-${index}`, title: section.heading, kind: 'section' as const, index },
      ...Array.from({ length: Math.ceil((section.exampleIds?.length || 0) / 2) }, (_, part) => ({ id: `examples-${index}-${part}`, title: `Ví dụ · ${section.heading}`, kind: 'examples' as const, index, exampleIds: section.exampleIds!.slice(part * 2, part * 2 + 2) })),
    ]),
    ...theory.commonMistakes.map((_, index) => ({ id: `mistake-${index}`, title: `Chỗ dễ nhầm ${index + 1}`, kind: 'mistake' as const, index })),
    { id: 'tips', title: 'Ghi nhớ & thực hành', kind: 'tips' },
  ];
}
