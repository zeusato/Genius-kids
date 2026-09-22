import fs from 'node:fs';

const ledger=JSON.parse(fs.readFileSync(new URL('./english-content-review-v4.json',import.meta.url),'utf8'));

// Final editorial layer shared by every generator and the in-memory harness.
// Only reviewed fields change. Unreviewed records and extra metadata survive.
export function applyContentReviewV4(filename,value){
  const review=ledger[filename];
  if(!review)return value;
  if(review.theory)return structuredClone(review.theory);
  return value.map(record=>{
    const patch=review.records[record.id];
    if(!patch)return record;
    if(patch.expectedEn!==undefined&&record.en!==patch.expectedEn&&record.en!==patch.set.en)
      throw new Error(`${record.id}: source wording changed; re-review v4 corrections before regenerating.`);
    const result={...record,...structuredClone(patch.set)};
    for(const field of patch.remove)delete result[field];
    return result;
  });
}
