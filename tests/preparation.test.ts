import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreparation,visibleItems,progress,setPurchase,preservePreparation} from '../lib/preparation.ts';
import {preparationSchema,bodySchema} from '../worker/validation.ts';

test('清单按地点与分娩方式展示，共用物品只有一份采购状态',()=>{
 const p=createPreparation();assert.equal(preparationSchema.safeParse(p).success,true);
 assert.equal(new Set(p.items.map(i=>i.id)).size,p.items.length);
 assert(p.items.every(i=>i.status==='unknown'&&!i.packed));
 assert(visibleItems(p,'hospital').some(i=>i.id==='belly-band'));
 assert(!visibleItems({...p,delivery:'vaginal'},'hospital').some(i=>i.id==='belly-band'));
 assert(!visibleItems({...p,delivery:'cesarean'},'hospital').some(i=>i.id==='ice-pads'));
 const pump=p.items.find(i=>i.id==='pump')!;pump.status='bought';
 assert.equal(visibleItems(p,'hospital').find(i=>i.id==='pump')?.status,'bought');
 assert.equal(visibleItems(p,'home').find(i=>i.id==='pump')?.status,'bought');
 assert.equal(p.items.filter(i=>i.id==='pump').length,1);
});
test('已买不等于已装包，暂不需要不计入完成率，退回待买时清除装包',()=>{
 const a=createPreparation().items.filter(i=>['pump','bottles','formula'].includes(i.id));
 a[0].status='bought';a[0].packed=true;a[1].status='bought';a[2].status='skip';
 assert.deepEqual(progress(a,'hospital'),{total:2,bought:2,ready:1,unknown:0,todo:0});
 assert.equal(progress(a,'home').ready,2);
 assert.equal(setPurchase(a[0],'todo').packed,false);
 assert.deepEqual(progress([],'home'),{total:0,bought:0,ready:0,unknown:0,todo:0});
});
test('旧客户端不传清单时保留新数据，显式新清单仍可更新',()=>{
 const p=createPreparation();p.items[0].status='bought';
 const next=preservePreparation({preparation:undefined},{preparation:p});assert.equal(next.preparation,p);
 assert.equal(preservePreparation({preparation:{...p,items:[]}},{preparation:p}).preparation.items.length,0);
});
test('接口拒绝重复 id、非法状态、未买却装包以及超长备注',()=>{
 const p=createPreparation();
 for (const mutate of [(q:any)=>q.items.push(q.items[0]),(q:any)=>q.items[0].status='invalid',(q:any)=>q.items[0].packed=true,(q:any)=>q.items[0].note='x'.repeat(1001)]){const q=structuredClone(p);mutate(q);assert.equal(preparationSchema.safeParse(q).success,false)}
 const old={operationId:crypto.randomUUID(),baseVersion:0,data:{dueDate:'2027-01-01',stocks:[],visits:[]}};
 assert.equal(bodySchema.safeParse(old).success,true);
 assert.equal(bodySchema.safeParse({...old,data:{...old.data,preparation:p}}).success,true);
});
