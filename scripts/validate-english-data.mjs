import fs from 'fs';
import path from 'path';

const VALID_POS = new Set([
  'pronoun', 'noun', 'verb', 'adjective', 'adverb', 'article',
  'preposition', 'conjunction', 'determiner', 'numeral', 'punct', 'interjection', 'particle'
]);

const VALID_ROLE = new Set([
  'subject', 'verb', 'object', 'complement', 'det', 'modifier',
  'adverbial', 'prep', 'prep-object', 'particle', 'expletive', 'conj', 'punct'
]);

const VALID_ROLE_SPANS = new Set([
  'subject', 'verb', 'object', 'complement', 'adverbial'
]);

const VALID_EXERCISE_TYPES = new Set([
  'pos', 'roles', 'fill', 'conjugate', 'order', 'listen'
]);

const VALID_VERB_FEATURES = new Set([
  'base', 'present-1sg', 'present-3sg', 'present-other', 'past', 'ing',
  'aux-present-3sg', 'aux-present-other', 'aux-past', 'aux-future',
  'base-neg', 'present-1sg-neg', 'present-3sg-neg', 'present-other-neg', 'past-neg', 'ing-neg',
  'aux-present-3sg-neg', 'aux-present-other-neg', 'aux-past-neg', 'aux-future-neg'
]);

const VALID_NOUN_FEATURES = new Set(['sg', 'pl', 'uncountable']);

const VALID_LEVELS = new Set([
  'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'K'
]);

const dataDir = path.resolve('src/data/english');

// Helper to reconstruct sentence from tokens to catch bad whitespace (e.g. "Yes , I am .")
function reconstructEn(tokens) {
  let res = '';
  for (let i = 0; i < tokens.length; i++) {
    const text = tokens[i].text;
    if (i === 0) {
      res += text;
    } else if (['.', ',', '?', '!', ':', ';'].includes(text)) {
      res += text;
    } else {
      res += ' ' + text;
    }
  }
  return res;
}

function validateFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n🔍 Checking: ${fileName}`);
  let content;
  try {
    content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`❌ JSON parse error in ${fileName}: ${err.message}`);
    return false;
  }

  let errors = [];
  let warnings = [];

  if (fileName.endsWith('.sentences.json')) {
    if (!Array.isArray(content)) {
      errors.push('Root must be an array of Sentence');
    } else {
      const ids = new Set();
      const enSet = new Set();

      content.forEach((item, idx) => {
        const prefix = `[Sentence #${idx + 1} (${item.id || 'no-id'})]`;
        if (!item.id) errors.push(`${prefix} missing id`);
        else if (ids.has(item.id)) errors.push(`${prefix} duplicate id: ${item.id}`);
        ids.add(item.id);

        if (!VALID_LEVELS.has(item.level)) errors.push(`${prefix} invalid level: ${item.level}`);
        if (!item.topic) errors.push(`${prefix} missing topic`);
        if (!item.grammarPoint) errors.push(`${prefix} missing grammarPoint`);
        if (!item.en) errors.push(`${prefix} missing en`);
        if (!item.vi) errors.push(`${prefix} missing vi`);

        if (item.en) {
          const normEn = item.en.trim().toLowerCase();
          if (enSet.has(normEn)) warnings.push(`${prefix} duplicate sentence en: "${item.en}"`);
          enSet.add(normEn);
        }

        if (![1, 2, 3].includes(item.difficulty)) errors.push(`${prefix} difficulty must be 1, 2 or 3`);
        if (!Array.isArray(item.tags)) errors.push(`${prefix} tags must be an array`);

        // tokens check
        if (!Array.isArray(item.tokens) || item.tokens.length === 0) {
          errors.push(`${prefix} tokens must be a non-empty array`);
        } else {
          // Check reconstruction against item.en
          const reconstructed = reconstructEn(item.tokens);
          if (item.en && item.en !== reconstructed) {
            errors.push(`${prefix} en "${item.en}" does not match token reconstruction "${reconstructed}" (check for spaces before punctuation)`);
          }

          item.tokens.forEach((token, tIdx) => {
            const tPrefix = `${prefix} token[${tIdx}] (${token.text})`;
            if (!token.text) errors.push(`${tPrefix} missing text`);
            if (!VALID_POS.has(token.pos)) errors.push(`${tPrefix} invalid pos: ${token.pos}`);
            if (!VALID_ROLE.has(token.role)) errors.push(`${tPrefix} invalid role: ${token.role}`);
            if (['verb', 'noun'].includes(token.pos) && !token.lemma) {
              errors.push(`${tPrefix} pos '${token.pos}' must have lemma`);
            }
            if (token.pos === 'verb' && token.feature && !VALID_VERB_FEATURES.has(token.feature)) {
              errors.push(`${tPrefix} invalid verb feature: ${token.feature}`);
            }
            if (token.pos === 'noun' && token.feature && !VALID_NOUN_FEATURES.has(token.feature)) {
              errors.push(`${tPrefix} invalid noun feature: ${token.feature}`);
            }
          });
        }

        // exerciseTypes check
        if (!Array.isArray(item.exerciseTypes) || item.exerciseTypes.length === 0) {
          errors.push(`${prefix} exerciseTypes must be a non-empty array`);
        } else {
          item.exerciseTypes.forEach(ex => {
            if (!VALID_EXERCISE_TYPES.has(ex)) errors.push(`${prefix} invalid exerciseType: ${ex}`);
          });

          // Check: if sentence is Yes/No response or has Yes/No interjection, roles shouldn't be enabled
          const hasInterjection = item.tokens?.some(t => t.pos === 'interjection');
          if (hasInterjection && item.exerciseTypes.includes('roles')) {
            warnings.push(`${prefix} contains interjection (Yes/No response), 'roles' exercise is not recommended`);
          }
        }

        // roleSpans check
        if (!Array.isArray(item.roleSpans)) {
          errors.push(`${prefix} roleSpans must be an array`);
        } else {
          if (item.exerciseTypes?.includes('roles') && item.roleSpans.length === 0) {
            errors.push(`${prefix} exerciseTypes includes 'roles' but roleSpans is empty`);
          }
          item.roleSpans.forEach((span, sIdx) => {
            const sPrefix = `${prefix} roleSpan[${sIdx}]`;
            if (!span.clauseId) errors.push(`${sPrefix} missing clauseId`);
            if (!VALID_ROLE_SPANS.has(span.role)) errors.push(`${sPrefix} invalid span role: ${span.role}`);
            if (!Array.isArray(span.tokenIndices) || span.tokenIndices.length === 0) {
              errors.push(`${sPrefix} tokenIndices must be a non-empty array`);
            } else {
              span.tokenIndices.forEach(tIdx => {
                if (tIdx < 0 || tIdx >= (item.tokens?.length || 0)) {
                  errors.push(`${sPrefix} tokenIndex ${tIdx} out of range`);
                }
              });
            }
          });
        }

        // blanks check
        if (!Array.isArray(item.blanks) || item.blanks.length === 0) {
          warnings.push(`${prefix} blanks should not be empty`);
        } else {
          item.blanks.forEach((blank, bIdx) => {
            const bPrefix = `${prefix} blank[${bIdx}]`;
            if (typeof blank.tokenIndex !== 'number' || blank.tokenIndex < 0 || blank.tokenIndex >= (item.tokens?.length || 0)) {
              errors.push(`${bPrefix} tokenIndex ${blank.tokenIndex} out of range`);
            } else {
              const targetToken = item.tokens[blank.tokenIndex];
              if (targetToken && blank.answer.toLowerCase() !== targetToken.text.toLowerCase()) {
                warnings.push(`${bPrefix} answer "${blank.answer}" doesn't match token text "${targetToken.text}"`);
              }
            }
            if (!blank.promptVi) errors.push(`${bPrefix} missing promptVi`);
            if (!blank.hint) errors.push(`${bPrefix} missing hint`);
          });
        }

        // orderAlternatives check
        if (item.orderAlternatives) {
          if (!Array.isArray(item.orderAlternatives)) {
            errors.push(`${prefix} orderAlternatives must be an array`);
          }
        }
      });

      console.log(`   📊 Total sentences: ${content.length}`);
    }
  } else if (fileName.endsWith('.vocab.json')) {
    if (!Array.isArray(content)) {
      errors.push('Root must be an array of Vocab');
    } else {
      const ids = new Set();
      const enSet = new Set();

      content.forEach((item, idx) => {
        const prefix = `[Vocab #${idx + 1} (${item.id || 'no-id'})]`;
        if (!item.id) errors.push(`${prefix} missing id`);
        else if (ids.has(item.id)) errors.push(`${prefix} duplicate id: ${item.id}`);
        ids.add(item.id);

        if (!VALID_LEVELS.has(item.level)) errors.push(`${prefix} invalid level: ${item.level}`);
        if (!item.en) errors.push(`${prefix} missing en`);
        if (!item.vi) errors.push(`${prefix} missing vi`);
        if (!VALID_POS.has(item.pos)) errors.push(`${prefix} invalid pos: ${item.pos}`);
        if (!item.ipa || !item.ipa.startsWith('/') || !item.ipa.endsWith('/')) {
          warnings.push(`${prefix} ipa "${item.ipa}" should be enclosed in /.../`);
        }
        if (!item.exampleEn) errors.push(`${prefix} missing exampleEn`);
        if (!item.exampleVi) errors.push(`${prefix} missing exampleVi`);

        if (item.en) {
          const normEn = item.en.trim().toLowerCase();
          if (enSet.has(normEn)) warnings.push(`${prefix} duplicate word en: "${item.en}"`);
          enSet.add(normEn);
        }
      });

      console.log(`   📊 Total vocab: ${content.length}`);
    }
  } else if (fileName.endsWith('.theory.json')) {
    if (typeof content !== 'object' || Array.isArray(content)) {
      errors.push('Root must be a TheoryPage object');
    } else {
      if (!VALID_LEVELS.has(content.level)) errors.push(`Invalid level: ${content.level}`);
      if (!content.title) errors.push('Missing title');
      if (!content.summary) errors.push('Missing summary');
      if (!Array.isArray(content.formulas)) errors.push('formulas must be array');
      if (!Array.isArray(content.sections)) errors.push('sections must be array');
      if (!Array.isArray(content.commonMistakes)) errors.push('commonMistakes must be array');
      if (!Array.isArray(content.tips)) errors.push('tips must be array');
      console.log(`   📊 Theory page for ${content.level}: "${content.title}" (sections: ${content.sections?.length || 0})`);
    }
  } else if (fileName.endsWith('.passages.json')) {
    if (!Array.isArray(content)) {
      errors.push('Root must be an array of Passage');
    } else {
      if (content.length < 40) {
        errors.push(`Passages count (${content.length}) is below required minimum (≥ 40)`);
      }
      content.forEach((p, idx) => {
        const prefix = `[Passage #${idx + 1} (${p.id || 'no-id'})]`;
        if (!p.id) errors.push(`${prefix} missing id`);
        if (!p.title) errors.push(`${prefix} missing title`);
        if (!p.en) errors.push(`${prefix} missing en`);
        if (!p.vi) errors.push(`${prefix} missing vi`);
        if (!Array.isArray(p.questions) || p.questions.length < 3) {
          errors.push(`${prefix} must have at least 3 questions`);
        } else {
          p.questions.forEach((q, qIdx) => {
            const qPrefix = `${prefix} question[${qIdx}]`;
            if (!q.id) errors.push(`${qPrefix} missing id`);
            if (!['mcq', 'tf', 'short'].includes(q.type)) errors.push(`${qPrefix} invalid type: ${q.type}`);
            if (!q.q) errors.push(`${qPrefix} missing q`);
            if (!q.answer) errors.push(`${qPrefix} missing answer`);
            if (!q.explain) errors.push(`${qPrefix} missing explain`);
            if (q.type === 'mcq') {
              if (!Array.isArray(q.options) || q.options.length !== 4) {
                errors.push(`${qPrefix} mcq must have exactly 4 options`);
              } else if (!q.options.includes(q.answer)) {
                errors.push(`${qPrefix} mcq answer "${q.answer}" must be one of options`);
              }
            }
            if (q.type === 'tf' && !['True', 'False'].includes(q.answer)) {
              errors.push(`${qPrefix} tf answer must be "True" or "False"`);
            }
          });
        }
      });
      console.log(`   📊 Total passages: ${content.length}`);
    }
  } else if (fileName.endsWith('.rewrites.json')) {
    if (!Array.isArray(content)) {
      errors.push('Root must be an array of Rewrite');
    } else {
      if (content.length < 200) {
        errors.push(`Rewrites count (${content.length}) is below required minimum (≥ 200)`);
      }
      const VALID_REWRITE_TYPES = new Set(['affirm-neg', 'neg-affirm', 'statement-question', 'contraction', 'synonym', 'word-order']);
      content.forEach((r, idx) => {
        const prefix = `[Rewrite #${idx + 1} (${r.id || 'no-id'})]`;
        if (!r.id) errors.push(`${prefix} missing id`);
        if (!VALID_REWRITE_TYPES.has(r.type)) errors.push(`${prefix} invalid type: ${r.type}`);
        if (!r.promptEn) errors.push(`${prefix} missing promptEn`);
        if (!r.promptVi) errors.push(`${prefix} missing promptVi`);
        if (!r.answer) errors.push(`${prefix} missing answer`);
        if (!r.vi) errors.push(`${prefix} missing vi`);
      });
      console.log(`   📊 Total rewrites: ${content.length}`);
    }
  } else if (fileName.endsWith('.phrases.json')) {
    if (!Array.isArray(content)) {
      errors.push('Root must be an array of Phrase');
    } else {
      if (content.length < 50) {
        errors.push(`Phrases count (${content.length}) is below required minimum (≥ 50)`);
      }
      content.forEach((ph, idx) => {
        const prefix = `[Phrase #${idx + 1} (${ph.id || 'no-id'})]`;
        if (!ph.id) errors.push(`${prefix} missing id`);
        if (!ph.en) errors.push(`${prefix} missing en`);
        if (!ph.vi) errors.push(`${prefix} missing vi`);
        if (!ph.image) warnings.push(`${prefix} should have image`);
      });
      console.log(`   📊 Total phrases: ${content.length}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`   ⚠️ ${warnings.length} warning(s):`);
    warnings.slice(0, 5).forEach(w => console.warn(`     - ${w}`));
    if (warnings.length > 5) console.warn(`     ... and ${warnings.length - 5} more`);
  }

  if (errors.length > 0) {
    console.error(`   ❌ ${errors.length} error(s):`);
    errors.slice(0, 10).forEach(e => console.error(`     - ${e}`));
    return false;
  }

  console.log(`   ✅ PASS`);
  return true;
}

function run() {
  if (!fs.existsSync(dataDir)) {
    console.log(`Directory ${dataDir} does not exist yet.`);
    return;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log(`No JSON data files found in ${dataDir}.`);
    return;
  }

  let allPass = true;
  for (const f of files) {
    const passed = validateFile(path.join(dataDir, f));
    if (!passed) allPass = false;
  }

  console.log('\n=======================================');
  if (allPass) {
    console.log('🎉 ALL DATA FILES ARE VALID!');
  } else {
    console.log('💥 SOME DATA FILES HAVE ERRORS.');
    process.exit(1);
  }
}

run();
