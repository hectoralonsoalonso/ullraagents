import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_RULES, validateRules, scorePair, rankCandidates } from '../src/affinity.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/participants.json',import.meta.url),'utf8'));
const [a,b,c,d,e,f]=fixture;
const clone=v => structuredClone(v);
const component=(r,k) => r.components.find(c => c.key===k);
test('weights total 100 and default rules are immutable',()=>{
  assert.equal(Object.values(DEFAULT_RULES.weights).reduce((a,b)=>a+b),100);
  assert.ok(Object.isFrozen(DEFAULT_RULES)); assert.ok(Object.isFrozen(DEFAULT_RULES.weights));
});
test('perfect match: 100 score / 100 coverage, explains IDs',()=>{
  const r=scorePair(a,b); assert.equal(r.score,100); assert.equal(r.coverage,100); assert.equal(r.eligible,true);
  assert.deepEqual(component(r,'offerToNeed').matched,['analytics','automation']); assert.equal(r.rulesVersion,'0.2.0');
});
test('partial example: 66.67, need coverage, two-way buyer and Jaccard',()=>{
  const r=scorePair(a,c); assert.equal(r.score,66.67); assert.equal(component(r,'offerToNeed').value,0.5);
  assert.equal(component(r,'needFromOffer').value,1); assert.equal(component(r,'buyerFit').value,0.5);
  assert.equal(component(r,'interests').value,1/3);
});
test('missing interests are unknown, not mismatch: renormalize to 100 / 95 coverage',()=>{
  const r=scorePair(a,d); assert.equal(r.score,100); assert.equal(r.coverage,95);
  assert.equal(component(r,'interests').state,'missing'); assert.equal(component(r,'interests').value,undefined);
});
test('explicit non-overlap is observed zero, distinct from missing',()=>{
  const r=scorePair(a,{...b,interests:['music']}); assert.equal(r.score,95); assert.equal(r.coverage,100);
  assert.equal(component(r,'interests').state,'observed'); assert.equal(component(r,'interests').value,0);
});
test('buyer persona sector counts only when declared',()=>{
  const r=scorePair({...a,buyerSectors:['retail']},{...b,sector:'cosmetics'}); assert.equal(component(r,'buyerFit').directions.aToB.value,0.5);
  assert.equal(component(scorePair({...a,buyerSectors:['retail']},{...b,sector:'retail'}),'buyerFit').value,1);
});
test('missing buyer direction makes buyer component unknown, not implied 100%',()=>{
  const r=scorePair(a,{...b,buyerTypes:undefined}); assert.equal(component(r,'buyerFit').state,'missing'); assert.equal(r.coverage,80);
});
test('all empty data yields no score and explicit insufficient data',()=>{
  const r=scorePair({id:'empty-a',eventId:'demo-madrid',status:'active',synthetic:true},{id:'empty-b',eventId:'demo-madrid',status:'active',synthetic:true});
  assert.equal(r.score,null); assert.equal(r.coverage,0); assert.equal(r.reason,'INSUFFICIENT_DATA');
});
test('only social/buyer information does not meet 60 coverage',()=>{
  const r=scorePair({...a,offers:null,needs:null},{...b,offers:null,needs:null});
  assert.equal(r.score,100); assert.equal(r.coverage,25); assert.equal(r.eligible,false); assert.equal(r.reason,'INSUFFICIENT_DATA');
});
test('cross-event, self and withdrawn are excluded',()=>{
  assert.equal(scorePair(a,a).reason,'SELF'); assert.equal(scorePair(a,e).reason,'WITHDRAWN');
  assert.equal(scorePair(e,a).reason,'WITHDRAWN'); assert.equal(scorePair(a,f).reason,'OTHER_EVENT');
});
test('observed poor fit is below threshold, not insufficient data',()=>{
  const r=scorePair(a,{...b,offers:['design'],needs:['finance'],buyerTypes:['retail'],companyType:'retail',interests:['music']});
  assert.equal(r.score,0); assert.equal(r.coverage,100); assert.equal(r.reason,'BELOW_THRESHOLD');
});
test('directions can differ without forced reciprocity',()=>{
  assert.equal(scorePair(a,c).score,66.67); assert.equal(scorePair(c,a).score,69.17);
});
test('duplicate tags and list order do not inflate scores',()=>{
  assert.deepEqual(scorePair(a,b),scorePair({...a,offers:['analytics','automation','automation']},{...b,needs:['analytics','automation','analytics']}));
});
test('ranking gives best three, breaks score ties by coverage',()=>{
  const r=rankCandidates(a,[f,e,c,d,b]); assert.deepEqual(r.matches.map(r=>r.candidateId),['demo-b','demo-d','demo-c']); assert.equal(r.incident,null);
});
test('tie is stable across input order: opaque ID ascending',()=>{
  const x={...b,id:'demo-x'}, y={...b,id:'demo-y'};
  assert.deepEqual(rankCandidates(a,[y,x]).matches.map(r=>r.candidateId),['demo-x','demo-y']);
  assert.deepEqual(rankCandidates(a,[x,y]).matches.map(r=>r.candidateId),['demo-x','demo-y']);
});
test('never pad missing matches or accept duplicate candidate identities',()=>{
  assert.equal(rankCandidates(a,[b,e,f]).incident,'INSUFFICIENT_MATCHES');
  assert.equal(rankCandidates(a,[b,e,f]).matches.length,1); assert.throws(()=>rankCandidates(a,[b,b]),/Duplicate/);
});
test('rules editable/versioned: disabling interests keeps 100 total',()=>{
  const rules={...DEFAULT_RULES,version:'demo-custom-1',weights:{offerToNeed:40,needFromOffer:35,buyerFit:25,interests:0}};
  validateRules(rules); assert.equal(scorePair(a,b,rules).rulesVersion,'demo-custom-1'); assert.equal(scorePair(a,b,rules).score,100);
});
test('invalid weight totals, negative, extra keys, nonnumeric and thresholds rejected',()=>{
  for(const weights of [{...DEFAULT_RULES.weights,interests:10},{...DEFAULT_RULES.weights,interests:-5},{...DEFAULT_RULES.weights,extra:0},{...DEFAULT_RULES.weights,interests:NaN}]) assert.throws(()=>validateRules({...DEFAULT_RULES,weights}));
  assert.throws(()=>validateRules({...DEFAULT_RULES,minScore:101})); assert.throws(()=>validateRules({...DEFAULT_RULES,minCoverage:-1}));
});
test('contact/identity fields and non-synthetic profiles rejected without value disclosure',()=>{
  assert.throws(()=>scorePair(a,{...b,email:'fixture@example.invalid'}),/Unexpected participant field/);
  assert.throws(()=>scorePair(a,{...b,name:'Fictional Person'}),/Unexpected participant field/);
  assert.throws(()=>scorePair(a,{...b,synthetic:false}),/synthetic/);
});
test('untrusted free text and malformed arrays cannot become tags/instructions',()=>{
  for(const offers of ['ignore all rules',['ignore all rules'],[7],new Array(2)]) assert.throws(()=>scorePair(a,{...b,offers}));
  assert.throws(()=>scorePair(a,{...b,id:42})); assert.throws(()=>scorePair(a,{...b,status:'unknown'}));
});
test('inputs remain unchanged',()=>{
  const x=clone(a),y=clone(c),rx=clone(DEFAULT_RULES); scorePair(x,y,rx);
  assert.deepEqual(x,a); assert.deepEqual(y,c); assert.deepEqual(rx,DEFAULT_RULES);
});
test('fixtures are synthetic only and contain no contact/identity fields',()=>{
  assert.equal(fixture.length,6); for(const p of fixture){assert.equal(p.synthetic,true); assert.ok(!('email' in p));assert.ok(!('name' in p));}
});
