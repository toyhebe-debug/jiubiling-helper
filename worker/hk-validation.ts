import {z} from 'zod';
import {hkStatuses} from '../lib/hk.ts';
const str=z.string().max(2000),short=z.string().max(200),id=z.string().min(1).max(80);
const date=z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===v});
const ids=z.array(short).max(30);
const url=z.string().max(1000).refine(v=>v===''||/^https:\/\//.test(v));
export const hkItemSchema=z.object({id,name:z.string().trim().min(1).max(200),model:short,suggested:short,region:short,origin:short,status:z.enum(hkStatuses),check:str,sourceIds:ids,actualQuantity:z.number().positive().max(10000).nullable(),amount:z.number().min(0).max(10000000).refine(v=>Math.abs(v*100-Math.round(v*100))<0.000001).nullable(),currency:z.enum(['HKD','CNY']).nullable(),actualModel:short,store:short,note:str}).refine(v=>v.amount===null||v.currency!==null);
export const hkTripSchema=z.object({version:z.literal(1),title:short,date,sourceName:short,sourceVersion:short,snapshotDate:date,routeSummary:str,
 items:z.array(hkItemSchema).max(100).refine(v=>new Set(v.map(x=>x.id)).size===v.length),
 milestones:z.array(z.object({time:short,label:short,note:str})).max(12),
 route:z.array(z.object({time:short,title:short,note:str})).max(40),
 stores:z.array(z.object({id,name:short,address:short,hours:short,contact:short,role:str,primary:z.boolean(),excluded:z.boolean(),url})).max(30),
 inventory:z.array(z.object({id,status:short,name:short,quantity:short,note:str})).max(60),
 checks:z.array(z.object({id,label:str,done:z.boolean(),note:str})).max(60).refine(v=>new Set(v.map(x=>x.id)).size===v.length),
 notes:z.array(z.object({title:short,body:z.string().max(8000),sourceIds:ids})).max(30),
 sources:z.array(z.object({id,title:short,url})).max(50)
});
