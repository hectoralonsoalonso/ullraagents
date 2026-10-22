import {createServer} from 'node:http';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import {DEFAULT_RULES,validateRules,rankCandidates} from './src/affinity.mjs';
import {CATALOG,DEFAULT_NEUTRAL_QUESTIONS,POST_KINDS,FACT_KINDS} from './src/catalog.mjs';
import {makeDemoData,matchingProfile} from './src/demo-data.mjs';
import {analyzePosts} from './src/extractor.mjs';
import {snipe} from './src/sniper.mjs';
import {composeEmail,subjectFor,parseEmail} from './src/composer.mjs';
import {emailHtml} from './src/email-html.mjs';
import {reviewDraft} from './src/reviewer.mjs';
import {censor,hasUnsafeInstruction} from './src/safety.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url));
const assets=new Map([['/',['web/index.html','text/html; charset=utf-8']],['/app.js',['web/app.js','text/javascript; charset=utf-8']],['/styles.css',['web/styles.css','text/css; charset=utf-8']],['/assets/ulltra-logo.png',['web/assets/ulltra-logo.png','image/png']],['/assets/ulltra-logo-original.png',['web/assets/ulltra-logo-original.png','image/png']]]);
const documents=['PROPUESTA','REQUISITOS','ARQUITECTURA','SEGURIDAD','BACKLOG','PRUEBAS','DECISIONES','FORMULA','DEMO'];
const codeError=(status,message,extra)=>Object.assign(new Error(message),{status,extra});
function safeEqual(a,b){const x=Buffer.from(a??''),y=Buffer.from(b??'');return x.length===y.length&&timingSafeEqual(x,y);}
function onlyKeys(obj,keys){if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).some(k=>!keys.includes(k)))throw codeError(400,'Campos no permitidos');}
function text(value,max=120){if(typeof value!=='string'||!value.trim()||value.length>max)throw codeError(400,'Texto ausente o demasiado largo');const clean=value.trim();if(censor(clean).blocked||hasUnsafeInstruction(clean))throw codeError(400,'Dato no permitido en esta demo');return clean;}
// Free-text answers are untrusted but legitimate input: keep them, never execute them; the sniper won't quote flagged text.
function freeText(value,max=300){if(value==null||value==='')return '';if(typeof value!=='string'||value.length>max)throw codeError(400,'Texto demasiado largo');if(censor(value).blocked)throw codeError(400,'Quita DNI/NIE/IBAN del texto');return value.trim();}
function choices(value,catalog,{max=12}={}){if(value==null)return [];if(!Array.isArray(value)||value.length>max||value.some(v=>typeof v!=='string'||!Object.hasOwn(catalog,v)))throw codeError(400,'Selección fuera del catálogo');return [...new Set(value)];}
async function body(req,limit=24000){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))throw codeError(415,'Usa JSON');let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>limit)throw codeError(413,'Entrada demasiado grande');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw codeError(400,'JSON inválido');}}
const dayBefore=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);};
const defaultRules=()=>({...structuredClone(DEFAULT_RULES),offTopicCount:3,onTopicCount:2,maxPostAgeDays:180,allowNeutralFallback:false,neutralQuestions:[...DEFAULT_NEUTRAL_QUESTIONS]});

