export type GraphicsQuality = 'soft' | 'light';
export const GRAPHICS_KEY = 'lang-mam-graphics-v1';
export function readGraphicsQuality(): GraphicsQuality {
    try { return localStorage.getItem(GRAPHICS_KEY) === 'light' ? 'light' : 'soft'; }
    catch { return 'soft'; }
}
export function saveGraphicsQuality(quality: GraphicsQuality): void {
    try { localStorage.setItem(GRAPHICS_KEY, quality); }
    catch { /* Private/restricted storage must not prevent playing. */ }
}
