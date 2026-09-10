/** Shared generators normally use system randomness. Synchronous game generation
 * may supply a seeded stream without replacing the global Math.random function. */
let source: () => number = () => Math.random();
export const generatorRandom = () => source();
export function withGeneratorRandom<T>(random: () => number, generate: () => T): T {
    const prior = source;
    source = random;
    try { return generate(); } finally { source = prior; }
}
