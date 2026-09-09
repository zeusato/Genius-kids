import type { RegionId } from './model';

const base = import.meta.env.BASE_URL + 'dragon/art/';
export const regionArt = (region: RegionId) => base + region + '.webp';
export const portraitArt = (name: 'fairy' | 'goblin' | 'dragon') => base + name + '.webp';
export const regionMood: Record<RegionId, { sky: string; fog: string; ground: string; rock: string; leaf: string; light: string; accent: string }> = {
    forest: { sky: '#d5e9db', fog: '#b6d1bc', ground: '#78a35e', rock: '#436052', leaf: '#337556', light: '#ffe7ab', accent: '#d7b966' },
    wind: { sky: '#c3e7fa', fog: '#c3e7ec', ground: '#81b8a0', rock: '#658b9a', leaf: '#56b09b', light: '#fff0c9', accent: '#f9d16e' },
    crystal: { sky: '#333454', fog: '#635d8a', ground: '#69608e', rock: '#3d3e62', leaf: '#aa8bd4', light: '#d0c3ff', accent: '#69e8e2' },
    snow: { sky: '#c6dbe9', fog: '#c6dbe4', ground: '#d6e8df', rock: '#6e91a2', leaf: '#497977', light: '#fff0d6', accent: '#e8b879' },
    castle: { sky: '#ead9b8', fog: '#ddc9a6', ground: '#bcb18a', rock: '#8b7b67', leaf: '#567b59', light: '#ffe2a0', accent: '#e4a850' },
};
