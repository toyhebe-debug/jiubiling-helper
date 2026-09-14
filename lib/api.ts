const KEY='jiubiling.session.v1';
export function sessionToken(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return s?.expiresAt>Date.now()?String(s.token):null}catch{return null}}
export function saveSession(data:{token:string;expiresAt:number}){localStorage.setItem(KEY,JSON.stringify(data))}
export function clearSession(){localStorage.removeItem(KEY)}
export const API_BASE=(import.meta.env.VITE_API_BASE||'').replace(/\/$/,'');
export async function apiFetch(path:string,options:RequestInit={}){if(!API_BASE)throw new Error('共享服务还未配置。');const headers=new Headers(options.headers);const token=sessionToken();if(token)headers.set('Authorization','Bearer '+token);const r=await fetch(API_BASE+path,{...options,headers,cache:'no-store'});if(r.status===401&&!path.startsWith('/api/auth/')){clearSession();window.dispatchEvent(new Event('jiubiling-auth-required'))}return r}
