// "Sniper" agent: for one recipient (A) and one recommended person (Q), explains the match in
// both directions and proposes icebreakers that A can say to Q. Every item carries its source.
// Icebreakers come from dated facts and posts ("vi que estuviste en … la semana pasada");
// when there is no source the slot stays PENDING (generic questions only if rules allow it).
import { CATALOG, INTEREST_PROMPTS, DEFAULT_NEUTRAL_QUESTIONS } from './catalog.mjs';
import { censor, hasUnsafeInstruction, findContactData } from './safety.mjs';

const fmt = d => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
// Labels like «CRM y fidelización» already contain «y»: then a plain comma list reads better.
const listEs = xs => xs.length < 2 ? xs.join('') : xs.some(x => / y /.test(x)) ? xs.join(', ') : xs.slice(0, -1).join(', ') + ' y ' + xs.at(-1);
const tags = xs => listEs(xs.map(v => CATALOG.tags[v] ?? v));
const intersect = (a, b) => [...new Set((a ?? []).filter(v => (b ?? []).includes(v)))];
// Declared free text is untrusted: quote it only when it is clean.
const quotable = t => typeof t === 'string' && t.trim() && !hasUnsafeInstruction(t) && !censor(t).blocked && !findContactData(t).length;
const postEvidence = (participantId, p) => ({ type: 'post', participantId, postId: p.id, date: p.date, kind: p.kind, snippet: p.quotable ? p.snippet : '[texto no citable]' });
const fieldEvidence = (participantId, field, values) => ({ type: 'field', participantId, field, values });

export function relativeDate(date, now = new Date()) {
  const days = Math.floor((now - new Date(date + 'T12:00:00Z')) / 864e5);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  if (days < 14) return 'la semana pasada';
  if (days < 31) return `hace ${Math.round(days / 7)} semanas`;
  return 'el ' + fmt(date);
}

const FACT_LINES = {
  event: (n, t, r) => `${n}, vi que estuviste en ${t} ${r}. ¿Qué tal fue? ¿Con qué idea te quedaste?`,
  talk: (n, t, r) => `${n}, vi que diste una charla en ${t} ${r}. ¿Cómo salió?`,
  achievement: (n, t, r) => `${n}, enhorabuena por ${t} (${r}). ¿Cómo lo vivisteis por dentro?`,
  trip: (n, t, r) => `${n}, vi que estuviste en ${t} ${r}. ¿Qué tal la experiencia?`,
  article: (n, t, r) => `${n}, leí ${t} que publicaste ${r}. ¿Qué te llevó a escribirlo?`,
};
const sourceLabel = p => `su ${p.kind === 'repost' ? 'republicación' : 'publicación'} del ${fmt(p.date)}`;

// avoidTopics: hobby topics already used for other people in the same email (variety across blocks).
export function offTopics(A, Q, analysisA, analysisQ, rules, now = new Date(), avoidTopics = new Set()) {
  const count = rules.offTopicCount, out = [], usedPosts = new Set(), usedTopics = new Set();
  const recent = a => a.posts.filter(p => p.usable).sort((x, y) => y.date.localeCompare(x.date));
  const theirs = recent(analysisQ), mine = recent(analysisA);
  const push = item => { if (out.length < count) out.push(item); };
  // 1. Dated facts with a story: the strongest icebreakers.
  for (const p of theirs.filter(p => p.narrative)) {
    usedPosts.add(p.id);
    push({ kind: 'fact', text: `«${FACT_LINES[p.kind](Q.firstName, p.title, relativeDate(p.date, now))}» (fuente: ${sourceLabel(p)})`, evidence: [postEvidence(Q.id, p)] });
  }
  // 2-3. Hobby posts: shared topics first, then theirs. Topics already used for other people in
  // this email are tried last, and every line carries its own date so no two read the same.
  for (const pass of [false, true]) for (const shared of [true, false]) for (const p of theirs) {
    if (usedPosts.has(p.id)) continue;
    const topic = p.topics.find(t => !usedTopics.has(t) && (pass || !avoidTopics.has(t)) && (!shared || mine.some(m => m.topics.includes(t))));
    if (!topic) continue;
    usedPosts.add(p.id); usedTopics.add(topic);
    const what = `tu ${p.kind === 'repost' ? 'republicación' : 'publicación'} sobre ${CATALOG.interests[topic].toLowerCase()} ${relativeDate(p.date, now)}`;
    if (shared) {
      const myPost = mine.find(m => m.topics.includes(topic));
      push({ kind: 'shared-post', topic, text: `«${Q.firstName}, vi ${what}: a mí también me tira. ${INTEREST_PROMPTS[topic]}» (fuente: ${sourceLabel(p)} y la tuya del ${fmt(myPost.date)})`,
        evidence: [postEvidence(A.id, myPost), postEvidence(Q.id, p)] });
    } else push({ kind: 'their-post', topic, text: `«${Q.firstName}, vi ${what}. ${INTEREST_PROMPTS[topic]}» (fuente: ${sourceLabel(p)})`, evidence: [postEvidence(Q.id, p)] });
  }
  // 4. Not enough sources: optional neutral fallback, otherwise the slot stays pending.
  if (rules.allowNeutralFallback) {
    const neutral = rules.neutralQuestions?.length ? rules.neutralQuestions : DEFAULT_NEUTRAL_QUESTIONS;
    let k = [...Q.id].reduce((s, c) => s + c.charCodeAt(0), 0) % neutral.length;
    for (let guard = 0; out.length < count && guard < neutral.length; guard++, k = (k + 1) % neutral.length)
      push({ kind: 'neutral', text: `Pregunta abierta: «${neutral[k]}»`, evidence: [] });
  }
  return { items: out, missing: count - out.length };
}

