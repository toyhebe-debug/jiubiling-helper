export type Stock={id:string;name:string;unit:string;detail:string;amount:number;daily:number;pack:number;asOf:string;lead:number;snooze:string;updatedAt:string};
export type Visit={id:string;date:string;time:string;checks:string;prep:string;questions:string;reply:string;rentalDone:boolean;rentalNeeded:boolean;done:boolean};
import type {Preparation} from './preparation';
import type {HKTrip} from './hk';
export type Family={dueDate:string;stocks:Stock[];visits:Visit[];preparation?:Preparation;hkTrip?:HKTrip};
export type Snapshot={data:Family;version:number;updatedAt:string};
export const DAY=86400000;
export function dayNumber(s:string){return Math.round(Date.parse(s+'T00:00:00Z')/DAY)}
export function addDays(s:string,n:number){return new Date((dayNumber(s)+n)*DAY).toISOString().slice(0,10)}
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
export function pretty(s:string){if(!s)return '待安排';const a=s.split('-');return Number(a[1])+' 月 '+Number(a[2])+' 日'}
export function short(s:string){return s.slice(5).replace('-','/')}
export function weekday(s:string){return new Date(s+'T12:00:00+08:00').toLocaleDateString('zh-CN',{weekday:'long',timeZone:'Asia/Shanghai'})}
export function estimate(x:Stock,date:string){
 const elapsed=Math.max(0,dayNumber(date)-dayNumber(x.asOf));
 const remaining=Math.max(0,x.amount-elapsed*x.daily);
 const runout=addDays(x.asOf,Math.floor(x.amount/x.daily));
 const calculated=addDays(runout,-x.lead);
 const reminder=x.snooze&&x.snooze>calculated?x.snooze:calculated;
 return {remaining,days:remaining/x.daily,runout,reminder,due:reminder<=date,ratio:Math.min(1,remaining/Math.max(x.amount,1))};
}
export function pregnancy(due:string,date:string){const days=280-(dayNumber(due)-dayNumber(date));return days>=0&&days<280?'孕 '+Math.floor(days/7)+' 周 + '+days%7+' 天':days>=280?'预产期 '+pretty(due):'预产期 '+pretty(due)}
