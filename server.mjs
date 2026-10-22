import {createServer} from 'node:http';
import {randomBytes,randomUUID,timingSafeEqual,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {DEFAULT_RULES,validateRules,rankCandidates} from './src/affinity.mjs';
import {CATALOG,makeDemoData,matchingProfile} from './src/demo-data.mjs';
import {censor,hasUnsafeInstruction} from './src/safety.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url));
const assets=new Map([['/',['web/index.html','text/html; charset=utf-8']],['/app.js',['web/app.js','text/javascript; charset=utf-8']],['/styles.css',['web/styles.css','text/css; charset=utf-8']]]);
const documents=['PROPUESTA','REQUISITOS','ARQUITECTURA','SEGURIDAD','BACKLOG','PRUEBAS','DECISIONES','FORMULA','DEMO'];
const codeError=(status,message)=>Object.assign(new Error(message),{status});
function safeEqual(a,b){const x=Buffer.from(a??''),y=Buffer.from(b??'');return x.length===y.length&&timingSafeEqual(x,y);}
function onlyKeys(obj,keys){if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).some(k=>!keys.includes(k)))throw codeError(400,'Campos no permitidos');}
function text(value,max=120){if(typeof value!=='string'||!value.trim()||value.length>max)throw codeError(400,'Texto ausente o demasiado largo');const clean=value.trim();if(censor(clean).blocked||hasUnsafeInstruction(clean))throw codeError(400,'Dato no permitido en esta demo');return clean;}
function choices(value,catalog){if(!Array.isArray(value)||value.length>12||value.some(v=>typeof v!=='string'||!Object.hasOwn(catalog,v)))throw codeError(400,'Selección fuera del catálogo');return [...new Set(value)];}
async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))throw codeError(415,'Usa JSON');let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>24000)throw codeError(413,'Entrada demasiado grande');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw codeError(400,'JSON inválido');}}
export function createApp(){
 const state=makeDemoData(),sessions=new Map(),drafts=new Map(),deliveries=new Map();
 let rules={...structuredClone(DEFAULT_RULES),offTopicCount:3,onTopicCount:2},ruleSerial=0;
 const participant=id=>state.participants.find(p=>p.id===id);
 const rank=id=>{const p=participant(id);if(!p)throw codeError(404,'Participante no encontrado');return rankCandidates(matchingProfile(p),state.participants.filter(c=>c.eventId===p.eventId&&c.id!==p.id).map(matchingProfile),rules);};
 function publicDraft(d){return {...d,baseline:undefined,owner:undefined};}
 function generate(p,result){
  const evidence=[];const parts=['BORRADOR DE DEMOSTRACIÓN · TODOS LOS PERFILES SON FICTICIOS','Hola '+p.name+',','Estas son tus conexiones propuestas para '+state.events.find(e=>e.id===p.eventId).name+'.'];
  for(const [i,m] of result.matches.entries()){
   const q=participant(m.candidateId),shared=p.interests.filter(v=>q.interests.includes(v));
   const evidenceId='fixture-'+p.id+'-'+q.id;
   evidence.push({id:evidenceId,date:'2026-10-22',source:'Formulario ficticio de la demo; no es LinkedIn',participantIds:[p.id,q.id],sharedInterests:shared.map(v=>CATALOG.interests[v])});
   parts.push('','[MATCH '+q.id+']',String(i+1)+'. '+q.name+' · '+q.role+' · '+q.company,'Afinidad '+m.score+'/100 · cobertura de datos '+m.coverage+'%.');
   for(let k=0;k<rules.offTopicCount;k++){
    const neutral=['¿Qué actividad te ayuda a desconectar del trabajo?','¿Qué recomendación cultural te ha sorprendido últimamente?','¿Qué lugar te gustaría descubrir este año?','¿Qué habilidad ajena al trabajo te gustaría aprender?','¿Qué plan sencillo recomendarías para un fin de semana?'];
    const question=k===0&&shared.length?'En vuestros perfiles ficticios aparece '+CATALOG.interests[shared[0]]+'. ¿Qué os gusta de esa actividad?':neutral[k%neutral.length];
    parts.push('[OFF] '+question);
   }
   const outgoing=m.components.find(c=>c.key==='offerToNeed')?.matched??[],incoming=m.components.find(c=>c.key==='needFromOffer')?.matched??[];
   for(let k=0;k<rules.onTopicCount;k++){
    const tags=(k%2===0?outgoing:incoming).map(v=>CATALOG.tags[v]);
    parts.push('[ON] '+(tags.length?'¿Qué reto concreto podríais explorar alrededor de '+tags.join(' y ')+'?':'¿Qué reto profesional os gustaría contrastar y qué experiencia podríais aportar?'));
   }
  }
  parts.push('','Este mensaje es una simulación local. No se enviará ningún correo.');
  return {content:parts.join('\n'),evidence};
 }
 const server=createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'");
  try{
   const port=req.socket.localPort,host=req.headers.host;
   if(!['127.0.0.1:'+port,'localhost:'+port].includes(host))throw codeError(403,'Host no permitido');
   const origin='http://'+host;
   if(req.headers.origin&&req.headers.origin!==origin)throw codeError(403,'Origen no permitido');
   if(req.headers['sec-fetch-site']==='cross-site')throw codeError(403,'Petición externa bloqueada');
   const url=new URL(req.url,origin),path=url.pathname;
   if(req.method==='GET'&&path==='/health')return send(200,{ok:true,mode:'local-synthetic-demo',realEmail:false,linkedinConfigured:false});
   if(req.method==='GET'&&assets.has(path)){const [file,type]=assets.get(path);res.writeHead(200,{'Content-Type':type});return res.end(readFileSync(resolve(ROOT,file)));}
   if(req.method==='GET'&&path.startsWith('/docs/')){const name=path.slice(6);if(!documents.includes(name))throw codeError(404,'Documento no encontrado');res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});return res.end(readFileSync(resolve(ROOT,'docs',name+'.md')));}
   if(!path.startsWith('/api/'))throw codeError(404,'Ruta no encontrada');
   const sid=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith('demo_session='))?.slice(13);
   let session=sessions.get(sid);
   if(req.method==='GET'&&path==='/api/bootstrap'){
    if(!session){if(sessions.size>=200)throw codeError(503,'Límite de sesiones demo');const id=randomBytes(24).toString('hex');session={id,csrf:randomBytes(24).toString('hex')};sessions.set(id,session);res.setHeader('Set-Cookie','demo_session='+id+'; HttpOnly; SameSite=Strict; Path=/');}
    return send(200,{events:state.events,participants:state.participants,catalog:CATALOG,rules,csrf:session.csrf,mode:'demo',identity:{mode:'not-configured',linkedin:false,message:'LinkedIn real no configurado. No hay sesión auténtica de LinkedIn.'},drafts:[...drafts.values()].filter(d=>d.owner===session.id).map(publicDraft)});
   }
   if(!session)throw codeError(401,'Abre la demo primero');
   if(!['GET','POST','PATCH'].includes(req.method))throw codeError(405,'Método no permitido');
   if(req.method!=='GET'&&(!safeEqual(req.headers['x-csrf-token'],session.csrf)||req.headers.origin!==origin))throw codeError(403,'Autorización local/CSRF no válida');
   if(req.method==='GET'&&path==='/api/matches'){const id=url.searchParams.get('participantId');return send(200,rank(id));}
   if(req.method==='POST'&&path==='/api/participants'){
    const b=await body(req);onlyKeys(b,['eventId','name','role','company','sector','companyType','offers','needs','buyerTypes','interests','email']);
    if(!state.events.some(e=>e.id===b.eventId))throw codeError(400,'Evento no válido');if(state.participants.length>=250)throw codeError(400,'Límite de la demo');
    if(!Object.hasOwn(CATALOG.companyTypes,b.companyType)||!Object.hasOwn(CATALOG.sectors,b.sector))throw codeError(400,'Sector o tipo de empresa fuera de catálogo');
    const id='demo-user-'+randomUUID(),p={id,eventId:b.eventId,status:'active',synthetic:true,name:text(b.name),role:text(b.role),company:text(b.company),sector:b.sector,companyType:b.companyType,offers:choices(b.offers,CATALOG.tags),needs:choices(b.needs,CATALOG.tags),buyerTypes:choices(b.buyerTypes,CATALOG.companyTypes),interests:choices(b.interests,CATALOG.interests)};
    const email=b.email??id+'@example.test';if(typeof email!=='string'||email.length>150||!/^[a-z0-9._+-]+@example\.test$/i.test(email))throw codeError(400,'Solo correos ficticios @example.test');
    state.participants.push(p);state.contacts.set(id,{email});return send(201,{participant:p});
   }
   if(req.method==='POST'&&path==='/api/events'){
    const b=await body(req);onlyKeys(b,['name','city','date']);if(state.events.length>=20)throw codeError(400,'Límite de eventos demo');
    if(typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||Number.isNaN(Date.parse(b.date))||new Date(b.date).toISOString().slice(0,10)!==b.date)throw codeError(400,'Fecha no válida');
    const e={id:'demo-event-'+randomUUID(),name:text(b.name),city:text(b.city),date:b.date,time:'18:00',timezone:'Europe/Madrid'};state.events.push(e);return send(201,{event:e});
   }
   if(req.method==='POST'&&path==='/api/rules'){
    const b=await body(req);onlyKeys(b,['weights','minScore','minCoverage','offTopicCount','onTopicCount']);
    const next={...b,version:'0.1.0-demo.'+(ruleSerial+1)};try{validateRules(next);}catch{throw codeError(400,'Pesos no negativos deben sumar 100; umbrales entre 0 y 100');}
    for(const k of ['offTopicCount','onTopicCount'])if(!Number.isInteger(next[k])||next[k]<1||next[k]>5)throw codeError(400,'Entre 1 y 5 temas por tipo');
    ruleSerial++;rules=next;for(const d of drafts.values()){d.review=null;d.delivery=null;}return send(200,{rules});
   }
   if(req.method==='POST'&&path==='/api/drafts'){
    const b=await body(req);onlyKeys(b,['participantId']);if(drafts.size>=200)throw codeError(400,'Límite de borradores demo');
    const p=participant(b.participantId);if(!p)throw codeError(404,'Participante no encontrado');const result=rank(p.id),g=generate(p,result),filtered=censor(g.content);
    const d={id:randomUUID(),owner:session.id,participantId:p.id,eventId:p.eventId,revision:1,rulesVersion:rules.version,matches:result.matches,content:filtered.text,baseline:filtered.text,evidence:g.evidence,expectedOff:rules.offTopicCount,expectedOn:rules.onTopicCount,sensitiveBlocked:filtered.blocked,review:null,delivery:null};drafts.set(d.id,d);return send(201,{draft:publicDraft(d)});
   }
   const route=path.match(/^\/api\/drafts\/([a-f0-9-]+)(?:\/(review|send))?$/);
   if(route){
    const d=drafts.get(route[1]);if(!d||d.owner!==session.id)throw codeError(404,'Borrador no encontrado');
    if(req.method==='GET'&&!route[2])return send(200,{draft:publicDraft(d)});
    if(req.method==='PATCH'&&!route[2]){const b=await body(req);onlyKeys(b,['content']);if(typeof b.content!=='string'||b.content.length>20000)throw codeError(400,'Borrador demasiado largo');const c=censor(b.content);d.content=c.text;d.sensitiveBlocked=c.blocked;d.revision++;d.review=null;d.delivery=null;return send(200,{draft:publicDraft(d)});}
    if(req.method==='POST'&&route[2]==='review'){
     const b=await body(req);onlyKeys(b,[]);const issues=[];
     if(d.rulesVersion!==rules.version)issues.push('Reglas modificadas: regenera el borrador.');
     if(d.matches.length!==3)issues.push('No hay tres matches válidos; no se rellenan artificialmente.');
     if(d.content!==d.baseline)issues.push('Texto editado: la demo determinista no puede verificar hechos nuevos. Regenera para recuperar evidencias verificables.');
     if(d.sensitiveBlocked||censor(d.content).blocked)issues.push('Identificador sensible bloqueado; regenera sin ese dato.');
     if(hasUnsafeInstruction(d.content))issues.push('Instrucción no confiable en el texto. No se ejecuta.');
     const matchesNow=new Set(rank(d.participantId).matches.map(m=>m.candidateId));
     if(d.matches.some(m=>!matchesNow.has(m.candidateId)))issues.push('La selección ha cambiado: regenera.');
     const blocks=d.content.split(/\[MATCH [^\]]+\]/).slice(1);
     if(blocks.length!==d.matches.length||blocks.some(t=>(t.match(/^\[OFF\]/gm)??[]).length!==d.expectedOff||(t.match(/^\[ON\]/gm)??[]).length!==d.expectedOn))issues.push('Cantidad de temas incorrecta.');
     d.review={status:issues.length?'incident':'ok',revision:d.revision,rulesVersion:rules.version,issues,reviewer:'Revisor determinista demo · no es un agente LLM',date:new Date().toISOString()};return send(200,{draft:publicDraft(d)});
    }
    if(req.method==='POST'&&route[2]==='send'){
     const b=await body(req);onlyKeys(b,['confirm']);if(b.confirm!==true)throw codeError(400,'Confirma el envío simulado');
     if(!d.review||d.review.status!=='ok'||d.review.revision!==d.revision||d.rulesVersion!==rules.version||d.review.rulesVersion!==rules.version)throw codeError(409,'Revisión OK vigente obligatoria; no se ha enviado nada');
     const p=participant(d.participantId),fresh=rank(d.participantId);if(p?.status!=='active'||d.matches.some(m=>!fresh.matches.some(n=>n.candidateId===m.candidateId))||!state.contacts.has(p.id)||censor(d.content).blocked)throw codeError(409,'Revalidación fallida');
     const key=d.eventId+':'+d.participantId+':'+d.rulesVersion+':'+createHash('sha256').update(d.content).digest('hex');
     if(deliveries.has(key)){d.delivery=deliveries.get(key);return send(200,{draft:publicDraft(d),delivery:d.delivery,duplicate:true});}
     const receipt={id:randomUUID(),key,mode:'SIMULATED_ONLY',recipient:'Contacto ficticio aislado (@example.test)',date:new Date().toISOString(),realEmail:false};deliveries.set(key,receipt);d.delivery=receipt;return send(200,{draft:publicDraft(d),delivery:receipt,duplicate:false});
    }
   }
   throw codeError(404,'Ruta no encontrada');
  }catch(error){send(error.status??500,{error:error.status?error.message:'Error interno de la demo'});}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
 return {server};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT??4317);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local port');
 const {server}=createApp();server.listen(port,'127.0.0.1',()=>console.log('Demo local: http://127.0.0.1:'+port+' · datos ficticios · sin envío real'));
 for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>server.close(()=>process.exit(0)));
}
