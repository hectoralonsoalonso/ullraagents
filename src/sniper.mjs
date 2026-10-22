// "Sniper" agent: for one recipient (A) and one recommended person (Q), proposes
// off-topic icebreakers (from public posts) and on-topic business topics (from the form).
// Every factual item carries evidence; when there is none it falls back to an open question
// and says so. It never states a personal fact that no source backs.
import { CATALOG, INTEREST_PROMPTS, DEFAULT_NEUTRAL_QUESTIONS } from './catalog.mjs';
import { censor, hasUnsafeInstruction, findContactData } from './safety.mjs';

const fmt = d => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
const listEs = xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs.at(-1);
const tags = xs => listEs(xs.map(v => CATALOG.tags[v] ?? v));
const intersect = (a, b) => (a ?? []).filter(v => (b ?? []).includes(v));
// Declared free text is untrusted: quote it only when it is clean.
const quotable = t => typeof t === 'string' && t.trim() && !hasUnsafeInstruction(t) && !censor(t).blocked && !findContactData(t).length;
const postEvidence = (participantId, p) => ({ type: 'post', participantId, postId: p.id, date: p.date, kind: p.kind, snippet: p.quotable ? p.snippet : '[texto no citable]' });
const fieldEvidence = (participantId, field, values) => ({ type: 'field', participantId, field, values });

function latestByTopic(analysis) {
  const out = new Map();
  for (const p of [...analysis.posts].filter(p => p.usable).sort((a, b) => b.date.localeCompare(a.date)))
    for (const t of p.topics) if (!out.has(t)) out.set(t, p);
  return out;
}

export function offTopics(A, Q, analysisA, analysisQ, rules) {
  const count = rules.offTopicCount, out = [], used = new Set();
  const mine = latestByTopic(analysisA), theirs = latestByTopic(analysisQ);
  for (const [topic, post] of theirs) {
    if (out.length >= count || !mine.has(topic)) continue;
    used.add(topic);
    out.push({ kind: 'shared-post', topic, text: `Los dos habéis publicado sobre ${CATALOG.interests[topic].toLowerCase()} (${Q.firstName}, el ${fmt(post.date)}). Pregúntale: «${INTEREST_PROMPTS[topic]}»`,
      evidence: [postEvidence(A.id, mine.get(topic)), postEvidence(Q.id, post)] });
  }
  for (const [topic, post] of theirs) {
    if (out.length >= count || used.has(topic)) continue;
    used.add(topic);
    const verb = post.kind === 'repost' ? 'compartió una publicación' : 'publicó';
    out.push({ kind: 'their-post', topic, text: `${Q.firstName} ${verb} sobre ${CATALOG.interests[topic].toLowerCase()} el ${fmt(post.date)}. Pregúntale: «${INTEREST_PROMPTS[topic]}»`,
      evidence: [postEvidence(Q.id, post)] });
  }
  const neutral = (rules.neutralQuestions?.length ? rules.neutralQuestions : DEFAULT_NEUTRAL_QUESTIONS);
  // Rotate the start so two matches in the same email don't repeat the same questions.
  let k = [...Q.id].reduce((s, c) => s + c.charCodeAt(0), 0) % neutral.length;
  for (let guard = 0; out.length < count && guard < neutral.length; guard++, k = (k + 1) % neutral.length)
    out.push({ kind: 'neutral', topic: null, text: `Pregunta abierta: «${neutral[k]}»`, evidence: [] });
  return out;
}

export function onTopics(A, Q, rules) {
  const candidates = [];
  const theyOffer = intersect(Q.offers, A.needs), youOffer = intersect(A.offers, Q.needs);
  if (theyOffer.length) candidates.push({ kind: 'their-offer', text: `${Q.firstName} ofrece ${tags(theyOffer)}, justo lo que buscas.` + (quotable(Q.offerText) ? ` En su ficha: «${Q.offerText.trim()}»` : '') + ' Pregúntale cómo lo ha resuelto con otras empresas.',
    evidence: [fieldEvidence(Q.id, 'offers', theyOffer), fieldEvidence(A.id, 'needs', theyOffer)] });
  if (youOffer.length) candidates.push({ kind: 'your-offer', text: `Tú puedes aportar ${tags(youOffer)} a su reto` + (quotable(Q.needText) ? `: «${Q.needText.trim()}»` : '.') + ' Cuéntale qué te ha funcionado.',
    evidence: [fieldEvidence(A.id, 'offers', youOffer), fieldEvidence(Q.id, 'needs', youOffer)] });
  if ((A.buyerTypes ?? []).includes(Q.companyType)) candidates.push({ kind: 'buyer-fit', text: `${Q.company} (${CATALOG.companyTypes[Q.companyType]}) encaja con el tipo de empresa al que te diriges. Explorad si tiene sentido colaborar.`,
    evidence: [fieldEvidence(A.id, 'buyerTypes', [Q.companyType]), fieldEvidence(Q.id, 'companyType', [Q.companyType])] });
  if ((Q.buyerTypes ?? []).includes(A.companyType)) candidates.push({ kind: 'reverse-buyer-fit', text: `Tu empresa encaja con el perfil de cliente que busca ${Q.firstName}. Puede ser una buena conversación comercial en ambos sentidos.`,
    evidence: [fieldEvidence(Q.id, 'buyerTypes', [A.companyType]), fieldEvidence(A.id, 'companyType', [A.companyType])] });
  if (A.sector === Q.sector && A.sector !== 'unclassified') candidates.push({ kind: 'same-sector', text: `Compartís sector (${CATALOG.sectors[A.sector]}): comparad qué está funcionando este año.`,
    evidence: [fieldEvidence(A.id, 'sector', [A.sector]), fieldEvidence(Q.id, 'sector', [Q.sector])] });
  const out = candidates.slice(0, rules.onTopicCount);
  const fallback = ['¿Qué reto de negocio te gustaría resolver antes de fin de año?', '¿Qué alianza te ayudaría a crecer el próximo trimestre?', '¿Qué has aprendido este año que cambiarías en tu canal digital?'];
  for (let k = 0; out.length < rules.onTopicCount && k < fallback.length; k++) out.push({ kind: 'neutral', text: `Pregunta abierta: «${fallback[k]}»`, evidence: [] });
  return out;
}

// Short "why" line for the email, derived only from the explained score components.
export function reasonFor(A, Q) {
  const parts = [];
  const theyOffer = intersect(Q.offers, A.needs), youOffer = intersect(A.offers, Q.needs);
  if (theyOffer.length) parts.push(`ofrece ${tags(theyOffer)}, que buscas`);
  if (youOffer.length) parts.push(`busca ${tags(youOffer)}, que tú ofreces`);
  if (!parts.length) parts.push('vuestros perfiles profesionales encajan');
  return parts.join('; ') + '.';
}

export function snipe(A, Q, analysisA, analysisQ, rules) {
  return { off: offTopics(A, Q, analysisA, analysisQ, rules), on: onTopics(A, Q, rules), reason: reasonFor(A, Q) };
}
