import {z} from 'zod';
import {supplyCategories,supplyStatuses} from '../lib/supplies.ts';
export const supplyItemSchema=z.object({id:z.string().min(1).max(100),category:z.enum(supplyCategories),item:z.string().trim().min(1).max(120),status:z.enum(supplyStatuses),qty:z.string().max(300),note:z.string().max(2000),owner:z.string().max(80)});
export const suppliesSchema=z.object({version:z.literal(1),sourceVersion:z.string().min(1).max(100),items:z.array(supplyItemSchema).max(300).refine(items=>new Set(items.map(i=>i.id)).size===items.length)});
