// Conservative demo filters, not a complete PII classifier or legal guarantee.
// DNI, NIE and IBAN are matched also when written with spaces, dots or dashes.
const patterns=[/(?:\d[ .-]*){8}[A-Z]\b/gi,/[XYZ][ .-]*(?:\d[ .-]*){7}[A-Z]\b/gi,/\b[A-Z]{2}[ .-]?\d{2}(?:[ .-]?[A-Z0-9]{4}){2,7}(?:[ .-]?[A-Z0-9]{1,4})?\b/g,/\b[a-z]{2}\d{2}(?:[ .-]?\d{4}){4,7}\b/gi];
export function censor(text){let output=String(text),blocked=false;for(const p of patterns){p.lastIndex=0;output=output.replace(p,()=>{blocked=true;return '[DATO BLOQUEADO]';});}return {text:output,blocked};}
const fold=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const injection=[/ignora(?:r)? (?:todas? )?(?:las )?(?:reglas|instrucciones)/,/olvida (?:todas? )?(?:las )?(?:reglas|instrucciones)/,/ignore (?:all |previous |the )*(?:instructions|rules)/,/exfiltra/,/system prompt/,/envia (?:la |el |los |las )?(?:lista|listado|correos|emails|datos)/,/(?:a partir de ahora|desde ahora) (?:eres|actua)/,/send (?:the )?(?:list|emails|data)/];
export function hasUnsafeInstruction(text){const t=fold(text);return injection.some(r=>r.test(t));}
// Contact data must never travel inside a generated email body.
export function findContactData(text){return [...String(text).matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+|(?:\+34[ .-]?)?[6789]\d{2}(?:[ .-]?\d{3}){2}\b/g)].map(m=>m[0]);}
export { fold };
