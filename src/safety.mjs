// Conservative demo filter, not a complete PII classifier or legal guarantee.
const patterns=[/(?:\d[ .-]*){8}[A-Z]\b/gi,/[XYZ][ .-]*(?:\d[ .-]*){7}[A-Z]\b/gi,/[A-Z]{2}[ .-]*\d[ .-]*\d(?:[ .-]*[A-Z0-9]){11,30}\b/gi];
export function censor(text){let output=String(text),blocked=false;for(const p of patterns){p.lastIndex=0;output=output.replace(p,()=>{blocked=true;return '[DATO BLOQUEADO]';});}return {text:output,blocked};}
export function hasUnsafeInstruction(text){return /ignora(?:r)? (?:todas? )?(?:las )?(?:reglas|instrucciones)|ignore (?:all |previous )?(?:instructions|rules)|exfiltra|system prompt/i.test(text);}
