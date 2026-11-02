import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
export const COOKIE='sf_session';
const TTL=12*60*60;
export const configured=env=>typeof env.ACCESS_CODE==='string'&&env.ACCESS_CODE.length>=10&&typeof env.SESSION_SECRET==='string'&&env.SESSION_SECRET.length>=32;
const hash=s=>createHash('sha256').update(String(s)).digest();
export function matches(a,b){return timingSafeEqual(hash(a),hash(b))}
function signature(payload,env){return createHmac('sha256',env.SESSION_SECRET).update(env.ACCESS_CODE+'\0'+payload).digest('base64url')}
export function issueSession(env,now=Date.now()){
 const payload=Buffer.from(JSON.stringify({exp:Math.floor(now/1000)+TTL,nonce:randomBytes(16).toString('hex')})).toString('base64url');
 return payload+'.'+signature(payload,env);
}
export function hasSession(request,env,now=Date.now()){
 if(!configured(env))return false;
 try{let value=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!value||value.length>1000)return false;let [p,s,...rest]=value.split('.');if(rest.length||!p||!s||!matches(s,signature(p,env)))return false;
 const data=JSON.parse(Buffer.from(p,'base64url').toString());return Number.isSafeInteger(data.exp)&&data.exp>Math.floor(now/1000)&&data.exp<=Math.floor(now/1000)+TTL;
 }catch{return false}
}
export function sessionCookie(value,secure=true){return COOKIE+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+(value?TTL:0)+(secure?'; Secure':'')}
const attempts=new Map();
export function allowAttempt(ip,now=Date.now()){
 for(const [k,v]of attempts)if(v.until<=now)attempts.delete(k);
 let a=attempts.get(ip);if(!a){if(attempts.size>=10000)return false;a={count:0,until:now+15*60*1000};attempts.set(ip,a)}
 a.count++;return a.count<=8;
}
export const resetAttempts=ip=>attempts.delete(ip);
export function loginPage(message=''){
return `<!doctype html><html lang="da"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spilfabrikken · Adgang</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f3efff;color:#241a4a;font-family:system-ui,sans-serif;padding:24px}main{width:100%;max-width:440px;padding:40px;background:#fff;border:1px solid #e4dcf4;border-radius:25px;box-shadow:0 12px 40px #41257612}.icon{font-size:44px}h1{font-size:30px;margin-bottom:10px}p{color:#72658d;line-height:1.6}label{display:block;font-weight:600;margin-top:28px}input{width:100%;padding:15px;margin:10px 0 18px;border:2px solid #dfd5f5;border-radius:12px;font-size:18px}input:focus{outline:3px solid #cab9fc}button{width:100%;padding:15px;border:0;border-radius:12px;background:#6c4ce0;color:#fff;font-size:18px;cursor:pointer}.error{color:#a82f50;font-size:14px}small{display:block;color:#847891;line-height:1.5;margin-top:24px}</style><main><div class="icon">🏭</div><h1>Velkommen til Spilfabrikken</h1><p>Her bliver dine idéer til faglige spil.<br>Indtast adgangskoden for at åbne værkstedet.</p><form method="post" action="/api/login"><label for="code">Adgangskode</label><input id="code" name="code" type="password" autocomplete="current-password" required maxlength="200" autofocus><button>Åbn værkstedet →</button><p class="error" role="alert">${message}</p></form><small>Adgangen gælder i 12 timer i denne browser.<br>Du kan altid logge ud igen.</small></main></html>`;
}