// What Q can do for A and what A can do for Q, only from real catalog matches.
export function motives(A, Q) {
  const theyOffer = intersect(Q.offers, A.needs), youOffer = intersect(A.offers, Q.needs);
  const of = (n, list, who) => `${n} de ${who} ${list.length} necesidad${list.length === 1 ? '' : 'es'} declarada${list.length === 1 ? '' : 's'}`;
  return {
    givesYou: theyOffer.length ? { tags: theyOffer, text: `Puede ayudarte con ${tags(theyOffer)} (${of(theyOffer.length, A.needs, 'tus')}).`,
      evidence: [fieldEvidence(Q.id, 'offers', theyOffer), fieldEvidence(A.id, 'needs', theyOffer)] } : null,
    youGive: youOffer.length ? { tags: youOffer, text: `Tú puedes ayudarle con ${tags(youOffer)} (${of(youOffer.length, Q.needs, 'sus')}).`,
      evidence: [fieldEvidence(A.id, 'offers', youOffer), fieldEvidence(Q.id, 'needs', youOffer)] } : null,
  };
}

export function onTopics(A, Q, rules) {
  const candidates = [];
  const theyOffer = intersect(Q.offers, A.needs), youOffer = intersect(A.offers, Q.needs);
  if (theyOffer.length) candidates.push({ kind: 'their-offer', text: (quotable(Q.offerText) ? `En su ficha cuenta: «${Q.offerText.trim()}» ` : '') + `Pregúntale por su experiencia en ${tags(theyOffer)} y qué resultados ha visto.`,
    evidence: [fieldEvidence(Q.id, 'offers', theyOffer), fieldEvidence(A.id, 'needs', theyOffer)] });
  if (youOffer.length) candidates.push({ kind: 'your-offer', text: (quotable(Q.needText) ? `Su reto: «${Q.needText.trim()}» ` : '') + `Cuéntale qué te ha funcionado en ${tags(youOffer)}.`,
    evidence: [fieldEvidence(A.id, 'offers', youOffer), fieldEvidence(Q.id, 'needs', youOffer)] });
  if ((A.buyerTypes ?? []).includes(Q.companyType)) candidates.push({ kind: 'buyer-fit', text: `${Q.company} (${CATALOG.companyTypes[Q.companyType]}) es el tipo de empresa al que te diriges: explorad si tiene sentido colaborar.`,
    evidence: [fieldEvidence(A.id, 'buyerTypes', [Q.companyType]), fieldEvidence(Q.id, 'companyType', [Q.companyType])] });
  if ((Q.buyerTypes ?? []).includes(A.companyType)) candidates.push({ kind: 'reverse-buyer-fit', text: `Tu empresa encaja con el perfil de cliente que busca ${Q.firstName}: puede haber conversación comercial en ambos sentidos.`,
    evidence: [fieldEvidence(Q.id, 'buyerTypes', [A.companyType]), fieldEvidence(A.id, 'companyType', [A.companyType])] });
  if (A.sector === Q.sector && A.sector !== 'unclassified') candidates.push({ kind: 'same-sector', text: `Compartís sector (${CATALOG.sectors[A.sector]}): comparad qué os está funcionando este año.`,
    evidence: [fieldEvidence(A.id, 'sector', [A.sector]), fieldEvidence(Q.id, 'sector', [Q.sector])] });
  const items = candidates.slice(0, rules.onTopicCount);
  if (rules.allowNeutralFallback) {
    const fallback = ['¿Qué reto de negocio te gustaría resolver antes de fin de año?', '¿Qué alianza te ayudaría a crecer el próximo trimestre?', '¿Qué cambiarías de tu canal digital con lo aprendido este año?'];
    for (let k = 0; items.length < rules.onTopicCount && k < fallback.length; k++) items.push({ kind: 'neutral', text: `Pregunta abierta: «${fallback[k]}»`, evidence: [] });
  }
  return { items, missing: rules.onTopicCount - items.length };
}

export function snipe(A, Q, analysisA, analysisQ, rules, { now = new Date(), avoidTopics } = {}) {
  const off = offTopics(A, Q, analysisA, analysisQ, rules, now, avoidTopics), on = onTopics(A, Q, rules);
  for (const t of off.items) if (t.topic) avoidTopics?.add(t.topic);
  return { ...motives(A, Q), off: off.items, on: on.items, missingOff: off.missing, missingOn: on.missing };
}
