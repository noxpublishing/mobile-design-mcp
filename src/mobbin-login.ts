#!/usr/bin/env node
import { createServer } from 'node:http';
import { auth } from '@modelcontextprotocol/sdk/client/auth.js';
import { MOBBIN_MCP_URL, MobbinOAuthProvider } from './mobbin.js';

const port=Number(process.env.MOBBIN_CALLBACK_PORT??34219);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('MOBBIN_CALLBACK_PORT must be a port from 1024 through 65535.');
const redirect=`http://127.0.0.1:${port}/callback`;
let provider:MobbinOAuthProvider;
let complete!:(code:string)=>void;
let failed!:(error:Error)=>void;
const code=new Promise<string>((resolve,reject)=>{complete=resolve;failed=reject;});
// Attach rejection handling before network setup, while retaining the promise for later await.
void code.catch(()=>{});
const server=createServer((request,response)=>{
  const url=new URL(request.url??'/',redirect);
  if(url.pathname!=='/callback'){response.writeHead(404).end();return;}
  if(url.searchParams.get('state')!==provider.expectedState){response.writeHead(400).end('Invalid sign-in state.');return;}
  if(url.searchParams.has('error')){response.writeHead(400).end('Mobbin sign-in was declined.');failed(new Error('Mobbin sign-in declined.'));return;}
  const value=url.searchParams.get('code');
  if(!value){response.writeHead(400).end('Missing authorization code.');return;}
  response.writeHead(200,{'Content-Type':'text/plain'}).end('Authorization received. Return to your terminal.');complete(value);
});
provider=new MobbinOAuthProvider(undefined,redirect,url=>console.error('Open this URL in your browser to sign in to Mobbin:\n'+url.href));
await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
const timer=setTimeout(()=>failed(new Error('Mobbin sign-in timed out after five minutes.')),300000);
try {
  const result=await auth(provider,{serverUrl:MOBBIN_MCP_URL,scope:'openid'});
  if(result==='REDIRECT')await auth(provider,{serverUrl:MOBBIN_MCP_URL,scope:'openid',authorizationCode:await code});
  console.error('Mobbin sign-in saved with private file permissions. Restart your Mobile Design MCP process to use it.');
} finally {clearTimeout(timer);await new Promise<void>(resolve=>server.close(()=>resolve()));}
