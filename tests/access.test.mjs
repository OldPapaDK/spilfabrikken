import test from 'node:test';import assert from 'node:assert/strict';
import {handle} from '../server/handler.js';import {issueSession,hasSession} from '../server/auth.js';
const env={ACCESS_CODE:'testkode-kun-til-test',SESSION_SECRET:'test-secret-with-at-least-32-characters'};
const request=(path,options={})=>new Request('https://example.test'+path,options);
const post=(path,body,extra={})=>request(path,{method:'POST',headers:{origin:'https://example.test','content-type':'application/x-www-form-urlencoded',...extra},body});
test('unconfigured server fails closed',async()=>assert.equal((await handle(request('/'),{})).status,503));
test('page and API require login',async()=>{let r=await handle(request('/'),env);assert.match(await r.text(),/Indtast adgangskoden/);for(let path of ['/api/status','/api/generate','/server/page.html']){let r=await handle(request(path),env);assert.equal(r.status,path.startsWith('/api/')?401:200);assert.doesNotMatch(await r.text(),/Dit fag\. Din fantasi/);}});
test('wrong code is rejected',async()=>assert.equal((await handle(post('/api/login','code=wrong'),env)).status,401));
test('valid code sets secure HttpOnly cookie and opens app',async()=>{let r=await handle(post('/api/login',new URLSearchParams({code:env.ACCESS_CODE}).toString()),env);assert.equal(r.status,303);let cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);r=await handle(request('/',{headers:{cookie}}),env);assert.match(await r.text(),/Dit fag\. Din fantasi/);assert.equal(r.headers.get('cache-control'),'private, no-store');});
test('cross-origin login and logout are rejected',async()=>{for(let path of ['/api/login','/api/logout'])assert.equal((await handle(post(path,'code=x',{origin:'https://evil.test'}),env)).status,403)});
test('tampered and expired tokens rejected; changing code revokes sessions',()=>{let token=issueSession(env);assert.equal(hasSession(request('/',{headers:{cookie:'sf_session='+token}}),env),true);assert.equal(hasSession(request('/',{headers:{cookie:'sf_session='+token+'x'}}),env),false);assert.equal(hasSession(request('/',{headers:{cookie:'sf_session='+issueSession(env,Date.now()-13*3600000)}}),env),false);assert.equal(hasSession(request('/',{headers:{cookie:'sf_session='+token}}),{...env,ACCESS_CODE:'a-different-code'}),false)});
test('API accessible only with session; logout clears cookie',async()=>{let cookie='sf_session='+issueSession(env);let r=await handle(request('/api/status',{headers:{cookie}}),env);assert.deepEqual(await r.json(),{available:false});r=await handle(post('/api/logout','',{cookie}),env);assert.equal(r.status,303);assert.match(r.headers.get('set-cookie'),/Max-Age=0/)});
test('direct source and unknown routes are not served after login',async()=>{let cookie='sf_session='+issueSession(env);for(let p of ['/server/page.html','/.env.local','/server/auth.js'])assert.equal((await handle(request(p,{headers:{cookie}}),env)).status,404)});
test('Vercel adapter handles rewrites and parsed login forms',async()=>{
 const {default:router}=await import('../api/router.js');
 const previous={ACCESS_CODE:process.env.ACCESS_CODE,SESSION_SECRET:process.env.SESSION_SECRET};Object.assign(process.env,env);
 const run=async req=>{let headers={},body;const res={statusCode:200,setHeader:(k,v)=>headers[k.toLowerCase()]=v,end:b=>body=b?.toString()};await router(req,res);return {status:res.statusCode,headers,body}};
 try{
 let r=await run({url:'/api/router?route=api/login',method:'POST',headers:{host:'example.test',origin:'https://example.test','content-type':'application/x-www-form-urlencoded'},body:{code:env.ACCESS_CODE}});assert.equal(r.status,303);let cookie=r.headers['set-cookie'];
 r=await run({url:'/api/router?route=api/status',method:'GET',headers:{host:'example.test',cookie}});assert.equal(r.status,200);assert.deepEqual(JSON.parse(r.body),{available:false});
 r=await run({url:'/api/router?route=api/status',method:'GET',headers:{host:'example.test'}});assert.equal(r.status,401);
 r=await run({url:'/api/router?route=',method:'GET',headers:{host:'example.test',cookie}});assert.match(r.body,/Dit fag\. Din fantasi/);
 }finally{for(let[k,v]of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v}
});
