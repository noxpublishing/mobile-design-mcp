import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthClientInformationMixed, OAuthClientMetadata, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

export const MOBBIN_MCP_URL = 'https://api.mobbin.com/mcp';
type AuthState = { client?: OAuthClientInformationMixed; tokens?: OAuthTokens; redirectUrl?: string };
export const dataRoot = () => process.env.MOBILE_DESIGN_DATA_DIR ?? join(homedir(), '.local', 'share', 'mobile-design-mcp');

export class MobbinOAuthProvider implements OAuthClientProvider {
  readonly expectedState = randomBytes(24).toString('hex');
  private verifier?: string;
  readonly path: string;
  constructor(readonly root = dataRoot(), private redirect?: string, private authorize?: (url: URL) => void) {
    this.path = join(root,'auth','mobbin.json');
  }
  private read(): AuthState {
    if (!existsSync(this.path)) return {};
    return JSON.parse(readFileSync(this.path,'utf8'));
  }
  private save(patch: Partial<AuthState>) {
    const state = {...this.read(),...patch,redirectUrl:this.redirectUrl};
    mkdirSync(dirname(this.path),{recursive:true,mode:0o700});
    const temporary = this.path + '.' + randomBytes(6).toString('hex') + '.tmp';
    writeFileSync(temporary,JSON.stringify(state),{mode:0o600});
    renameSync(temporary,this.path); chmodSync(this.path,0o600);
  }
  get redirectUrl(): string { return this.redirect ?? this.read().redirectUrl ?? 'http://127.0.0.1:34219/callback'; }
  get clientMetadata(): OAuthClientMetadata {
    return {client_name:'Mobile Design MCP',redirect_uris:[this.redirectUrl],grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none',scope:'openid'};
  }
  state() { return this.expectedState; }
  clientInformation() { return this.read().client; }
  saveClientInformation(client: OAuthClientInformationMixed) { this.save({client}); }
  tokens() { return this.read().tokens; }
  saveTokens(tokens: OAuthTokens) { this.save({tokens}); }
  saveCodeVerifier(verifier: string) { this.verifier = verifier; }
  codeVerifier() { if (!this.verifier) throw new Error('No active Mobbin login; run npm run mobbin:login.'); return this.verifier; }
  redirectToAuthorization(url: URL) {
    if (!this.authorize) throw new Error('Mobbin sign-in required. Run npm run mobbin:login from the project directory.');
    this.authorize(url);
  }
  invalidateCredentials(scope: 'all'|'client'|'tokens'|'verifier'|'discovery') {
    if (scope === 'all' || scope === 'verifier') this.verifier = undefined;
    if (scope === 'all') this.save({client:undefined,tokens:undefined});
    else if (scope === 'client') this.save({client:undefined});
    else if (scope === 'tokens') this.save({tokens:undefined});
  }
}

export function getMobbinStatus(root=dataRoot()) {
  let saved = false;
  try { saved = !!new MobbinOAuthProvider(root).tokens()?.access_token; } catch { /* report unavailable, never expose file content */ }
  return {provider:'mobbin',mcpEndpoint:MOBBIN_MCP_URL,mcpConfigured:!!process.env.MOBBIN_MCP_ACCESS_TOKEN || saved,
    restConfigured:!!process.env.MOBBIN_API_KEY,restSupportedPlatforms:['ios','web'],androidRestSupported:false,
    loginCommand:'npm run mobbin:login',contentPolicy:'Live per-request provider results; not stored in the local reference corpus.',
    docs:'https://docs.mobbin.com/mcp/build-an-integration',
    note:'Credentials configured does not prove current account entitlement. MCP and REST have different access requirements.'};
}

async function withClient<T>(fn:(client:Client)=>Promise<T>,root=dataRoot()):Promise<T> {
  const token = process.env.MOBBIN_MCP_ACCESS_TOKEN;
  const provider = new MobbinOAuthProvider(root);
  if (!token && !provider.tokens()?.access_token) throw new Error('Mobbin MCP needs your account sign-in: npm run mobbin:login. Local tools work without Mobbin.');
  const transport = new StreamableHTTPClientTransport(new URL(MOBBIN_MCP_URL), token
    ? {requestInit:{headers:{Authorization:`Bearer ${token}`}}} : {authProvider:provider});
  const client = new Client({name:'mobile-design-mcp',version:'0.1.0'});
  try { await client.connect(transport,{timeout:15000}); return await fn(client); }
  finally { await client.close(); }
}
export async function listMobbinTools(root=dataRoot()) {
  return withClient(async client => ({provider:'mobbin',...(await client.listTools({}, {timeout:15000})),persistentStorage:false}),root);
}
export async function callMobbinTool(input:{name:string;arguments?:Record<string,unknown>},root=dataRoot()) {
  return withClient(async client => {
    let cursor: string | undefined;
    let allowed = false;
    for (let page=0;page<5;page++) {
      const list = await client.listTools(cursor ? {cursor} : {},{timeout:15000});
      const tool = list.tools.find(t=>t.name===input.name);
      if (tool) {
        if (tool.annotations?.readOnlyHint !== true) throw new Error('This bridge calls only upstream tools explicitly annotated read-only.');
        allowed = true; break;
      }
      cursor=list.nextCursor; if(!cursor)break;
    }
    if(!allowed)throw new Error('Unknown Mobbin tool. Discover the upstream tool names first with mobbin_list_tools.');
    return CallToolResultSchema.parse(await client.callTool({name:input.name,arguments:input.arguments ?? {}},undefined,{timeout:60000}));
  },root);
}

export async function searchMobbinScreens(input:{query:string;platform:'ios'|'android';limit?:number}, fetchFn:typeof fetch = fetch) {
  if(input.platform !== 'ios')throw new Error('Mobbin REST currently supports ios and web, not android. Use Android award references and your own Android recordings.');
  if(!input.query.trim()||input.query.length>500)throw new Error('Query must contain 1–500 characters.');
  const key=process.env.MOBBIN_API_KEY;
  if(!key)throw new Error('Mobbin REST requires MOBBIN_API_KEY and a suitable Team/Enterprise account. MCP OAuth is a separate connection.');
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),20000);
  try {
    const response=await fetchFn('https://api.mobbin.com/v1/screens/search',{method:'POST',redirect:'error',signal:controller.signal,
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({query:input.query,platform:'ios',mode:'standard',limit:Math.min(20,Math.max(1,input.limit??6)),image_quality:'optimized'})});
    if(!response.ok)throw new Error(`Mobbin REST returned HTTP ${response.status}; check account access or rate limit. No fallback scraping was attempted.`);
    if(!response.body)throw new Error('Mobbin returned an empty body.');
    const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
    try {
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){controller.abort();await reader.cancel().catch(()=>{});throw new Error('Mobbin response exceeds 2 MiB.');}chunks.push(value);}
    }finally{reader.releaseLock();}
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!Array.isArray(data.screens))throw new Error('Mobbin response does not contain screens.');
    return {provider:'mobbin',platform:'ios',screens:data.screens,persistentStorage:false,
      note:'Live provider references. Image URLs can expire. No award or motion measurement is implied.'};
  } finally {clearTimeout(timer);}
}
