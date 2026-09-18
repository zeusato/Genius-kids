import { NATURAL_VARIANTS, type NaturalVariant } from '../core/scenery';
// Keep the original birch as provenance, but ship only its current revision.
const files = import.meta.glob(['../assets/terrain/*.png', '!../assets/terrain/birch-v1.png'], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export function naturalAssetUrl(variant: NaturalVariant) {
    return files[`../assets/terrain/${NATURAL_VARIANTS[variant].file}`];
}
