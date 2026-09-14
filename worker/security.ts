export const ITERATIONS=100000;
const encode=(s:string)=>new TextEncoder().encode(s);
export function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('')}
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encode(value))),x=>x.toString(16).padStart(2,'0')).join('')}
export async function passwordHash(password:string,salt:string,iterations=ITERATIONS){const key=await crypto.subtle.importKey('raw',encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encode(salt),iterations},key,256);return Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,'0')).join('')}
export function equal(a:string,b:string){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
