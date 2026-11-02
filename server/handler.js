import app from './app.js';
import {configured,matches,hasSession,issueSession,sessionCookie,allowAttempt,resetAttempts,loginPage} from './auth.js';
const html=(content,status=200)=>new Response(content,{status,headers:{'content-type':'text/html; charset=utf-8'}});
const json=(error,status)=>Response.json({error},{status});
export async function handle(request,env){
 const url=new URL(request.url),p=url.pathname;
 let response;
 if(!configured(env))response=html('<!doctype html><html lang="da"><meta charset="utf-8"><title>Spilfabrikken</title><h1>Værkstedet er ved at blive gjort klar</h1><p>Ejeren skal sætte adgangskode og sessionsnøgle på serveren.</p>',503);
 else if(p==='/api/login'){
  if(request.method!=='POST')response=json('Brug loginformularen.',405);
  else if(request.headers.get('origin')!==url.origin)response=json('Ugyldig oprindelse.',403);
  else if(!allowAttempt(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local'))response=html(loginPage('For mange forsøg. Vent 15 minutter, og prøv igen.'),429);
  else {let body=await request.text();if(body.length>2000)response=json('Formularen er for stor.',413);
   else {let code=new URLSearchParams(body).get('code')||'';
    if(!matches(code,env.ACCESS_CODE)){await new Promise(r=>setTimeout(r,300));response=html(loginPage('Adgangskoden er forkert. Prøv igen.'),401)}
    else {resetAttempts(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local');response=new Response(null,{status:303,headers:{location:'/', 'set-cookie':sessionCookie(issueSession(env),url.protocol==='https:')}})}
   }
  }
 }else if(p==='/api/logout'){
  if(request.method!=='POST')response=json('Brug Log ud knappen.',405);
  else if(request.headers.get('origin')!==url.origin)response=json('Ugyldig oprindelse.',403);
  else response=new Response(null,{status:303,headers:{location:'/', 'set-cookie':sessionCookie('',url.protocol==='https:')}});
 }else if(!hasSession(request,env))response=p.startsWith('/api/')?json('Log ind for at fortsætte.',401):html(loginPage());
 else if(!['GET','HEAD'].includes(request.method)&&request.headers.get('origin')!==url.origin)response=json('Ugyldig oprindelse.',403);
 else response=await app.fetch(request,env);
 response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','same-origin');response.headers.set('X-Frame-Options','DENY');return response;
}
