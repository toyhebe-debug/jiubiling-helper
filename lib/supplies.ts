export const supplyCategories=['大件','查缺补漏','宝宝待产包','妈妈待产包'] as const;
export const supplyStatuses=['待买','待确认','后置购买','已购'] as const;
export type SupplyCategory=typeof supplyCategories[number];
export type SupplyStatus=typeof supplyStatuses[number];
export type SupplyItem={id:string;category:SupplyCategory;item:string;status:SupplyStatus;qty:string;note:string;owner:string};
export type Supplies={version:1;sourceVersion:string;items:SupplyItem[]};
export function sortedSupplies(items:SupplyItem[]){return [...items].sort((a,b)=>supplyStatuses.indexOf(a.status)-supplyStatuses.indexOf(b.status))}
export function preserveSupplies<T extends {supplies?:Supplies}>(incoming:T,previous:{supplies?:Supplies}):T{return incoming.supplies===undefined&&previous.supplies?{...incoming,supplies:previous.supplies}:incoming}
