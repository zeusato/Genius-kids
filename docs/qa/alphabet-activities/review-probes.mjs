// Read-only audit probes against the current implementation; no browser/profile writes.
// Run: node docs/qa/alphabet-activities/review-probes.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
function loader(globals = {}) {
    const cache = new Map();
    function load(relative) {
        let file = path.resolve(root, relative);
        if (!path.extname(file)) file += '.ts';
        if (cache.has(file)) return cache.get(file);
        if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
        const source = fs.readFileSync(file, 'utf8').replace(/import\.meta/g, '({env:{BASE_URL:"/Genius-kids/",DEV:true}})');
        const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
        const module = { exports: {} };
        const require = name => load(name.startsWith('@/') ? name.slice(2) : path.resolve(path.dirname(file), name));
        vm.runInNewContext(code, { module, exports: module.exports, require, ...globals }, { filename: file });
        cache.set(file, module.exports);
        return module.exports;
    }
    return load;
}

const base = 'src/components/preschool/alphabet-games/';
const load = loader();
const sequences = load(base + 'sequence.ts');
const progress = load(base + 'progress.ts');
const oneSession = progress.completePracticeSession(undefined, 'pick', 'intro', 'one-session', [0, 1, 2].map(i => ({ roundId: `r${i}`, letterId: 'a', correct: true, firstTry: true, assisted: false })), '0');
let threeAnswersAtPractice;
for (let seed = 0; seed < 200 && !threeAnswersAtPractice; seed++) {
    const round = sequences.buildWordRounds(seed, 'practice').find(r => r.correctIds.length === 3);
    if (round) threeAnswersAtPractice = { seed, letter: round.letterId, answers: round.correctIds };
}

const utterances = [];
const callbacks = [];
const successfulSpeech = loader({
    window: { setTimeout: fn => { fn(); return 1; }, clearInterval() {}, speechSynthesis: { cancel() {}, getVoices: () => [{ lang: 'en-US' }], speak: u => utterances.push(u) } },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
})('src/utils/speech.ts');
const successScheduled = successfulSpeech.speak('A', { lang: 'en-US', onError: () => callbacks.push('onError') });
utterances.at(-1).onend();

let pendingAudio;
const failureCallbacks = [];
const failedSpeech = loader({
    window: { clearInterval() {}, speechSynthesis: { cancel() {}, getVoices: () => [] } },
    Audio: class { constructor() { pendingAudio = this; } play() { return Promise.resolve(); } pause() {} },
})('src/utils/speech.ts');
const failedScheduled = failedSpeech.speak('A', { lang: 'en-US', onError: () => failureCallbacks.push('onError') });
pendingAudio.onerror();

console.log(JSON.stringify({
    successfulSpeech: { returned: successScheduled, actualEndCalls: callbacks, expected: 'successful end must not call onError' },
    failedSpeech: { returnedBeforeFailure: failedScheduled, failureCalls: failureCallbacks, expected: 'caller must wait for successful playback; true return only means scheduled' },
    masteryAfterOnlyOneSession: progress.mastered(oneSession, 'pick', 'a'),
    expectedMastery: false,
    fixedAMatchBoards: sequences.buildMatchBoards(7, 'challenge', 'a').map(b => b.letterIds),
    expectedFixedA: 'A must remain the practiced target across both boards',
    threeAnswersAtPractice,
    expectedPracticeAnswers: 2,
}, null, 2));
