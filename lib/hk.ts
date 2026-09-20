export const hkStatuses=['未购买','已购','缺货','暂缓','取消','重复待确认','待选款'] as const;
export type HKStatus=typeof hkStatuses[number];
export type HKItem={id:string;name:string;model:string;suggested:string;region:string;origin:string;status:HKStatus;check:string;sourceIds:string[];actualQuantity:number|null;amount:number|null;currency:'HKD'|'CNY'|null;actualModel:string;store:string;note:string};
export type HKTrip={
 version:1;title:string;date:string;sourceName:string;sourceVersion:string;snapshotDate:string;routeSummary:string;
 items:HKItem[];
 milestones:{time:string;label:string;note:string}[];
 route:{time:string;title:string;note:string}[];
 stores:{id:string;name:string;address:string;hours:string;contact:string;role:string;primary:boolean;excluded:boolean;url:string}[];
 inventory:{id:string;status:string;name:string;quantity:string;note:string}[];
 checks:{id:string;label:string;done:boolean;note:string}[];
 notes:{title:string;body:string;sourceIds:string[]}[];
 sources:{id:string;title:string;url:string}[];
};
export function hkSummary(items:HKItem[]){
 const bought=items.filter(i=>i.status==='已购');
 const totals:{HKD:number|null;CNY:number|null}={HKD:null,CNY:null};
 for(const currency of ['HKD','CNY'] as const){const recorded=bought.filter(i=>i.currency===currency&&i.amount!==null);if(recorded.length)totals[currency]=recorded.reduce((sum,i)=>sum+Math.round(i.amount!*100),0)/100}
 return {bought:bought.length,total:items.filter(i=>i.status!=='取消').length,pending:items.filter(i=>i.status!=='已购'&&i.status!=='取消').length,unpriced:bought.filter(i=>i.amount===null||i.currency===null).length,totals};
}
export function preserveHK<T extends {hkTrip?:HKTrip}>(incoming:T,previous:{hkTrip?:HKTrip}):T{return incoming.hkTrip===undefined&&previous.hkTrip?{...incoming,hkTrip:previous.hkTrip}:incoming}
export function pageFromHash(hash:string){return hash==='#hk'?'hk':'today'}
