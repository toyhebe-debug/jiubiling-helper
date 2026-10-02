import {useState} from 'react';
import {Check,Search,Settings2,X} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {toast} from 'sonner';
import {sortedSupplies,supplyCategories,supplyStatuses} from '@/lib/supplies';
import type {Supplies,SupplyCategory,SupplyItem} from '@/lib/supplies';

type Props={supplies:Supplies|undefined;version:number;saving:boolean;onSave:(supplies:Supplies,version:number)=>Promise<boolean>};
export default function SuppliesPanel({supplies,version,saving,onSave}:Props){
 const [category,setCategory]=useState<SupplyCategory>('大件');
 const [query,setQuery]=useState('');
 const [editor,setEditor]=useState<{item:SupplyItem;version:number}|null>(null);
 const [error,setError]=useState('');
 if(!supplies)return <section className="supply-page"><h2>采购清单</h2><p className="empty-text">清单还未载入，请稍后重新同步。</p></section>;
 const inCategory=supplies.items.filter(i=>i.category===category);
 const bought=inCategory.filter(i=>i.status==='已购').length;
 const shown=sortedSupplies(inCategory.filter(i=>[i.item,i.qty,i.note,i.owner].join(' ').toLowerCase().includes(query.trim().toLowerCase())));
 async function markBought(item:SupplyItem){if(!supplies||saving)return;if(await onSave({...supplies,items:supplies.items.map(i=>i.id===item.id?{...i,status:'已购'}:i)},version))toast.success('已标记已购，排到本类下方。')}
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!editor||!supplies||saving)return;setError('');
  if(editor.version!==version){setError('另一台设备更新了记录。输入仍保留，请关闭后重新打开这件物品再改。');return}
  const f=new FormData(e.currentTarget),str=(k:string)=>String(f.get(k)||'').trim();
  const item:SupplyItem={...editor.item,status:str('status') as SupplyItem['status'],qty:str('qty'),note:str('note'),owner:str('owner')};
  if(await onSave({...supplies,items:supplies.items.map(i=>i.id===item.id?item:i)},editor.version)){setEditor(null);toast.success('已保存，清单已按状态排序。')}
  else setError('还没保存，输入仍保留。请查看同步提示后重试。');
 }
 return <section className="supply-page">
  <nav className="supply-categories" aria-label="采购分类">{supplyCategories.map(c=><button key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setQuery('')}}><strong>{c}</strong><span>{supplies.items.filter(i=>i.category===c).length} 项</span></button>)}</nav>
  <div className="supply-heading"><div><h2>{category}</h2><p>还有 {inCategory.length-bought} 项待处理</p></div><span>已购 {bought} / {inCategory.length}</span></div>
  <p className="supply-hint">已购后仍需核对数量、另行装包。顺产和剖宫产按对应数量准备。</p>
  <label className="prep-search"><Search size={17}/><input aria-label="搜索本类采购" placeholder="搜本类物品、说明或谁买" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  {supplyStatuses.map(status=>{const rows=shown.filter(i=>i.status===status);return rows.length>0&&<section className="supply-group" key={status} aria-label={status+'物品'}><h3>{status}<span>{rows.length}</span></h3><div className="supply-grid">{rows.map(item=><article key={item.id} className={'supply-card '+(status==='已购'?'is-bought':'')} aria-label={item.item}><div className="supply-card-title"><h4>{item.item}</h4><span className={'supply-status status-'+supplyStatuses.indexOf(status)}>{status}</span></div><p className="supply-qty">{item.qty||'数量待补'}</p>{item.note&&<p className="supply-note">{item.note}</p>}<p className="supply-owner">谁买：{item.owner||'待分配'}</p><div className="supply-actions"><button className="secondary" disabled={saving} aria-label={'编辑'+item.item} onClick={()=>{setError('');setEditor({item:structuredClone(item),version})}}><Settings2 size={16}/>编辑</button>{status!=='已购'&&<button className="primary" disabled={saving} aria-label={'标记'+item.item+'已购'} onClick={()=>markBought(item)}><Check size={16}/>已购</button>}</div></article>)}</div></section>})}
  {!shown.length&&<p className="empty-text">本分类没有匹配的物品，换个词试试。</p>}
  <Dialog open={!!editor} onOpenChange={open=>{if(!open&&!saving)setEditor(null)}}><DialogContent className="family-dialog" showCloseButton={false}><DialogClose className="dialog-close" aria-label="关闭" disabled={saving}><X size={20}/></DialogClose><DialogTitle>{editor?.item.item||'编辑物品'}</DialogTitle><DialogDescription>买到后改状态，数量、说明和谁买都可以随时更新。</DialogDescription>{editor&&<form className="edit-form" key={editor.item.id} onSubmit={submit}><label>购买状态<select name="status" defaultValue={editor.item.status}>{supplyStatuses.map(s=><option key={s}>{s}</option>)}</select></label><label>数量<input name="qty" maxLength={300} defaultValue={editor.item.qty} placeholder="写清数量或待核对内容"/></label><label>谁买<input name="owner" maxLength={80} defaultValue={editor.item.owner} placeholder="待分配"/></label><label>简要说明<textarea name="note" maxLength={2000} rows={4} defaultValue={editor.item.note} placeholder="型号、渠道、注意事项或笔记"/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary save-button" disabled={saving}>{saving?'正在保存…':'保存'}</button></form>}</DialogContent></Dialog>
 </section>;
}
