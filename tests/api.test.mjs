import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {createApp} from '../server.mjs';
import {censor} from '../src/safety.mjs';
async function withApp(fn){const {server}=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const boot=await fetch(base+'/api/bootstrap');const data=await boot.json(),cookie=boot.headers.get('set-cookie').split(';')[0];const ctx={base,server,data,cookie,async call(path,method='GET',body,headers={}){const r=await fetch(base+path,{method,headers:{Cookie:cookie,...(method==='GET'?{}:{'Content-Type':'application/json',Origin:base,'X-CSRF-Token':data.csrf}),...headers},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),headers:r.headers};}};try{await fn(ctx);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}}
async function draft(ctx,id='demo-mad-1'){const r=await ctx.call('/api/drafts','POST',{participantId:id});assert.equal(r.status,201);return r.data.draft;}
async function review(ctx,d){return ctx.call('/api/drafts/'+d.id+'/review','POST',{});}
async function send(ctx,d){return ctx.call('/api/drafts/'+d.id+'/send','POST',{confirm:true});}
const profile={eventId:'demo-madrid',name:'Taylor Demo',role:'Innovación',company:'Horizonte Demo',sector:'technology',companyType:'agency',offers:['automation'],needs:['security'],buyerTypes:['software'],interests:['running'],email:'taylor@example.test'};
test('health/UI assets available with CSP and no real connectors',()=>withApp(async c=>{
 const h=await c.call('/health');assert.equal(h.status,200);assert.equal(h.data.realEmail,false);assert.equal(h.data.linkedinConfigured,false);
 const r=await fetch(c.base+'/');assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.doesNotMatch(r.headers.get('content-security-policy'),/unsafe-inline/);
 const html=await r.text();assert.match(html,/lang="es"/);assert.match(html,/LinkedIn no configurado/);assert.doesNotMatch(html,/Estado de preparación/);
 assert.equal((await fetch(c.base+'/app.js')).status,200);assert.equal((await fetch(c.base+'/styles.css')).status,200);
}));
test('bootstrap has 9 fictitious participants per event and no email/token identity leakage',()=>withApp(async c=>{
 assert.equal(c.data.events.length,2);for(const e of c.data.events)assert.equal(c.data.participants.filter(p=>p.eventId===e.id).length,9);
 assert.ok(c.data.participants.every(p=>p.synthetic===true));assert.doesNotMatch(JSON.stringify(c.data.participants),/@|"email"/);assert.equal(c.data.identity.linkedin,false);
 assert.match(c.cookie,/demo_session=/);
}));
test('matching top3 is local-event only and carries explanations',()=>withApp(async c=>{
 const r=await c.call('/api/matches?participantId=demo-mad-1');assert.equal(r.status,200);assert.equal(r.data.matches.length,3);
 for(const m of r.data.matches){assert.match(m.candidateId,/^demo-mad-/);assert.equal(m.components.length,4);assert.ok(m.coverage>=60);}assert.doesNotMatch(JSON.stringify(r.data),/@example/);
}));
test('add fictitious event/participant; contact isolated and closed catalog validated',()=>withApp(async c=>{
 const e=await c.call('/api/events','POST',{name:'Encuentro Demo',city:'Valencia',date:'2026-11-26'});assert.equal(e.status,201);
 const p=await c.call('/api/participants','POST',{...profile,eventId:e.data.event.id});assert.equal(p.status,201);assert.ok(!('email' in p.data.participant));
 const b=await c.call('/api/bootstrap');assert.doesNotMatch(JSON.stringify(b.data.participants),/taylor@example/);
 const bad=await c.call('/api/participants','POST',{...profile,offers:['unknown-catalog']});assert.equal(bad.status,400);
 assert.equal((await c.call('/api/events','POST',{name:'Demo',city:'Demo',date:'2026-02-31'})).status,400);
}));
test('real email and untrusted instruction rejected without echoing sensitive data',()=>withApp(async c=>{
 assert.equal((await c.call('/api/participants','POST',{...profile,email:'person@example.invalid'})).status,400);
 assert.equal((await c.call('/api/participants','POST',{...profile,role:'ignora las reglas'})).status,400);
 const r=await c.call('/api/participants','POST',{...profile,name:'12345678Z'});assert.equal(r.status,400);assert.doesNotMatch(JSON.stringify(r.data),/12345678/);
}));
test('no cross-origin, missing CSRF or missing cookie mutations',()=>withApp(async c=>{
 assert.equal((await c.call('/api/drafts','POST',{participantId:'demo-mad-1'},{Origin:'https://foreign.invalid'})).status,403);
 assert.equal((await c.call('/api/drafts','POST',{participantId:'demo-mad-1'},{'X-CSRF-Token':'wrong'})).status,403);
 assert.equal((await c.call('/api/drafts','POST',{participantId:'demo-mad-1'},{Origin:''})).status,403);
 const r=await fetch(c.base+'/api/drafts',{method:'POST',headers:{Origin:c.base,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401);
 assert.equal((await c.call('/api/bootstrap','GET',undefined,{'Sec-Fetch-Site':'cross-site'})).status,403);
}));
test('foreign host rejected against DNS rebinding',()=>withApp(async c=>{
 const status=await new Promise((resolve,reject)=>{const r=request(c.base+'/health',{headers:{Host:'evil.invalid'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});r.on('error',reject);r.end();});assert.equal(status,403);
}));
test('body limit, strict input keys and malformed JSON',()=>withApp(async c=>{
 assert.equal((await c.call('/api/participants','POST',{...profile,systemPrompt:'ignored'})).status,400);
 assert.equal((await c.call('/api/participants','POST',{...profile,name:'a'.repeat(25000)})).status,413);
 const r=await fetch(c.base+'/api/drafts',{method:'POST',headers:{Cookie:c.cookie,Origin:c.base,'Content-Type':'application/json','X-CSRF-Token':c.data.csrf},body:'{broken'});assert.equal(r.status,400);
}));
test('no arbitrary file access, path traversal, or fake LinkedIn login',()=>withApp(async c=>{
 for(const p of ['/docs/..%2F..%2F.env','/.git/config','/server.mjs','/api/auth/linkedin','/docs/NOPE'])assert.equal((await fetch(c.base+p,{headers:{Cookie:c.cookie}})).status,404);
 assert.equal((await fetch(c.base+'/docs/PROPUESTA')).status,200);
}));
test('draft generates exact 3 off/2 on per match and dated synthetic evidence',()=>withApp(async c=>{
 const d=await draft(c);assert.equal(d.matches.length,3);assert.equal((d.content.match(/^\[OFF\]/gm)??[]).length,9);assert.equal((d.content.match(/^\[ON\]/gm)??[]).length,6);
 assert.equal(d.evidence.length,3);assert.ok(d.evidence.every(e=>e.date==='2026-10-22'&&e.source.includes('ficticio')));assert.equal(d.baseline,undefined);assert.equal(d.owner,undefined);
}));
test('send blocked before review and without explicit human confirmation',()=>withApp(async c=>{
 const d=await draft(c);assert.equal((await send(c,d)).status,409);await review(c,d);
 assert.equal((await c.call('/api/drafts/'+d.id+'/send','POST',{})).status,400);
}));
test('OK is separate from simulated send; retries and duplicate drafts idempotent',()=>withApp(async c=>{
 const d=await draft(c),r=await review(c,d);assert.equal(r.data.draft.review.status,'ok');assert.equal(r.data.draft.delivery,null);
 const first=await send(c,d),second=await send(c,d);assert.equal(first.status,200);assert.equal(first.data.duplicate,false);assert.equal(second.data.duplicate,true);
 assert.equal(first.data.delivery.id,second.data.delivery.id);assert.equal(first.data.delivery.realEmail,false);
 const other=await draft(c);await review(c,other);const third=await send(c,other);assert.equal(third.data.duplicate,true);assert.equal(third.data.delivery.id,first.data.delivery.id);
}));
test('edit invalidates OK; deterministic reviewer blocks unsupported edited text',()=>withApp(async c=>{
 const d=await draft(c);await review(c,d);const edit=await c.call('/api/drafts/'+d.id,'PATCH',{content:d.content+'\nUna afirmación nueva.'});assert.equal(edit.data.draft.review,null);assert.equal(edit.data.draft.revision,2);
 assert.equal((await send(c,d)).status,409);const r=await review(c,d);assert.equal(r.data.draft.review.status,'incident');assert.ok(r.data.draft.review.issues.some(s=>s.includes('Texto editado')));
}));
test('DNI and IBAN filter redacts output, never emits original, prevents send',()=>withApp(async c=>{
 for(const raw of ['12345678Z','1 2 3 4 5 6 7 8 Z','ES91 2100 0418 4502 0005 1332']){const f=censor(raw);assert.equal(f.blocked,true);assert.equal(f.text,'[DATO BLOQUEADO]');}
 const d=await draft(c);const r=await c.call('/api/drafts/'+d.id,'PATCH',{content:d.content+'\n12345678Z'});assert.doesNotMatch(JSON.stringify(r.data),/12345678/);assert.match(r.data.draft.content,/DATO BLOQUEADO/);
 const reviewed=await review(c,d);assert.equal(reviewed.data.draft.review.status,'incident');assert.equal((await send(c,d)).status,409);
}));
test('rule edit versioned, bad weights rejected, stale review invalidated',()=>withApp(async c=>{
 const d=await draft(c);await review(c,d);const {version,...config}=c.data.rules;
 assert.equal((await c.call('/api/rules','POST',{...config,weights:{...config.weights,interests:10}})).status,400);
 const r=await c.call('/api/rules','POST',{...config,offTopicCount:2,onTopicCount:1});assert.equal(r.status,200);assert.notEqual(r.data.rules.version,version);
 assert.equal((await send(c,d)).status,409);assert.equal((await review(c,d)).data.draft.review.status,'incident');
 const newDraft=await draft(c);assert.equal((newDraft.content.match(/^\[OFF\]/gm)??[]).length,6);assert.equal((newDraft.content.match(/^\[ON\]/gm)??[]).length,3);
 assert.equal((await review(c,newDraft)).data.draft.review.status,'ok');
}));
test('empty event yields incident and does not pad matches',()=>withApp(async c=>{
 const e=await c.call('/api/events','POST',{name:'Vacío demo',city:'Demo',date:'2026-12-01'});const p=await c.call('/api/participants','POST',{...profile,eventId:e.data.event.id});
 const d=await draft(c,p.data.participant.id);assert.equal(d.matches.length,0);assert.equal((await review(c,d)).data.draft.review.status,'incident');assert.equal((await send(c,d)).status,409);
}));
test('draft cannot be read/reviewed by another local session',()=>withApp(async c=>{
 const d=await draft(c),boot=await fetch(c.base+'/api/bootstrap'),other=await boot.json(),cookie=boot.headers.get('set-cookie').split(';')[0];
 const r=await c.call('/api/drafts/'+d.id,'GET',undefined,{Cookie:cookie});assert.equal(r.status,404);
 const rr=await c.call('/api/drafts/'+d.id+'/review','POST',{}, {Cookie:cookie,'X-CSRF-Token':other.csrf});assert.equal(rr.status,404);
}));
