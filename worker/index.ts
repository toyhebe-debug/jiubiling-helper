import {z} from 'zod';
import {digest,equal,ITERATIONS,passwordHash,randomToken} from './security';
import {bodySchema} from './validation';
import {preservePreparation} from '../lib/preparation';
import {preserveHK} from '../lib/hk';
export interface Env{DB:D1Database;CORS_ORIGINS:string;BOOTSTRAP_HASH?:string}
type Row={body:string;version:number;updated_at:string;last_operation:string};
type Auth={password_hash:string;salt:string;iterations:number};
const passwordSchema=z.object({password:z.string().min(12).max(128)});
function snapshot(r:Row){return {data:JSON.parse(r.body),version:r.version,updatedAt:r.updated_at}}
async function read(db:D1Database){return db.prepare('SELECT body,version,updated_at,last_operation FROM family_state WHERE id = ?').bind('home').first<Row>()}
async function authenticated(request:Request,db:D1Database){const match=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/);if(!match)return false;const row=await db.prepare('SELECT expires_at FROM family_sessions WHERE token_hash = ? AND expires_at > ?').bind(await digest(match[1]),Date.now()).first();return !!row}
async function session(db:D1Database){const token=randomToken();const expiresAt=Date.now()+90*86400000;await db.batch([db.prepare('DELETE FROM family_sessions WHERE expires_at <= ?').bind(Date.now()),db.prepare('INSERT INTO family_sessions (token_hash,expires_at) VALUES (?,?)').bind(await digest(token),expiresAt)]);return {token,expiresAt}}
async function throttle(request:Request,db:D1Database){const now=Date.now();const window=Math.floor(now/900000);const ip=request.headers.get('CF-Connecting-IP')||'local';const bucket=await digest(ip+':'+window);await db.prepare('INSERT INTO auth_limits (bucket,hits,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1').bind(bucket,(window+1)*900000).run();const row=await db.prepare('SELECT hits FROM auth_limits WHERE bucket = ?').bind(bucket).first<{hits:number}>();return !!row&&row.hits<=8}
async function jsonBody(request:Request){if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'请求格式不正确。');const raw=await request.text();if(raw.length>200000)throw new HttpError(413,'内容太长了。');try{return JSON.parse(raw)}catch{throw new HttpError(400,'请检查输入内容。')}}
class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const path=new URL(request.url).pathname;const origin=request.headers.get('Origin');const origins=env.CORS_ORIGINS.split(',').map(s=>s.trim());const allowed=!origin||origins.includes(origin);
 const h:Record<string,string>={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
 if(origin&&allowed)h['Access-Control-Allow-Origin']=origin;
 const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:h});
 if(!allowed)return reply({error:'请求来源不符。'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...h,'Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'600'}});
 try{
 if(path==='/health'&&request.method==='GET')return reply({ok:true});
 if(path==='/api/auth/status'&&request.method==='GET'){const auth=await env.DB.prepare('SELECT id FROM family_auth WHERE id = ?').bind('home').first();return reply({configured:!!auth})}
 if((path==='/api/auth/setup'||path==='/api/auth/login')&&request.method==='POST'){
 if(!await throttle(request,env.DB))return reply({error:'尝试次数较多，请 15 分钟后再试。'},429);
 const raw=await jsonBody(request);const parsed=passwordSchema.safeParse(raw);if(!parsed.success)return reply({error:'家庭密码需要 12～128 个字符。'},400);
 const auth=await env.DB.prepare('SELECT password_hash,salt,iterations FROM family_auth WHERE id = ?').bind('home').first<Auth>();
 if(path==='/api/auth/setup'){
 if(auth)return reply({error:'家庭密码已经设置，请直接登录。'},409);
 if(!env.BOOTSTRAP_HASH||typeof raw.setupToken!=='string'||raw.setupToken.length!==64||!equal(await digest(raw.setupToken),env.BOOTSTRAP_HASH))return reply({error:'设置链接无效。'},403);
 const salt=randomToken();const hash=await passwordHash(parsed.data.password,salt);
 const inserted=await env.DB.prepare('INSERT OR IGNORE INTO family_auth (id,password_hash,salt,iterations,created_at) VALUES (?,?,?,?,?)').bind('home',hash,salt,ITERATIONS,new Date().toISOString()).run();
 if(inserted.meta.changes!==1)return reply({error:'密码已由另一台设备设置，请直接登录。'},409);
 return reply(await session(env.DB));
 }
 if(!auth)return reply({error:'家庭空间还在准备中。'},503);
 const hash=await passwordHash(parsed.data.password,auth.salt,auth.iterations);if(!equal(hash,auth.password_hash))return reply({error:'密码不对，请再试一次。'},401);
 await env.DB.prepare('DELETE FROM auth_limits WHERE expires_at < ?').bind(Date.now()).run();
 return reply(await session(env.DB));
 }
 if(!await authenticated(request,env.DB))return reply({error:'请先输入家庭密码。'},401);
 if(path==='/api/auth/logout'&&request.method==='POST'){const token=request.headers.get('Authorization')!.slice(7);await env.DB.prepare('DELETE FROM family_sessions WHERE token_hash = ?').bind(await digest(token)).run();return reply({ok:true})}
 if(path==='/api/family'&&request.method==='GET'){const row=await read(env.DB);return row?reply(snapshot(row)):reply({error:'家庭记录还在迁移，请稍后重试。'},503)}
 if(path==='/api/family'&&request.method==='PUT'){
 const parsed=bodySchema.safeParse(await jsonBody(request));if(!parsed.success)return reply({error:'请检查日期、数量和文字长度。'},400);
 const p=parsed.data,before=await read(env.DB);
 if(before?.last_operation===p.operationId)return reply(snapshot(before));
 // 旧页面还可能保存备货记录；遗漏新字段时保留清单，避免覆盖已买进度。
 const previous=before?JSON.parse(before.body):{};
 const nextData=preserveHK(preservePreparation(p.data,previous),previous);
 const stamp=new Date().toISOString();const result=await env.DB.prepare('UPDATE family_state SET body = ?, version = version + 1, updated_at = ?, last_operation = ? WHERE id = ? AND version = ?').bind(JSON.stringify(nextData),stamp,p.operationId,'home',p.baseVersion).run();
 if(result.meta.changes!==1){const latest=await read(env.DB);if(latest?.last_operation===p.operationId)return reply(snapshot(latest));return reply({error:'另一台设备有更新。已刷新，请重新确认这次修改。',latest:latest?snapshot(latest):null},409)}
 return reply({data:nextData,version:p.baseVersion+1,updatedAt:stamp});
 }
 return reply({error:'没有这个页面。'},404);
 }catch(e){if(e instanceof HttpError)return reply({error:e.message},e.status);console.error('Request failed',path,e instanceof Error?e.name:'UnknownError');return reply({error:'暂时无法连接，请稍后重试。'},503)}
}};
