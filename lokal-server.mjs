import http from 'node:http';
import {existsSync} from 'node:fs';
import {handle} from './server/handler.js';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
http.createServer(async(req,res)=>{try{let chunks=[],size=0;for await(let c of req){size+=c.length;if(size>110000){res.writeHead(413);res.end();return}chunks.push(c)}let r=await handle(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})}),process.env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end('Fabrikken kunne ikke svare.')}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Spilfabrikken kører på http://localhost:'+(process.env.PORT||3000)));
