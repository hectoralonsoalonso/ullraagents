// "Redactor": turns the sniper's structured output into the plain-text email.
// It adds no facts of its own. parseEmail() is the inverse: the reviewer, the visual preview
// and the HTML part of the .eml are all built from the parsed text, so what is previewed and
// sent is exactly what was approved.
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
      lines.push('', `${i + 1}. ${it.name} — ${it.role} en ${it.company}`);
      if (it.givesYou) lines.push('Qué te aporta: ' + it.givesYou.text);
      if (it.youGive) lines.push('Qué puedes aportarle: ' + it.youGive.text);
      if (!it.givesYou && !it.youGive) lines.push('Qué os une: vuestros tipos de empresa y temas encajan según la calculadora de afinidad.');
      if (it.off.length) { lines.push('Para romper el hielo:'); for (const t of it.off) lines.push('- ' + t.text); }
      if (it.on.length) { lines.push('Para hablar de negocio:'); for (const t of it.on) lines.push('- ' + t.text); }
    });
  }
  lines.push('', 'Nos vemos mañana.', 'Equipo organizador');
  return lines.join('\n');
}

export function parseEmail(text) {
  const preamble = [], blocks = [], closing = [];
  let current = null, section = null, ended = false;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    const head = line.match(/^(\d+)\.\s+(.+?)\s+—\s+(.+?)\s+en\s+(.+)$/);
    if (head && !ended) { current = { index: Number(head[1]), name: head[2], role: head[3], company: head[4], givesYou: null, youGive: null, bond: null, off: [], on: [], extra: [] }; blocks.push(current); section = null; continue; }
    if (/^Nos vemos mañana\.?$/.test(line)) ended = true;
    if (ended) { if (line) closing.push(line); continue; }
    if (!current) { if (line) preamble.push(line); continue; }
    if (!line) continue;
    let m;
    if ((m = line.match(/^Qué te aporta:\s*(.*)$/))) { current.givesYou = m[1]; section = null; continue; }
    if ((m = line.match(/^Qué puedes aportarle:\s*(.*)$/))) { current.youGive = m[1]; section = null; continue; }
    if ((m = line.match(/^Qué os une:\s*(.*)$/))) { current.bond = m[1]; section = null; continue; }
    if (/^Para romper el hielo:?$/i.test(line)) { section = 'off'; continue; }
    if (/^Para hablar de negocio:?$/i.test(line)) { section = 'on'; continue; }
    if (/^[-•*]\s+/.test(line) && section) { current[section].push(line.replace(/^[-•*]\s+/, '')); continue; }
    current.extra.push(line);
  }
  return { preamble, blocks, closing };
}
