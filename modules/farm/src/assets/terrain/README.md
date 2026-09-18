# Natural cutouts — 18/09/2026

Latest blending pass: birch-v2 replaces birch-v1 in the live catalog. The original is retained but excluded from the runtime asset glob. Native alpha and soft contact shadows are handled in the renderer. Built-in image_gen edit prompt, provenance and limits: [foliage blending](../../../docs/foliage-blending-2026-09-18.md).

14 original RGBA PNGs created with the built-in `image_gen` tool through the imagegen skill. These are production sprites, not Family Island assets. Files are copied unchanged from generated output; no external image dependency at runtime.

Trees: oak, birch, pine, bamboo, banana, maple, blossom. Stone resources: stone (mossy), granite, sandstone, slate, limestone, riverstone, iron (ore).

Prompt records: [terrain-asset-prompts-2026-09-18.json](../../../docs/terrain-asset-prompts-2026-09-18.json). The first oak/stone briefs are explicitly marked summaries; the other twelve are verbatim generation prompts. Preview: [contact sheet](../../../docs/screenshots/terrain-v2/assets.png).

All natural resources are fixed, one-view objects. Do not mirror or rotate these planes to simulate another side. `core/scenery.ts` owns variant selection and world dimensions; selection is deterministic from seed/position and does not mutate saves. `render/Landscape.tsx` handles fixed-camera alignment, visible-root anchoring, alpha picking and ground shadows.

Rotatable sprite assets must implement `SpriteViews` with all four `0|1|2|3` views, consistent scale, root/pivot, lighting and level silhouette. Existing buildings still use actual 3D geometry and rotate normally; a complete four-view building library is not included in this batch.

Originals total about 23.7 MB. Texture compression/atlasing/LOD and target-phone GPU measurements remain future optimization work. Keep originals as provenance when preparing optimized derivatives.

## Subsequent art pass

Added fern, shrub and wildflowers as nonblocking undergrowth; tilled-soil as the RGBA horizontal plot surface; swallow-flight as animated decorative bird sprite; road-stone as the connected road material. These originals were also created with built-in image_gen and copied unchanged. The separate `../ui/harvest-window-v1.png` decorates game dialogs. There are now 20 terrain PNGs plus one UI PNG (36,512,748 bytes total).

Exact prompts: `docs/undergrowth-prompts-2026-09-18.json`, `docs/interaction-asset-prompts-2026-09-18.json`, `docs/road-asset-prompt-2026-09-18.json`. Integration and limitations: `docs/CONTEXTUAL_PLAY_AND_ROADS.md`. Road texture uses shared world-space UVs with mirrored repeat and 16 connected geometry masks; no per-tile border is repeated through joins.
