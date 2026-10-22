// "Redactor": turns the sniper's structured output into the plain-text email.
// It adds no facts of its own; parseEmail() is the inverse used by the reviewer.
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function subjectFor(event, n) {
  return n ? `Mañana en ${event.name}: ${n === 1 ? 'una persona' : n + ' personas'} con las que te conviene hablar` : `Mañana en ${event.name}`;
}

export function composeEmail(A, event, items) {
  const lines = [`Hola ${A.firstName},`, ''];
  if (!items.length) {
    lines.push(`Mañana nos vemos en ${event.name} (${event.city}, ${event.time} h). Todavía no tenemos recomendaciones con suficiente afinidad para ti; el equipo te presentará a gente en persona.`);
  } else {
    lines.push(`Mañana nos vemos en ${event.name} (${event.city}, ${event.time} h). Hemos cruzado lo que ofreces y lo que buscas con el resto de asistentes y te proponemos ${items.length === 1 ? 'esta conversación' : 'estas ' + items.length + ' conversaciones'}:`);
    items.forEach((it, i) => {
      lines.push('', `${i + 1}. ${it.name} — ${it.role} en ${it.company}`, `Por qué: ${cap(it.reason)}`, 'Para romper el hielo:');
      for (const t of it.off) lines.push('- ' + t.text);
      lines.push('Para hablar de negocio:');
      for (const t of it.on) lines.push('- ' + t.text);
    });
  }
  lines.push('', 'Nos vemos mañana.', 'Equipo organizador');
  return lines.join('\n');
}

export function parseEmail(text) {
  const blocks = [];
  let current = null, section = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    const head = line.match(/^(\d+)\.\s+(.+?)\s+—\s+(.+?)\s+en\s+(.+)$/);
    if (head) { current = { index: Number(head[1]), name: head[2], role: head[3], company: head[4], reason: null, off: [], on: [] }; blocks.push(current); section = null; continue; }
    if (!current) continue;
    if (/^Por qué:/.test(line)) { current.reason = line; continue; }
    if (/^Para romper el hielo:?$/i.test(line)) { section = 'off'; continue; }
    if (/^Para hablar de negocio:?$/i.test(line)) { section = 'on'; continue; }
    if (/^[-•*]\s+/.test(line) && section) { current[section].push(line.replace(/^[-•*]\s+/, '')); continue; }
    if (line === '' ) continue;
    if (/^Nos vemos mañana\.?$/.test(line)) { current = null; continue; }
    current.extra = [...(current.extra ?? []), line];
  }
  return blocks;
}
