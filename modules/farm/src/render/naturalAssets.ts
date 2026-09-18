import { NATURAL_VARIANTS, type NaturalVariant } from '../core/scenery';
// Source PNGs remain as provenance; ship lossless WebP with identical visible pixels.
const files = import.meta.glob('../assets/terrain/optimized/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export function naturalAssetUrl(variant: NaturalVariant) {
    return files[`../assets/terrain/optimized/${NATURAL_VARIANTS[variant].file.replace(/\.png$/, '.webp')}`];
}
