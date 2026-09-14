import {apiFetch} from '@/lib/api';
"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {Heart,ShoppingBasket,Milk,Leaf,CalendarDays,Check,Plus,ArrowRight,ArrowLeft,Settings2,RefreshCw,Download,CheckCheck,WifiOff,X,NotebookPen} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Checkbox} from '@/components/ui/checkbox';
import {Toaster} from '@/components/ui/sonner';
import {toast} from 'sonner';
import {addDays,dayNumber,estimate,pretty,short,today,weekday,pregnancy} from '@/lib/family';
import type {Stock,Visit,Family,Snapshot} from '@/lib/family';
type Editor={kind:'stock';item:Stock;isNew?:boolean}|{kind:'refill';item:Stock}|{kind:'visit';item:Visit;isNew?:boolean}|{kind:'settings'};
const blankVisit=(date:string):Visit=>({id:crypto.randomUUID(),date,time:'',checks:'',prep:'',questions:'',reply:'',rentalDone:false,rentalNeeded:false,done:false});
export default function FamilyApp({onLogout}:{onLogout:()=>Promise<void>}){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[date,setDate]=useState(today);
 const ref=useRef<Snapshot|null>(null),[loading,setLoading]=useState(true),[offline,setOffline]=useState(false),[error,setError]=useState('');
 const [saving,setSaving]=useState(false),savingRef=useRef(false),[editor,setEditor]=useState<Editor|null>(null),[tab,setTab]=useState('today');
 const editorVersion=useRef(0);
 const [formError,setFormError]=useState(''),[historyOpen,setHistoryOpen]=useState(false);
 function accept(s:Snapshot){ref.current=s;setSnapshot(s)}
 const refresh=useCallback(async()=>{
  if(savingRef.current)return;
  try{const r=await apiFetch('/api/family',{cache:'no-store'});const v=await r.json() as Snapshot & {error?:string;latest?:Snapshot};if(!r.ok)throw new Error(v.error||'暂时无法读取');
   if(!ref.current||v.version>=ref.current.version){ref.current=v;setSnapshot(v)}setError('');setOffline(false);
  }catch(e){setError(e instanceof Error?e.message:'暂时无法读取');setOffline(!navigator.onLine)}finally{setLoading(false);setDate(today())}
 },[]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh()},20000);
 const visible=()=>{if(document.visibilityState==='visible')void refresh()};const off=()=>setOffline(true);
 window.addEventListener('online',refresh);window.addEventListener('offline',off);document.addEventListener('visibilitychange',visible);
 return()=>{clearInterval(timer);window.removeEventListener('online',refresh);window.removeEventListener('offline',off);document.removeEventListener('visibilitychange',visible)}},[refresh]);
 const save=useCallback(async(data:Family,expected?:number)=>{
  if(savingRef.current||!ref.current)return null;
  const baseVersion=expected??ref.current.version;
  savingRef.current=true;setSaving(true);setFormError('');
  try{
   const r=await apiFetch('/api/family',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({operationId:crypto.randomUUID(),baseVersion,data})});const v=await r.json() as Snapshot & {error?:string;latest?:Snapshot};
   if(!r.ok){if(v.latest){accept(v.latest);editorVersion.current=v.latest.version;}throw new Error(v.error||'还没保存，请重试。')}
   accept(v);setError('');setOffline(false);return v as Snapshot;
  }catch(e){const msg=e instanceof Error?e.message:'网络断开，内容还在这里，请重试。';setFormError(msg);toast.error(msg);return null}
  finally{setSaving(false);savingRef.current=false}
 },[]);
 useEffect(()=>{
  const context=(document as Document&{modelContext?:{registerTool:(tool:unknown,options:unknown)=>unknown}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{Promise.resolve(context.registerTool({name:'read_family_overview',title:'查看家里备货与产检',description:'读取当前家庭记录与估算补货日期，不修改记录。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input:unknown){if(input===null||typeof input!=='object'||Object.keys(input).length)throw new Error('无需参数');if(!ref.current)throw new Error('记录尚未载入');return {today:today(),...ref.current}}},{signal:lifecycle.signal})).catch(()=>{})}catch{}
  return()=>lifecycle.abort();
 },[]);
 const show=(e:Editor)=>{editorVersion.current=ref.current?.version??0;setFormError('');setEditor(e)};
 if(!snapshot)return <main className="shell"><header className="topbar"><span className="brand"><Heart size={19}/> 九比灵小助手</span></header><div className="load-state"><ShoppingBasket size={34}/><h1>{loading?'正在取回家里的记录':'暂时没连上'}</h1><p>{loading?'稍等一下。':error}</p>{!loading&&<button className="primary" onClick={refresh}>重新读取</button>}</div></main>;
 const data=snapshot.data;
 const stocks=[...data.stocks].sort((a,b)=>estimate(a,date).reminder.localeCompare(estimate(b,date).reminder));
 const due=stocks.filter(x=>estimate(x,date).due);
 const next=stocks[0],nextEstimate=next?estimate(next,date):null;
 const visits=[...data.visits].filter(x=>!x.done).sort((a,b)=>a.date.localeCompare(b.date)),visit=visits[0];
 const completed=data.visits.filter(x=>x.done).sort((a,b)=>b.date.localeCompare(a.date));
 async function snooze(item:Stock){const e=estimate(item,date);const result=await save({...ref.current!.data,stocks:ref.current!.data.stocks.map(x=>x.id===item.id?{...x,snooze:addDays(e.reminder>date?e.reminder:date,1)}:x)});if(result)toast.success('已延后一天；余量估算保持不变。')}
 async function rental(item:Visit,value:boolean){const result=await save({...ref.current!.data,visits:ref.current!.data.visits.map(v=>v.id===item.id?{...v,rentalDone:value}:v)});if(result)toast.success(value?'已记下：胎监设备租好了':'已恢复租赁待办')}
 function backup(){const blob=new Blob([JSON.stringify(ref.current,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='九比灵小助手-'+date+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!editor||!ref.current)return;
  const f=new FormData(e.currentTarget);const str=(k:string)=>String(f.get(k)||'').trim();const num=(k:string)=>Number(f.get(k));
  let nextData:Family=structuredClone(ref.current.data);const previous=structuredClone(ref.current.data);
  if(editor.kind==='refill'){
   const n=num('amount');if(!Number.isFinite(n)||n<0||!str('asOf')){setFormError('请填写有效的库存数量和日期。');return}
   nextData.stocks=nextData.stocks.map(x=>x.id===editor.item.id?{...x,amount:n,asOf:str('asOf'),snooze:'',updatedAt:new Date().toISOString()}:x);
  }else if(editor.kind==='stock'){
   const value:Stock={...editor.item,name:str('name'),unit:str('unit'),detail:str('detail'),amount:num('amount'),asOf:str('asOf'),daily:1/num('daysPerUnit'),pack:num('pack'),lead:num('lead'),snooze:'',updatedAt:new Date().toISOString()};
   if(!value.name||!value.unit||!Number.isFinite(value.daily)||value.daily<=0||value.amount<0||value.pack<=0){setFormError('请检查名称、数量和使用速度。');return}
   nextData.stocks=editor.isNew?[...nextData.stocks,value]:nextData.stocks.map(x=>x.id===value.id?value:x);
  }else if(editor.kind==='visit'){
   const value:Visit={...editor.item,date:str('date'),time:str('time'),checks:str('checks'),prep:str('prep'),questions:str('questions'),reply:str('reply'),done:f.get('done')==='on',rentalNeeded:f.get('rentalNeeded')==='on'};
   nextData.visits=editor.isNew?[...nextData.visits,value]:nextData.visits.map(x=>x.id===value.id?value:x);
  }else nextData.dueDate=str('dueDate');
  const result=await save(nextData,editorVersion.current);
  if(result){const canUndo=editor.kind==='refill';setEditor(null);toast.success(canUndo?'补货记好了':'已保存',canUndo?{action:{label:'撤销',onClick:()=>{void save(previous,result.version).then(r=>{if(r)toast.success('已撤销这次补货')})}},duration:6000}:undefined)}
 }
 function visitCard(v:Visit,detail=false){return <article className="visit-card" key={v.id}><div className="visit-date"><strong>{Number(v.date.slice(8))}</strong><div><span>{Number(v.date.slice(5,7))} 月 · {weekday(v.date)}</span><p>{v.time||'预约时间待补'}{v.date<date&&!v.done?' · 待确认是否完成':''}</p></div><CalendarDays size={22}/></div><div className="visit-tags">{v.checks?v.checks.split(/[、,，\n]+/).filter(Boolean).map((x,i)=><span key={i}>{x}</span>):<span>检查项目待补</span>}</div>{v.rentalNeeded!==false&&<label className={'rental '+(v.rentalDone?'checked':'')}><Checkbox checked={v.rentalDone} disabled={saving} onCheckedChange={x=>rental(v,x===true)}/><span>租胎监设备</span><small>{v.rentalDone?'已办好':'待办'}</small></label>}{detail&&<div className="note-preview"><div><span>准备事项</span><p>{v.prep||'待确认医院要求'}</p></div><div><span>想问医生</span><p>{v.questions||'想到的问题，随手记在这里。'}</p></div><div><span>医生答复</span><p>{v.reply||'检查后再补。'}</p></div></div>}<button className="secondary" onClick={()=>detail?show({kind:'visit',item:v}):setTab('visit')}><NotebookPen size={17}/>{detail?'编辑产检随手记':'产检随手记'}<ArrowRight size={16}/></button></article>}
 return <main className="shell"><Toaster position="top-center" theme="light" richColors/><header className="topbar"><span className="brand"><Heart size={19}/> 九比灵小助手</span><div className="top-actions"><span className="sync-label">{saving?'保存中…':offline?'未联网':error?'同步待重试':'已同步'}</span><button className="icon-button" aria-label="设置与备份" onClick={()=>show({kind:'settings'})}><Settings2 size={19}/></button></div></header>
 {(offline||error)&&<div className="notice" role="status"><WifiOff size={17}/><span>{offline?'网络断开。当前显示上次读取的记录。':error}</span><button onClick={refresh}>重试</button></div>}
 <div className="greeting"><p className="eyebrow">{pretty(date)} · {weekday(date)}</p><h1>缺什么记什么</h1><p>{pregnancy(data.dueDate,date)} <span className="dot">·</span> 预产期 {pretty(data.dueDate)}</p></div>
 <Tabs value={tab} onValueChange={setTab}><TabsList className="main-tabs"><TabsTrigger value="today"><ShoppingBasket size={17}/> 家里备货</TabsTrigger><TabsTrigger value="visit"><CalendarDays size={17}/> 产检安排</TabsTrigger></TabsList>
 <TabsContent value="today">
 <div className={'overview '+(due.length?'urgent':'')}><span><ShoppingBasket size={20}/>{due.length?'待补货 '+due.length+' 样':'下次补货'}</span><strong>{due.length?due.map(x=>x.name).join('、'):nextEstimate?<>{short(nextEstimate.reminder)} <small>{next.name}</small></>:'还没有常备物品'}</strong></div>
 <div className="columns"><section><div className="section-title"><h2>家里常备</h2><button className="text-button" onClick={()=>show({kind:'stock',isNew:true,item:{id:crypto.randomUUID(),name:'',unit:'件',detail:'',amount:1,daily:1/7,pack:1,asOf:date,lead:1,snooze:'',updatedAt:''}})}><Plus size={17}/> 添加</button></div>
 {stocks.map(x=>{const e=estimate(x,date);return <article className={'stock-card '+(e.due?'is-due':'')} key={x.id}><div className="stock-top"><div className={'item-icon '+(x.id==='kiwi'?'green':'')}>{x.id==='milk'?<Milk/>:x.id==='kiwi'?<Leaf/>:<ShoppingBasket/>}</div><div className="item-name"><h3>{x.name}</h3><p>{x.detail||'家里常备'} · 每次 {x.pack} {x.unit}</p></div><button className="icon-button edit-stock" aria-label={'调整'+x.name} onClick={()=>show({kind:'stock',item:x})}><Settings2 size={17}/></button></div><div className="stock-summary"><span>{e.due?'该补货了':pretty(e.reminder)+'补货'}</span><p>{e.days<=0?'按之前的用量，预计已用完':e.days<1?'预计还能用不到 1 天':'预计还能用约 '+Number(e.days.toFixed(1))+' 天'}{x.snooze&&x.snooze>addDays(e.runout,-x.lead)?' · 提醒已延后':''}</p></div><div className={'meter '+(x.id==='kiwi'?'green':'')} aria-hidden="true"><i style={{width:(e.ratio*100)+'%'}}/></div><div className="stock-actions"><button className="primary" disabled={saving} onClick={()=>show({kind:'refill',item:x})}><Check size={17}/> 已补货</button>{e.due&&<button className="secondary" disabled={saving} onClick={()=>snooze(x)}>明天再说</button>}</div><p className="stock-foot">{pretty(x.asOf)}记下 {x.amount} {x.unit} · 每{x.unit}约用 {Number((1/x.daily).toFixed(2))} 天</p></article>})}
 {!stocks.length&&<p className="empty-text">添加一件常备物品，就能开始提醒。</p>}
 <p className="section-note">按用量估算，默认提前 1 天提醒。家里余量有变化时，点右上角调整。</p></section><section className="home-visit"><div className="section-title"><h2>下次产检</h2><span>{visit?visit.date<date?'待确认':dayNumber(visit.date)-dayNumber(date)===0?'今天':'还有 '+(dayNumber(visit.date)-dayNumber(date))+' 天':''}</span></div>{visit?visitCard(visit):<div className="visit-card"><p className="empty-text">下次预约还没记。</p><button className="secondary" onClick={()=>show({kind:'visit',item:blankVisit(date),isNew:true})}>记下次产检</button></div>}</section></div>
 </TabsContent><TabsContent value="visit"><div className="section-title visit-heading"><h2>产检随手记</h2><button className="text-button" onClick={()=>show({kind:'visit',item:blankVisit(date),isNew:true})}><Plus size={17}/> 新增预约</button></div><div className="visit-grid">{visits.map(v=>visitCard(v,true))}{!visits.length&&<div className="visit-card empty-text">还没有待办的产检，预约后在这里记一笔。</div>}</div>{completed.length>0&&<div className="visit-history"><button className="text-button" onClick={()=>setHistoryOpen(!historyOpen)}>{historyOpen?'收起':'查看'}已完成产检（{completed.length}）</button>{historyOpen&&completed.map(v=><button className="history-row" key={v.id} onClick={()=>show({kind:'visit',item:v})}><CheckCheck size={18}/><span>{pretty(v.date)} · {v.checks||'产检记录'}</span><ArrowRight size={16}/></button>)}</div>}<p className="section-note">检查项目和准备事项按医院实际安排填写。</p></TabsContent></Tabs>
 <footer className="page-footer"><Heart size={13}/> 九比灵来帮您</footer>
 <Dialog open={!!editor} onOpenChange={open=>{if(!open&&!saving)setEditor(null)}}><DialogContent className="family-dialog" showCloseButton={false}><DialogClose className="dialog-close" aria-label="关闭" disabled={saving}><X size={20}/></DialogClose><DialogTitle>{editor?.kind==='refill'?editor.item.name+'补货':editor?.kind==='stock'?(editor.isNew?'添加常备物品':'调整'+editor.item.name):editor?.kind==='visit'?(editor.isNew?'记下次产检':'产检随手记'):'我们的小家'}</DialogTitle><DialogDescription>{editor?.kind==='refill'?'按现在家里的总量，重新算下次提醒。':editor?.kind==='stock'?'按你们平时的用量来，之后随时能改。':editor?.kind==='visit'?'预约、要带的东西和想问的问题，放在一起。':'预产期与记录备份。'}</DialogDescription>
 {editor&&<form key={editor.kind+('item'in editor?editor.item.id:'')} onSubmit={submit} className="edit-form">
 {editor.kind==='refill'&&<><div className="refill-intro">{editor.item.detail} · 通常买 {editor.item.pack} {editor.item.unit}</div><label>补货后家里共有（{editor.item.unit}）<input name="amount" type="number" step="any" min="0" max="10000" required inputMode="decimal" defaultValue={editor.item.pack}/><small>把原来剩的也算进去；默认填平时的一次采购量。</small></label><label>补货日期<input name="asOf" type="date" max={date} required defaultValue={date}/></label></>}
 {editor.kind==='stock'&&<><div className="form-row"><label>物品名称<input name="name" maxLength={40} required defaultValue={editor.item.name} placeholder="例如：卷纸"/></label><label>计量单位<input name="unit" maxLength={10} required defaultValue={editor.item.unit} placeholder="瓶、颗、卷"/></label></div><label>规格<input name="detail" maxLength={100} defaultValue={editor.item.detail} placeholder="例如：780 ml / 瓶"/></label><div className="form-row"><label>这天家里共有<input name="amount" type="number" step="any" min="0" max="10000" required inputMode="decimal" defaultValue={editor.item.amount}/></label><label>记录日期<input name="asOf" type="date" max={date} required defaultValue={editor.item.asOf}/></label></div><div className="form-row"><label>每一单位约用几天<input name="daysPerUnit" type="number" step="any" min="0.01" max="10000" required inputMode="decimal" defaultValue={Number((1/editor.item.daily).toFixed(4))}/></label><label>通常每次买多少<input name="pack" type="number" step="any" min="0.01" max="10000" required inputMode="decimal" defaultValue={editor.item.pack}/></label></div><label>提前几天提醒<input name="lead" type="number" min="0" max="30" step="1" required inputMode="numeric" defaultValue={editor.item.lead}/></label></>}
 {editor.kind==='visit'&&<><div className="form-row"><label>产检日期<input name="date" type="date" required defaultValue={editor.item.date}/></label><label>预约时间（可空）<input name="time" type="time" defaultValue={editor.item.time}/></label></div><label>检查项目<textarea name="checks" rows={2} maxLength={8000} defaultValue={editor.item.checks} placeholder="按医院安排填写"/></label><label>准备事项<textarea name="prep" rows={2} maxLength={8000} defaultValue={editor.item.prep} placeholder="例如：医院告知要带的材料"/></label><label>想问医生<textarea name="questions" rows={3} maxLength={8000} defaultValue={editor.item.questions} placeholder="想到一个，记一个"/></label><label>医生答复<textarea name="reply" rows={3} maxLength={8000} defaultValue={editor.item.reply} placeholder="检查后补在这里"/></label><label className="checkbox-label"><Checkbox name="rentalNeeded" defaultChecked={editor.item.rentalNeeded!==false}/><span>这次需要租胎监设备</span></label><label className="checkbox-label"><Checkbox name="done" defaultChecked={editor.item.done}/><span>这次产检已完成</span></label></>}
 {editor.kind==='settings'&&<><label>医生确认的预产期<input name="dueDate" type="date" required defaultValue={data.dueDate}/></label><div className="setting-info"><p>提醒显示在首页，不发送手机通知。</p><p>输入家庭密码的设备，共用这份记录。</p></div><button type="button" className="secondary" onClick={backup}><Download size={18}/> 导出记录备份</button><button type="button" className="text-button" onClick={onLogout}>退出这台设备</button><button type="button" className="text-button" onClick={refresh}><RefreshCw size={16}/> 重新同步</button></>}
 {formError&&<p className="form-error" role="alert">{formError}</p>}<button type="submit" className="primary save-button" disabled={saving}>{saving?'正在保存…':editor.kind==='refill'?'记好了':'保存'}</button>
 </form>}
 </DialogContent></Dialog></main>
}
