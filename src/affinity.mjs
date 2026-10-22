// Local demo scoring only. No network, identity data, model calls or sending.
export const DEFAULT_RULES = Object.freeze({
  version: '0.2.0',
  weights: Object.freeze({ offerToNeed: 40, needFromOffer: 35, buyerFit: 20, interests: 5 }),
  minCoverage: 60,
  minScore: 30,
});
const keys = ['offerToNeed', 'needFromOffer', 'buyerFit', 'interests'];
const fields = new Set(['id', 'eventId', 'status', 'offers', 'needs', 'buyerTypes', 'buyerSectors', 'companyType', 'sector', 'interests', 'synthetic']);
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function validateParticipant(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new TypeError('Invalid participant');
  if (Object.keys(p).some(k => !fields.has(k))) throw new TypeError('Unexpected participant field; identity/contact data not accepted');
  if (p.synthetic !== true) throw new TypeError('Demo accepts synthetic matching profiles only');
  if (typeof p.id !== 'string' || typeof p.eventId !== 'string' || !slug.test(p.id) || !slug.test(p.eventId)) throw new TypeError('Invalid opaque participant/event ID');
  if (!['active', 'withdrawn'].includes(p.status)) throw new TypeError('Invalid participation status');
  for (const field of ['offers', 'needs', 'buyerTypes', 'buyerSectors', 'interests']) {
    const list = p[field];
    if (list != null && (!Array.isArray(list) || Array.from(list).some(v => typeof v !== 'string' || !slug.test(v)))) throw new TypeError('Invalid catalog list: ' + field);
  }
  for (const field of ['companyType', 'sector']) if (p[field] != null && (typeof p[field] !== 'string' || !slug.test(p[field]))) throw new TypeError('Invalid ' + field);
}
export function validateRules(rules) {
  if (!rules || typeof rules !== 'object' || typeof rules.version !== 'string' || !rules.version.trim()) throw new TypeError('Rules require a version');
  if (!rules.weights || Object.keys(rules.weights).sort().join() !== [...keys].sort().join()) throw new TypeError('Invalid weight keys');
  if (keys.some(k => !Number.isFinite(rules.weights[k]) || rules.weights[k] < 0) || Math.abs(keys.reduce((s,k) => s + rules.weights[k],0)-100) > 1e-9) throw new TypeError('Non-negative weights must sum to 100');
  for (const k of ['minScore','minCoverage']) if (!Number.isFinite(rules[k]) || rules[k] < 0 || rules[k] > 100) throw new TypeError('Invalid threshold: ' + k);
}
function list(value) { return value == null || value.length === 0 ? null : [...new Set(value)].sort(); }
function coverage(offered, needed) {
  const o=list(offered), n=list(needed);
  if (!o || !n) return null;
  const matched=n.filter(v => o.includes(v));
  return { value: matched.length/n.length, matched, denominator: n.length };
}
// Buyer persona = target company types and, optionally, target sectors. Sector only counts when both sides declare it.
function buyer(targets, targetSectors, type, sector) {
  const t=list(targets);
  if (!t || type == null) return null;
  const typeHit=t.includes(type) ? 1 : 0, s=list(targetSectors);
  if (!s || sector == null) return { value: typeHit, matched: typeHit ? [type] : [], denominator: 1 };
  const sectorHit=s.includes(sector) ? 1 : 0;
  return { value: (typeHit+sectorHit)/2, matched: [...(typeHit ? [type] : []), ...(sectorHit ? [sector] : [])], denominator: 2 };
}
function interest(a,b) {
  const x=list(a), y=list(b);
  if (!x || !y) return null;
  const matched=x.filter(v => y.includes(v));
  return { value: matched.length/new Set([...x,...y]).size, matched, denominator: new Set([...x,...y]).size };
}
const round=n => Math.round((n+Number.EPSILON)*100)/100;
export function scorePair(a,b,rules=DEFAULT_RULES) {
  validateRules(rules); validateParticipant(a); validateParticipant(b);
  const excluded = a.id===b.id ? 'SELF' : a.eventId!==b.eventId ? 'OTHER_EVENT' : a.status!=='active' || b.status!=='active' ? 'WITHDRAWN' : null;
  if (excluded) return { candidateId:b.id, rulesVersion:rules.version, eligible:false, reason:excluded, score:null, coverage:0, components:[] };
  const buyerAB=buyer(a.buyerTypes,a.buyerSectors,b.companyType,b.sector), buyerBA=buyer(b.buyerTypes,b.buyerSectors,a.companyType,a.sector);
  // BuyerFit is known only when both directions are observed: never drop a missing direction silently.
  const buyerFit=buyerAB && buyerBA ? { value:(buyerAB.value+buyerBA.value)/2, directions:{ aToB:buyerAB,bToA:buyerBA } } : null;
  const values={ offerToNeed:coverage(a.offers,b.needs), needFromOffer:coverage(b.offers,a.needs), buyerFit, interests:interest(a.interests,b.interests) };
  const components=keys.map(key => ({ key, weight:rules.weights[key], state:values[key]===null?'missing':'observed', ...values[key] }));
  const observedWeight=components.reduce((s,c) => s+(c.state==='observed'?c.weight:0),0);
  const weighted=components.reduce((s,c) => s+(c.state==='observed'?c.weight*c.value:0),0);
  const rawScore=observedWeight===0?null:100*weighted/observedWeight;
  const reason=observedWeight===0 || observedWeight<rules.minCoverage ? 'INSUFFICIENT_DATA' : rawScore<rules.minScore ? 'BELOW_THRESHOLD' : null;
  return { candidateId:b.id, rulesVersion:rules.version, eligible:reason===null, reason, score:rawScore===null?null:round(rawScore), coverage:round(observedWeight), components };
}
export function rankCandidates(subject,candidates,rules=DEFAULT_RULES) {
  validateRules(rules); validateParticipant(subject);
  if (!Array.isArray(candidates)) throw new TypeError('Candidates must be an array');
  const seen=new Set();
  for (const c of candidates) { validateParticipant(c); if(seen.has(c.id)) throw new TypeError('Duplicate candidate ID'); seen.add(c.id); }
  const evaluated=candidates.map(c => scorePair(subject,c,rules));
  const ordered=evaluated.filter(r => r.eligible).sort((a,b) => b.score-a.score || b.coverage-a.coverage || (a.candidateId<b.candidateId?-1:a.candidateId>b.candidateId?1:0));
  const matches=ordered.slice(0,3);
  return { rulesVersion:rules.version, matches, evaluated, incident:matches.length<3?'INSUFFICIENT_MATCHES':null };
}
