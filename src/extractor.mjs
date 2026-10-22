// "Extractor" step: turns a participant's public posts into structured, dated evidence.
// Posts are untrusted data: instructions inside them are flagged and never followed,
// and posts with sensitive identifiers or past the max age are not usable as evidence.
import { INTEREST_KEYWORDS } from './catalog.mjs';
import { censor, hasUnsafeInstruction, fold } from './safety.mjs';

const daysBetween = (from, to) => Math.floor((to - new Date(from + 'T12:00:00Z')) / 864e5);
const keywordRe = Object.fromEntries(Object.entries(INTEREST_KEYWORDS).map(([k, words]) =>
  [k, new RegExp('(?:^|[^a-z0-9])(?:' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'i')]));

export function detectTopics(text) {
  const t = fold(text);
  return Object.keys(keywordRe).filter(k => keywordRe[k].test(t));
}

export function analyzePosts(participant, { now = new Date(), maxPostAgeDays = 180 } = {}) {
  const posts = (participant.posts ?? []).map(post => {
    const flags = [];
    const safe = censor(post.text);
    if (hasUnsafeInstruction(post.text)) flags.push('INJECTION');
    if (safe.blocked) flags.push('SENSITIVE_ID');
    const age = daysBetween(post.date, now);
    if (age > maxPostAgeDays) flags.push('STALE');
    // A post with an injection attempt is quarantined entirely; sensitive IDs are masked
    // and the post can still back a topic, but its text is never quoted.
    const topics = flags.includes('INJECTION') ? [] : detectTopics(safe.text);
    return { id: post.id, kind: post.kind, date: post.date, ageDays: age, topics, flags,
      usable: !flags.includes('INJECTION') && !flags.includes('STALE') && topics.length > 0,
      quotable: flags.length === 0, snippet: safe.text.length > 110 ? safe.text.slice(0, 107) + '…' : safe.text };
  });
  const interests = [...new Set(posts.filter(p => p.usable).flatMap(p => p.topics))].sort();
  const warnings = [];
  if (posts.some(p => p.flags.includes('INJECTION'))) warnings.push({ code: 'INJECTION_ATTEMPT', participantId: participant.id, message: 'Publicación con instrucciones maliciosas: aislada y sin ejecutar.' });
  if (posts.some(p => p.flags.includes('SENSITIVE_ID'))) warnings.push({ code: 'SENSITIVE_ID_IN_SOURCE', participantId: participant.id, message: 'Publicación con identificador sensible: enmascarado, nunca se cita.' });
  if (posts.some(p => p.flags.includes('STALE'))) warnings.push({ code: 'STALE_SOURCE', participantId: participant.id, message: 'Publicaciones antiguas ignoradas (más de ' + maxPostAgeDays + ' días).' });
  if (!posts.length) warnings.push({ code: 'NO_SOURCES', participantId: participant.id, message: 'Sin publicaciones: solo preguntas neutrales.' });
  // Missing posts means "unknown", never "no interests": null keeps it out of the score denominator.
  return { participantId: participant.id, posts, interests: interests.length ? interests : null, warnings };
}
