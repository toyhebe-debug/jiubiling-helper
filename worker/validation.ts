import {z} from 'zod';
const date=z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===v});
const text=z.string().max(8000);
const stock=z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(40),unit:z.string().trim().min(1).max(10),detail:z.string().max(100),amount:z.number().min(0).max(10000),daily:z.number().positive().max(10000),pack:z.number().positive().max(10000),asOf:date,lead:z.number().int().min(0).max(30),snooze:z.union([date,z.literal('')]),updatedAt:z.string().max(40)});
const visit=z.object({id:z.string().min(1).max(100),date,time:z.string().regex(/^(|([01]\d|2[0-3]):[0-5]\d)$/),checks:text,prep:text,questions:text,reply:text,rentalDone:z.boolean(),rentalNeeded:z.boolean().default(true),done:z.boolean()});
export const bodySchema=z.object({operationId:z.string().uuid(),baseVersion:z.number().int().min(0),data:z.object({dueDate:date,stocks:z.array(stock).max(50),visits:z.array(visit).max(100)}).refine(v=>new Set(v.stocks.map(x=>x.id)).size===v.stocks.length&&new Set(v.visits.map(x=>x.id)).size===v.visits.length)});
