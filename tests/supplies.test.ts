import test from 'node:test';
import assert from 'node:assert/strict';
import {sortedSupplies,preserveSupplies} from '../lib/supplies.ts';
import {pageFromHash} from '../lib/navigation.ts';
import {suppliesSchema} from '../worker/supplies-validation.ts';
import {suppliesFixture} from './supplies-fixture.ts';

test('状态排序稳定，改为已购移到下方，可改回待买',()=>{
 const s=suppliesFixture();const original=structuredClone(s.items);
 assert.deepEqual(sortedSupplies(s.items).map(i=>i.id),['test-b','test-a','test-c','test-d']);assert.deepEqual(s.items,original);
 s.items[1].status='已购';assert.deepEqual(sortedSupplies(s.items).map(i=>i.id),['test-a','test-c','test-b','test-d']);
 s.items[1].status='待买';assert.equal(sortedSupplies(s.items)[0].id,'test-b');
});
test('旧客户端遗漏新清单时保留内容，已结束旅行链接到当前清单',()=>{
 const s=suppliesFixture();assert.deepEqual(preserveSupplies({supplies:undefined},{supplies:s}),{supplies:s});
 const newer=suppliesFixture();newer.items[0].owner='新负责人';assert.equal(preserveSupplies({supplies:newer},{supplies:s}).supplies,newer);
 assert.equal(pageFromHash('#hk'),'supplies');assert.equal(pageFromHash('#supplies'),'supplies');assert.equal(pageFromHash(''),'today');
});
test('校验类别、状态、重复ID及字段长度，保留数量说明和负责人',()=>{
 const s=suppliesFixture();assert.deepEqual(suppliesSchema.parse(s),s);
 for(const mutate of [(x:any)=>x.items.push(x.items[0]),(x:any)=>x.items[0].status='已装包',(x:any)=>x.items[0].category='未知类别',(x:any)=>x.items[0].owner='x'.repeat(81),(x:any)=>x.items[0].qty=1,(x:any)=>x.items[0].note='x'.repeat(2001)]){const p=structuredClone(s);mutate(p);assert.equal(suppliesSchema.safeParse(p).success,false)}
});
