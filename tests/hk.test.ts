import test from 'node:test';import assert from 'node:assert/strict';
import{hkSummary,preserveHK,pageFromHash}from'../lib/hk.ts';
import{hkTripSchema}from'../worker/hk-validation.ts';
import{hkFixture}from'./hk-fixture.ts';
test('采购空金额不是零预算；仅已购按币种分别加总',()=>{
 const p=hkFixture(),item=p.items[0];assert.deepEqual(hkSummary(p.items).totals,{HKD:null,CNY:null});
 const list=[{...item,id:'1',status:'已购' as const,amount:0.1,currency:'HKD' as const},{...item,id:'2',status:'已购' as const,amount:0.2,currency:'HKD' as const},{...item,id:'3',status:'已购' as const,amount:5,currency:'CNY' as const},{...item,id:'4',status:'已购' as const},{...item,id:'5',status:'暂缓' as const,amount:999,currency:'HKD' as const},{...item,id:'6',status:'取消' as const}];
 const result=hkSummary(list);assert.deepEqual(result.totals,{HKD:0.3,CNY:5});assert.equal(result.unpriced,1);assert.equal(result.total,5);assert.equal(result.bought,4);
});
test('旧页面遗漏香港采购时保留云端进度，独立链接解析正确',()=>{const p=hkFixture();assert.equal(preserveHK({hkTrip:undefined},{hkTrip:p}).hkTrip,p);assert.equal(pageFromHash('#hk'),'hk');assert.equal(pageFromHash(''),'today')});
test('校验采购金额、币种、ID、日期与外链',()=>{
 const p=hkFixture();assert.equal(hkTripSchema.safeParse(p).success,true);
 for(const mutate of [(x:any)=>x.items[0].amount=10,(x:any)=>{x.items[0].amount=-1;x.items[0].currency='HKD'},(x:any)=>{x.items[0].amount=1.001;x.items[0].currency='CNY'},(x:any)=>x.items.push(x.items[0]),(x:any)=>x.date='2030-99-99',(x:any)=>x.sources.push({id:'S01',title:'外链',url:'javascript:alert(1)'})]){const q=structuredClone(p);mutate(q);assert.equal(hkTripSchema.safeParse(q).success,false)}
});
