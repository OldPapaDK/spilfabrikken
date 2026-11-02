import {handle} from '../server/handler.js';
export default async function handler(req,res){
 try{
  const original=new URL(req.url,'https://'+req.headers.host);
  const route=original.searchParams.get('route')||'';
  const path='/'+route.replace(/^\/+/, '');
  original.searchParams.delete('route');
  const headers=new Headers();for(let[k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v);
  let body;
  if(!['GET','HEAD'].includes(req.method)){
   if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
   else{let chunks=[],size=0;for await(let c of req){size+=c.length;if(size>110000){res.statusCode=413;res.end('For stor forespørgsel');return}chunks.push(c)}body=Buffer.concat(chunks)}
   // Vercel may parse URL-encoded form bodies before this function.
   if(headers.get('content-type')?.includes('application/x-www-form-urlencoded')&&req.body&&typeof req.body==='object')body=new URLSearchParams(req.body).toString();
  }
  let response=await handle(new Request('https://'+req.headers.host+path+original.search,{method:req.method,headers,body}),process.env);
  res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
 }catch{res.statusCode=500;res.setHeader('Cache-Control','no-store');res.end('Fabrikken kunne ikke behandle forespørgslen. Prøv igen.');}
}
