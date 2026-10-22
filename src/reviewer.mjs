// Independent reviewer. It does NOT trust the sniper's conclusions: it re-reads the original
// records (profiles, posts, form fields) and checks the email text against them.
// Output: OK, or an incident with the exact reasons. It never sends anything.
//  - hard checks: data safety / wrong people / stale state → must regenerate, cannot be overridden
//  - soft checks: things a human can judge (fewer than 3 matches, manual edits) → "Resolver incidencia"
import { parseEmail } from './composer.mjs';
import { censor, hasUnsafeInstruction, findContactData } from './safety.mjs';

function check(id, label, severity, problems) {
  return { id, label, severity, ok: problems.length === 0, detail: problems };
}

function evidenceProblems(item, byId, analyses) {
  const out = [];
  if (item.kind !== 'neutral' && !item.evidence?.length) out.push('Afirmación sin evidencia: «' + item.text + '»');
  for (const ev of item.evidence ?? []) {
    const person = byId.get(ev.participantId);
    if (!person) { out.push('Evidencia de una persona inexistente'); continue; }
    if (ev.type === 'post') {
      const post = analyses.get(person.id)?.posts.find(p => p.id === ev.postId);
      if (!post) out.push(`Publicación ${ev.postId} no pertenece a ${person.name}`);
      else if (!post.usable) out.push(`Publicación ${ev.postId} no utilizable (${post.flags.join(', ') || 'sin tema'})`);
      else if (post.date !== ev.date) out.push(`Fecha de ${ev.postId} no coincide con la fuente`);
    } else if (ev.type === 'field') {
      const actual = person[ev.field];
      const values = Array.isArray(actual) ? actual : actual == null ? [] : [actual];
      if (!ev.values.every(v => values.includes(v))) out.push(`El campo ${ev.field} de ${person.name} no respalda «${ev.values.join(', ')}»`);
    }
  }
  return out;
}

export function reviewDraft({ draft, recipient, event, participants, analyses, rules, currentTop, hasContact }) {
  const byId = new Map(participants.map(p => [p.id, p]));
  const text = draft.content;
  const blocks = parseEmail(text);
  const expected = draft.items;
  const checks = [];

  checks.push(check('rules', 'Reglas vigentes', 'hard',
    draft.rulesVersion === rules.version ? [] : [`Generado con reglas ${draft.rulesVersion}; vigentes ${rules.version}. Regenera.`]));
  checks.push(check('recipient', 'Destinatario activo y con contacto', 'hard',
    [...(recipient?.status === 'active' ? [] : ['El destinatario se ha dado de baja']), ...(hasContact ? [] : ['Sin contacto registrado'])]));
  checks.push(check('matches-valid', 'Personas recomendadas válidas (mismo evento, activas)', 'hard',
    draft.matches.flatMap(m => { const q = byId.get(m.candidateId); return !q ? ['Persona inexistente'] : q.eventId !== event.id ? [`${q.name} es de otro evento`] : q.status !== 'active' ? [`${q.name} se ha dado de baja`] : []; })));
  const nowIds = currentTop.map(m => m.candidateId).join(), draftIds = draft.matches.map(m => m.candidateId).join();
  checks.push(check('matches-current', 'Selección igual a la calculadora actual', 'hard', nowIds === draftIds ? [] : ['La selección de matches ha cambiado. Regenera.']));
  checks.push(check('matches-count', 'Tres personas recomendadas', 'soft',
    draft.matches.length === 3 ? [] : [`Solo hay ${draft.matches.length} candidato(s) con afinidad suficiente; no se rellena con otros.`]));

  const identity = [];
  if (blocks.length !== expected.length) identity.push(`El texto contiene ${blocks.length} bloque(s) de persona; se esperaban ${expected.length}.`);
  expected.forEach((it, i) => {
    const b = blocks[i], q = byId.get(it.candidateId);
    if (!b || !q) return;
    if (b.name !== q.name) identity.push(`Bloque ${i + 1}: «${b.name}» no coincide con ${q.name}`);
    if (b.role !== q.role) identity.push(`Bloque ${i + 1}: cargo «${b.role}» no coincide con «${q.role}»`);
    if (b.company !== q.company) identity.push(`Bloque ${i + 1}: empresa «${b.company}» no coincide con «${q.company}»`);
  });
  if (!text.includes('Hola ' + recipient?.firstName)) identity.push('El saludo no corresponde al destinatario');
  checks.push(check('identity', 'Nombres, cargos y empresas correctos', 'hard', identity));

  const allowed = new Set([recipient?.id, ...draft.matches.map(m => m.candidateId)]);
  const leaks = participants.filter(p => !allowed.has(p.id) && (text.includes(p.name) || (p.company.length > 4 && text.includes(p.company)))).map(p => `Aparece ${p.name} / ${p.company}, que no es parte de este email`);
  checks.push(check('no-mixing', 'Sin datos de otras personas o eventos', 'hard', leaks));

  const qty = [];
  blocks.forEach((b, i) => {
    if (b.off.length !== rules.offTopicCount) qty.push(`Bloque ${i + 1}: ${b.off.length} temas off-topic (se esperaban ${rules.offTopicCount})`);
    if (b.on.length !== rules.onTopicCount) qty.push(`Bloque ${i + 1}: ${b.on.length} temas on-topic (se esperaban ${rules.onTopicCount})`);
  });
  checks.push(check('quantities', `${rules.offTopicCount} off-topic y ${rules.onTopicCount} on-topic por persona`, 'hard', qty));

  checks.push(check('evidence', 'Cada afirmación personal tiene fuente válida', 'hard',
    expected.flatMap(it => [...it.off, ...it.on].flatMap(item => evidenceProblems(item, byId, analyses)))));

  const generated = new Set(draft.generatedContent.split(/\r?\n/).map(l => l.trim()));
  const changed = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !generated.has(l));
  checks.push(check('edits', 'Texto sin afirmaciones nuevas no verificadas', 'soft',
    changed.map(l => 'Línea editada a mano (verificar): «' + (l.length > 90 ? l.slice(0, 87) + '…' : l) + '»')));

  checks.push(check('sensitive', 'Sin DNI/NIE/IBAN', 'hard', censor(text).blocked ? ['Identificador sensible en el texto'] : []));
  checks.push(check('contact', 'Sin correos ni teléfonos en el cuerpo', 'hard', findContactData(text).length ? ['Dato de contacto en el texto'] : []));
  checks.push(check('injection', 'Sin instrucciones no confiables', 'hard', hasUnsafeInstruction(text) ? ['Instrucción sospechosa en el texto'] : []));

  const warnings = [recipient?.id, ...draft.matches.map(m => m.candidateId)]
    .flatMap(id => (analyses.get(id)?.warnings ?? []).map(w => ({ ...w, person: byId.get(id)?.name })));
  const neutral = expected.reduce((n, it) => n + it.off.filter(t => t.kind === 'neutral').length, 0);
  if (neutral) warnings.push({ code: 'NEUTRAL_FALLBACK', message: `${neutral} rompehielos son preguntas abiertas por falta de publicaciones utilizables.` });

  const failed = checks.filter(c => !c.ok);
  return {
    status: failed.length ? 'incident' : 'ok',
    resolvable: failed.length > 0 && failed.every(c => c.severity === 'soft'),
    checks, warnings, revision: draft.revision, rulesVersion: rules.version,
    reviewer: 'Revisor independiente (determinista)', date: new Date().toISOString(),
  };
}
