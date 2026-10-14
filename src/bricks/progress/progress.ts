export interface BricksProgress { models: number; placed: number; groups: string[]; tallestCm: number; badges: string[] }
export type BricksEvent = { type: 'placed'; group: string; heightCm: number } | { type: 'models'; count: number };
export const BADGES: Record<string, string> = { first: 'Viên gạch đầu tiên', hundred: '100 mảnh sáng tạo', tower: 'Tháp cao 30 cm', collection: '10 mô hình', explorer: 'Khám phá 12 nhóm mảnh' };
export function advanceBricks(previous: BricksProgress | undefined, event: BricksEvent): BricksProgress {
  const p: BricksProgress = { models: 0, placed: 0, groups: [], tallestCm: 0, badges: [], ...previous };
  if (event.type === 'models') p.models = Math.max(0, event.count);
  else { p.placed++; p.groups = [...new Set([...p.groups, event.group])]; p.tallestCm = Math.max(p.tallestCm, event.heightCm); }
  p.badges = [...new Set([...p.badges, ...(p.placed ? ['first'] : []), ...(p.placed >= 100 ? ['hundred'] : []), ...(p.tallestCm >= 30 ? ['tower'] : []), ...(p.models >= 10 ? ['collection'] : []), ...(p.groups.length >= 12 ? ['explorer'] : [])])];
  return p;
}