export function createApp({persist=false,dataDir=resolve(ROOT,'runtime-data')}={}){
 const stateFile=join(dataDir,'state.json'),outboxDir=join(dataDir,'outbox');
 let state;
 function fresh(){const d=makeDemoData();return {...d,rules:defaultRules(),ruleSerial:0,drafts:new Map(),deliveries:new Map()};}
 function load(){
  if(!persist||!existsSync(stateFile))return fresh();
  try{const s=JSON.parse(readFileSync(stateFile,'utf8'));return {events:s.events,participants:s.participants,contacts:new Map(s.contacts),rules:{allowNeutralFallback:false,...s.rules},ruleSerial:s.ruleSerial,drafts:new Map(s.drafts.map(d=>[d.id,d])),deliveries:new Map(s.deliveries)};}
  catch{return fresh();}
 }
 function save(){
  if(!persist)return;
  mkdirSync(dataDir,{recursive:true});
  const s={events:state.events,participants:state.participants,contacts:[...state.contacts],rules:state.rules,ruleSerial:state.ruleSerial,drafts:[...state.drafts.values()],deliveries:[...state.deliveries]};
  writeFileSync(stateFile+'.tmp',JSON.stringify(s));renameSync(stateFile+'.tmp',stateFile);
 }
 state=load();
 const sessions=new Map(),outboxMemory=new Map();
 const participant=id=>state.participants.find(p=>p.id===id);
 const eventOf=id=>state.events.find(e=>e.id===id);
 const analyze=p=>analyzePosts(p,{maxPostAgeDays:state.rules.maxPostAgeDays});
 function rank(id){
  const p=participant(id);if(!p)throw codeError(404,'Participante no encontrado');
  const others=state.participants.filter(c=>c.eventId===p.eventId&&c.id!==p.id);
  return rankCandidates(matchingProfile(p,analyze(p).interests),others.map(c=>matchingProfile(c,analyze(c).interests)),state.rules);
 }
 const latestDraft=pid=>[...state.drafts.values()].filter(d=>d.participantId===pid).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
 const log=(d,action,detail='')=>d.history.push({date:new Date().toISOString(),action,detail});
 function runReview(d){
  const p=participant(d.participantId),evParticipants=state.participants;
  const analyses=new Map(evParticipants.filter(x=>x.eventId===d.eventId).map(x=>[x.id,analyze(x)]));
  const r=reviewDraft({draft:d,recipient:p,event:eventOf(d.eventId),participants:evParticipants,analyses,rules:state.rules,currentTop:p?.status==='active'?rank(p.id).matches:[],hasContact:state.contacts.has(d.participantId)});
  // Sensitive IDs are masked before storage, so the reviewer can't see them in the text: keep the block explicit.
  if(d.sensitiveBlocked){const c=r.checks.find(c=>c.id==='sensitive');c.ok=false;c.detail=['Se detectó un DNI/NIE/IBAN y se ha enmascarado. Regenera o quítalo.'];r.status='incident';r.resolvable=false;}
  return r;
 }
 function buildDraft(p){
  const event=eventOf(p.eventId),result=rank(p.id),anA=analyze(p);
  const avoidTopics=new Set();
  const items=result.matches.map(m=>{const q=participant(m.candidateId);return {candidateId:q.id,name:q.name,firstName:q.firstName,role:q.role,company:q.company,score:m.score,coverage:m.coverage,...snipe(p,q,anA,analyze(q),state.rules,{avoidTopics})};});
  const raw=composeEmail(p,event,items),filtered=censor(raw);
  const d={id:randomUUID(),participantId:p.id,eventId:p.eventId,recipientName:p.name,recipientCompany:p.company,revision:1,rulesVersion:state.rules.version,
   matches:result.matches.map(({candidateId,score,coverage,components})=>({candidateId,score,coverage,components})),items,subject:subjectFor(event,items.length),
   content:filtered.text,generatedContent:filtered.text,sensitiveBlocked:filtered.blocked,scheduledFor:dayBefore(event.date),createdAt:new Date().toISOString(),review:null,delivery:null,history:[]};
  log(d,'generated','Extractor → afinidad '+state.rules.version+' → sniper → redactor');
  d.review=runReview(d);log(d,'reviewed',d.review.status==='ok'?'OK':'Incidencia');
  state.drafts.set(d.id,d);return d;
 }
 // Any change to rules or participants re-reviews every unsent draft so stale OKs never survive.
 function rereview(eventId){for(const d of state.drafts.values())if(!d.delivery&&(!eventId||d.eventId===eventId)&&latestDraft(d.participantId)===d){const was=d.review?.status;d.review=runReview(d);if(was!==d.review.status)log(d,'re-reviewed',d.review.status);}}
 function statusOf(d){return d.delivery?'sent':d.review?.status??'pending';}
 function summary(d){return {id:d.id,participantId:d.participantId,recipientName:d.recipientName,recipientCompany:d.recipientCompany,status:statusOf(d),matches:d.items.map(i=>({candidateId:i.candidateId,name:i.name,company:i.company})),
  firstIssue:d.review?.checks.find(c=>!c.ok)?.detail[0]??null,warnings:d.review?.warnings.length??0,scheduledFor:d.scheduledFor,revision:d.revision};}
 function publicDraft(d){const {generatedContent,...rest}=d;return {...rest,status:statusOf(d),edited:d.content!==generatedContent};}
 function publicParticipant(p){const a=analyze(p);const {posts,...rest}=p;return {...rest,interests:a.interests??[],posts:a.posts.map(({id,kind,date,topics,flags,usable,narrative,title,snippet})=>({id,kind,date,topics,flags,usable,narrative,title,snippet}))};}
 // Preview = parsed approved text + photos of the people named in it. Nothing is regenerated.
 function preview(d){
  const parsed=parseEmail(d.content),photoOf=id=>participant(id)?.photo??null;
  return {subject:d.subject,preamble:parsed.preamble,closing:parsed.closing,revision:d.revision,
   blocks:parsed.blocks.map((b,i)=>{const it=d.items[i];const same=it&&it.name===b.name;return {...b,candidateId:same?it.candidateId:null,photo:same?photoOf(it.candidateId):null};})};
 }
 function sendDraft(d){
  const key=d.eventId+':'+d.participantId;
  if(state.deliveries.has(key))return {receipt:state.deliveries.get(key),duplicate:true};
  if(latestDraft(d.participantId)!==d)throw codeError(409,'Hay un borrador más reciente para esta persona');
  const fresh=runReview(d);
  const humanOk=d.review?.status==='ok-human'&&d.review.revision===d.revision&&fresh.resolvable;
  if(fresh.status!=='ok'&&!humanOk){d.review=fresh;log(d,'send-blocked',fresh.checks.filter(c=>!c.ok).map(c=>c.label).join('; '));save();throw codeError(409,'Bloqueado: la revisión ya no es OK. No se ha enviado nada.',{draft:publicDraft(d)});}
  const contact=state.contacts.get(d.participantId);
  const receipt={id:randomUUID(),key,mode:'SIMULATED_ONLY',realEmail:false,date:new Date().toISOString(),revision:d.revision,file:persist?'runtime-data/outbox/'+d.participantId+'.eml':null};
  const boundary='ulltra-'+randomBytes(8).toString('hex');
  const eml=['From: Equipo organizador <eventos@example.test>','To: '+contact.email,'Subject: '+d.subject,'Date: '+new Date().toUTCString(),'X-Demo: SIMULATED - no SMTP','MIME-Version: 1.0','Content-Type: multipart/alternative; boundary="'+boundary+'"','',
   '--'+boundary,'Content-Type: text/plain; charset=utf-8','',d.content,'','--'+boundary,'Content-Type: text/html; charset=utf-8','',emailHtml(preview(d)),'','--'+boundary+'--',''].join('\r\n');
  if(persist){mkdirSync(outboxDir,{recursive:true});writeFileSync(join(outboxDir,d.participantId+'.eml'),eml);}else outboxMemory.set(receipt.id,eml);
  state.deliveries.set(key,receipt);d.delivery=receipt;log(d,'sent','Envío simulado (sin SMTP)');
  return {receipt,duplicate:false};
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
   if(req.method==='GET'&&path==='/health')return send(200,{ok:true,mode:'local-synthetic-demo',realEmail:false,linkedinConfigured:false,persistent:persist});
   if(req.method==='GET'&&assets.has(path)){const [file,type]=assets.get(path);res.writeHead(200,{'Content-Type':type});return res.end(readFileSync(resolve(ROOT,file)));}
   if(req.method==='GET'&&path.startsWith('/docs/')){const name=path.slice(6);if(!documents.includes(name))throw codeError(404,'Documento no encontrado');res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});return res.end(readFileSync(resolve(ROOT,'docs',name+'.md')));}
   if(!path.startsWith('/api/'))throw codeError(404,'Ruta no encontrada');
   const sid=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith('demo_session='))?.slice(13);
   let session=sessions.get(sid);
   if(req.method==='GET'&&path==='/api/bootstrap'){
    if(!session){if(sessions.size>=200)throw codeError(503,'Límite de sesiones demo');const id=randomBytes(24).toString('hex');session={id,csrf:randomBytes(24).toString('hex')};sessions.set(id,session);res.setHeader('Set-Cookie','demo_session='+id+'; HttpOnly; SameSite=Strict; Path=/');}
    return send(200,{events:state.events,participants:state.participants.map(publicParticipant),catalog:CATALOG,rules:state.rules,csrf:session.csrf,mode:'demo',persistent:persist,
     identity:{mode:'not-configured',linkedin:false,message:'LinkedIn real no configurado. No hay sesión auténtica de LinkedIn.'}});
   }
   if(!session)throw codeError(401,'Abre la demo primero');
   if(!['GET','POST','PATCH'].includes(req.method))throw codeError(405,'Método no permitido');
   if(req.method!=='GET'&&(!safeEqual(req.headers['x-csrf-token'],session.csrf)||req.headers.origin!==origin))throw codeError(403,'Autorización local/CSRF no válida');
   let m;
   if(req.method==='GET'&&path==='/api/matches'){
    const p=participant(url.searchParams.get('participantId')),r=rank(p?.id),anA=analyze(p),avoidTopics=new Set();
    return send(200,{...r,matches:r.matches.map(m=>{const q=participant(m.candidateId);return {...m,name:q.name,photo:q.photo,...snipe(p,q,anA,analyze(q),state.rules,{avoidTopics})};})});
   }
   if(req.method==='POST'&&path==='/api/participants'){
    const b=await body(req,600000);onlyKeys(b,['eventId','firstName','lastName','role','company','linkedinUrl','sector','companyType','offerText','needText','offers','needs','buyerTypes','buyerSectors','posts','photo','email']);
    if(!eventOf(b.eventId))throw codeError(400,'Evento no válido');if(state.participants.length>=300)throw codeError(400,'Límite de la demo');
    if(!Object.hasOwn(CATALOG.companyTypes,b.companyType))throw codeError(400,'Tipo de empresa fuera de catálogo');
    // Outside the client's sector list → "Sin clasificar", never a new category.
    const sector=Object.hasOwn(CATALOG.sectors,b.sector)?b.sector:'unclassified';
    if(b.linkedinUrl&&(typeof b.linkedinUrl!=='string'||!/^https:\/\/(?:www\.)?linkedin\.(?:com|example)\/in\/[A-Za-z0-9_-]{3,100}\/?$/.test(b.linkedinUrl)))throw codeError(400,'URL de LinkedIn no válida');
    // Posts/facts are untrusted content pasted by the participant: validated for shape, flagged (never rejected) for injection.
    if(b.posts!=null&&(!Array.isArray(b.posts)||b.posts.length>8))throw codeError(400,'Hasta 8 publicaciones o hechos');
    const today=new Date().toISOString().slice(0,10);
    const posts=(b.posts??[]).map(x=>typeof x==='string'?{kind:'post',text:x,date:today}:x).map(x=>{
     if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!['kind','title','date','text'].includes(k)))throw codeError(400,'Publicación con campos no permitidos');
     if(!Object.hasOwn(POST_KINDS,x.kind??'post'))throw codeError(400,'Tipo de publicación no válido');
     const date=x.date??today;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||date>today)throw codeError(400,'Fecha de publicación no válida');
     const text=typeof x.text==='string'?x.text.trim():'',title=typeof x.title==='string'?x.title.trim():'';
     if(text.length>500||title.length>90||(!text&&!title))throw codeError(400,'Publicación vacía o demasiado larga');
     if(Object.hasOwn(FACT_KINDS,x.kind)&&!title)throw codeError(400,'Los hechos necesitan un título breve (p. ej. «el congreso de IA de Lisboa»)');
     return {kind:x.kind??'post',date,text:text||title,...(title?{title}:{})};});
    // Photo: only an image the participant provides, as a small data URL. Never fetched from LinkedIn.
    if(b.photo!=null&&(typeof b.photo!=='string'||b.photo.length>400000||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(b.photo)))throw codeError(400,'Foto no válida (PNG/JPEG/WebP, máx. ~300 KB)');
    const email=b.email;if(typeof email!=='string'||email.length>150||!/^[a-z0-9._+-]+@example\.test$/i.test(email))throw codeError(400,'Solo correos ficticios @example.test');
    const id='demo-user-'+randomUUID().slice(0,8),firstName=text(b.firstName),lastName=text(b.lastName);
    const p={id,eventId:b.eventId,status:'active',synthetic:true,firstName,lastName,name:firstName+' '+lastName,role:text(b.role),company:text(b.company),linkedinUrl:b.linkedinUrl||null,sector,companyType:b.companyType,
     offerText:freeText(b.offerText),needText:freeText(b.needText),offers:choices(b.offers,CATALOG.tags),needs:choices(b.needs,CATALOG.tags),buyerTypes:choices(b.buyerTypes,CATALOG.companyTypes),
     buyerSectors:choices(b.buyerSectors,CATALOG.sectors,{max:20}),posts:posts.map((x,i)=>({id:id+'-post-'+(i+1),...x})),photo:b.photo??null,photoSource:b.photo?'Aportada por el participante':null};
    if(!p.buyerSectors.length)delete p.buyerSectors;
    state.participants.push(p);state.contacts.set(id,{email});rereview(p.eventId);save();return send(201,{participant:publicParticipant(p)});
   }
   if(req.method==='POST'&&(m=path.match(/^\/api\/participants\/([a-z0-9-]+)\/withdraw$/))){
    const b=await body(req);onlyKeys(b,[]);const p=participant(m[1]);if(!p)throw codeError(404,'Participante no encontrado');
    p.status='withdrawn';rereview(p.eventId);save();return send(200,{participant:publicParticipant(p)});
   }
   if(req.method==='POST'&&path==='/api/events'){
    const b=await body(req);onlyKeys(b,['name','city','date','time']);if(state.events.length>=20)throw codeError(400,'Límite de eventos demo');
    if(typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||Number.isNaN(Date.parse(b.date))||new Date(b.date).toISOString().slice(0,10)!==b.date)throw codeError(400,'Fecha no válida');
    const time=b.time??'18:00';if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))throw codeError(400,'Hora no válida');
    const e={id:'demo-event-'+randomUUID().slice(0,8),name:text(b.name),city:text(b.city),date:b.date,time,timezone:'Europe/Madrid'};state.events.push(e);save();return send(201,{event:e});
   }
   if(req.method==='POST'&&path==='/api/rules'){
    const b=await body(req);onlyKeys(b,['weights','minScore','minCoverage','offTopicCount','onTopicCount','maxPostAgeDays','allowNeutralFallback','neutralQuestions']);
    const next={...state.rules,...b,version:'0.2.0-demo.'+(state.ruleSerial+1)};try{validateRules(next);}catch{throw codeError(400,'Pesos no negativos deben sumar 100; umbrales entre 0 y 100');}
    for(const k of ['offTopicCount','onTopicCount'])if(!Number.isInteger(next[k])||next[k]<1||next[k]>5)throw codeError(400,'Entre 1 y 5 temas por tipo');
    if(!Number.isInteger(next.maxPostAgeDays)||next.maxPostAgeDays<7||next.maxPostAgeDays>730)throw codeError(400,'Antigüedad máxima entre 7 y 730 días');
    if(typeof next.allowNeutralFallback!=='boolean')throw codeError(400,'allowNeutralFallback debe ser verdadero o falso');
    if(!Array.isArray(next.neutralQuestions)||next.neutralQuestions.length<3||next.neutralQuestions.length>15)throw codeError(400,'Entre 3 y 15 preguntas neutrales');
    next.neutralQuestions=next.neutralQuestions.map(q=>text(q,160));
    state.ruleSerial++;state.rules=next;rereview();save();return send(200,{rules:state.rules});
   }
   if(req.method==='GET'&&(m=path.match(/^\/api\/events\/([a-z0-9-]+)\/inbox$/))){
    if(!eventOf(m[1]))throw codeError(404,'Evento no encontrado');
    const people=state.participants.filter(p=>p.eventId===m[1]);
    return send(200,{event:eventOf(m[1]),scheduledFor:dayBefore(eventOf(m[1]).date),items:people.map(p=>{const d=latestDraft(p.id);return {participantId:p.id,name:p.name,company:p.company,participantStatus:p.status,draft:d?summary(d):null};})});
   }
   if(req.method==='POST'&&(m=path.match(/^\/api\/events\/([a-z0-9-]+)\/prepare$/))){
    const b=await body(req);onlyKeys(b,[]);if(!eventOf(m[1]))throw codeError(404,'Evento no encontrado');
    let prepared=0,skipped=0;
    for(const p of state.participants.filter(p=>p.eventId===m[1]&&p.status==='active')){if(state.deliveries.has(p.eventId+':'+p.id)){skipped++;continue;}buildDraft(p);prepared++;}
    save();return send(200,{prepared,skippedAlreadySent:skipped});
   }
   if(req.method==='POST'&&(m=path.match(/^\/api\/events\/([a-z0-9-]+)\/send-approved$/))){
    const b=await body(req);onlyKeys(b,['confirm']);if(b.confirm!==true)throw codeError(400,'Confirma el envío');
    const results={sent:0,duplicates:0,blocked:[]};
    for(const p of state.participants.filter(p=>p.eventId===m[1])){const d=latestDraft(p.id);if(!d||d.delivery||!['ok','ok-human'].includes(d.review?.status))continue;
     try{const r=sendDraft(d);r.duplicate?results.duplicates++:results.sent++;}catch(e){results.blocked.push({name:p.name,reason:e.message});}}
    save();return send(200,results);
   }
   if(req.method==='POST'&&path==='/api/drafts'){
    const b=await body(req);onlyKeys(b,['participantId']);const p=participant(b.participantId);if(!p)throw codeError(404,'Participante no encontrado');
    if(p.status!=='active')throw codeError(409,'Participante dado de baja');
    if(state.deliveries.has(p.eventId+':'+p.id))throw codeError(409,'Ya se le envió el email de este evento');
    const d=buildDraft(p);save();return send(201,{draft:publicDraft(d)});
   }
   if(req.method==='POST'&&path==='/api/reset'){const b=await body(req);onlyKeys(b,['confirm']);if(b.confirm!==true)throw codeError(400,'Confirma el reinicio');state=fresh();outboxMemory.clear();save();return send(200,{ok:true});}
   const route=path.match(/^\/api\/drafts\/([a-f0-9-]+)(?:\/(review|resolve|send|eml|preview))?$/);
   if(route){
    const d=state.drafts.get(route[1]);if(!d)throw codeError(404,'Borrador no encontrado');
    if(req.method==='GET'&&!route[2])return send(200,{draft:publicDraft(d)});
    if(req.method==='GET'&&route[2]==='preview')return send(200,{preview:preview(d)});
    if(req.method==='GET'&&route[2]==='eml'){if(!d.delivery)throw codeError(404,'Sin envío');const eml=persist?readFileSync(join(outboxDir,d.participantId+'.eml'),'utf8'):outboxMemory.get(d.delivery.id);
     // The recipient address is resolved only by the sending service; the UI gets it masked.
     return send(200,{eml:eml.replace(/^To: .*$/m,'To: [contacto aislado @example.test]')});}
    if(d.delivery&&req.method!=='GET'&&route[2]!=='send')throw codeError(409,'Este email ya se envió; no se puede modificar');
    if(req.method==='PATCH'&&!route[2]){const b=await body(req);onlyKeys(b,['content']);if(typeof b.content!=='string'||!b.content.trim()||b.content.length>20000)throw codeError(400,'Borrador vacío o demasiado largo');
     const c=censor(b.content.replace(/\r\n/g,'\n'));d.content=c.text;d.sensitiveBlocked=c.blocked;d.revision++;log(d,'edited','Revisión '+d.revision);d.review=runReview(d);log(d,'reviewed',d.review.status);save();return send(200,{draft:publicDraft(d)});}
    if(req.method==='POST'&&route[2]==='review'){const b=await body(req);onlyKeys(b,[]);d.review=runReview(d);log(d,'reviewed',d.review.status);save();return send(200,{draft:publicDraft(d)});}
    if(req.method==='POST'&&route[2]==='resolve'){
     const b=await body(req);onlyKeys(b,['note']);const note=text(b.note,300);
     const fresh=runReview(d);
     if(fresh.status==='ok'){d.review=fresh;save();return send(200,{draft:publicDraft(d)});}
     if(!fresh.resolvable){d.review=fresh;save();throw codeError(409,'Esta incidencia no se puede aprobar a mano: regenera el borrador.',{draft:publicDraft(d)});}
     d.review={...fresh,status:'ok-human',resolution:{note,by:'Operador (demo)',date:new Date().toISOString()}};log(d,'resolved',note);save();return send(200,{draft:publicDraft(d)});
    }
    if(req.method==='POST'&&route[2]==='send'){
     const b=await body(req);onlyKeys(b,['confirm']);if(b.confirm!==true)throw codeError(400,'Confirma el envío');
     const r=sendDraft(d);save();return send(200,{draft:publicDraft(d),delivery:r.receipt,duplicate:r.duplicate});
    }
   }
   throw codeError(404,'Ruta no encontrada');
  }catch(error){send(error.status??500,{error:error.status?error.message:'Error interno de la demo',...(error.extra??{})});if(!error.status)console.error(error);}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
 return {server};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT??4317);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local port');
 const {server}=createApp({persist:process.env.PERSIST!=='0'});server.listen(port,'127.0.0.1',()=>console.log('Demo local: http://127.0.0.1:'+port+' · datos ficticios · sin envío real'));
 for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>server.close(()=>process.exit(0)));
}
