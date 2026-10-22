// HTML part of the email, built from the parsed approved text (see composer.parseEmail).
// Inline styles only: email clients ignore stylesheets. Photos are participant-provided data URLs.
const E = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n).split(' ').slice(0, 2).map(v => v[0] ?? '').join('').toUpperCase();

function avatar(b) {
  return b.photo
    ? `<img src="${E(b.photo)}" alt="${E(b.name)}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block">`
    : `<div style="width:56px;height:56px;border-radius:50%;background:#e5ecdb;color:#506b45;font:700 16px/56px Arial,sans-serif;text-align:center">${E(initials(b.name))}</div>`;
}
const list = (title, items) => items.length ? `<p style="margin:14px 0 6px;font:700 11px Arial,sans-serif;letter-spacing:1px;color:#1e7058;text-transform:uppercase">${title}</p><ul style="margin:0;padding-left:18px">${items.map(t => `<li style="margin:0 0 6px">${E(t)}</li>`).join('')}</ul>` : '';
const motive = (label, text) => text ? `<p style="margin:6px 0"><b>${label}:</b> ${E(text)}</p>` : '';

export function emailHtml(p) {
  const blocks = p.blocks.map(b => `
  <table role="presentation" width="100%" style="border:1px solid #dfe6dc;border-radius:14px;margin:0 0 16px;border-collapse:separate"><tr><td style="padding:18px">
    <table role="presentation"><tr><td style="vertical-align:top;padding-right:14px">${avatar(b)}</td><td style="vertical-align:top">
      <p style="margin:0;font:700 17px Arial,sans-serif;color:#162c28">${E(b.name)}</p>
      <p style="margin:2px 0 0;color:#6c7a73">${E(b.role)} · ${E(b.company)}</p></td></tr></table>
    ${motive('Qué te aporta', b.givesYou)}${motive('Qué puedes aportarle', b.youGive)}${motive('Qué os une', b.bond)}
    ${list('Para romper el hielo', b.off)}${list('Para hablar de negocio', b.on)}
  </td></tr></table>`).join('');
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f7f1"><div style="max-width:620px;margin:0 auto;padding:24px;font:14px/1.6 Arial,sans-serif;color:#162c28">
  ${p.preamble.map(l => `<p style="margin:0 0 12px">${E(l)}</p>`).join('')}
  ${blocks}
  ${p.closing.map(l => `<p style="margin:0">${E(l)}</p>`).join('')}
  </div></body></html>`;
}
