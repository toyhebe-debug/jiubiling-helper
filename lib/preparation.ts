export type Place = 'hospital' | 'home';
export type Delivery = 'both' | 'vaginal' | 'cesarean';
export type Purchase = 'unknown' | 'todo' | 'bought' | 'skip';
export type Category = '证件资料' | '妈妈用品' | '宝宝用品' | '日常洗护' | '喂养用品' | '睡眠出行';
export type PrepItem = {
 id:string; name:string; category:Category; places:Place[]; delivery:Delivery;
 priority:'basic'|'optional'|'confirm'; hospitalQty:string; homeQty:string;
 guidance:string; source:string; status:Purchase; packed:boolean; note:string;
};
export type Preparation = {catalogVersion:1; delivery:Delivery; items:PrepItem[]};
export const categories:Category[]=['证件资料','妈妈用品','宝宝用品','日常洗护','喂养用品','睡眠出行'];
export const purchaseLabels:Record<Purchase,string>={unknown:'待确认',todo:'待买 / 待备',bought:'已买 / 已有',skip:'暂不需要'};
export function visibleItems(p:Preparation,place:Place){return p.items.filter(i=>i.places.includes(place)&&(place==='home'||p.delivery==='both'||i.delivery==='both'||i.delivery===p.delivery))}
export function progress(items:PrepItem[],place:Place){const active=items.filter(i=>i.status!=='skip');return {total:active.length,bought:active.filter(i=>i.status==='bought').length,ready:active.filter(i=>place==='hospital'?i.packed:i.status==='bought').length,unknown:active.filter(i=>i.status==='unknown').length,todo:active.filter(i=>i.status==='todo').length}}
export function setPurchase(item:PrepItem,status:Purchase):PrepItem{return {...item,status,packed:status==='bought'&&item.packed}}
export function preservePreparation<T extends {preparation?:Preparation}>(incoming:T,previous:{preparation?:Preparation}):T{
 return incoming.preparation===undefined&&previous.preparation?{...incoming,preparation:previous.preparation}:incoming;
}

// 同一用品在医院与家中复用同一个 id 和采购状态，数量为准备参考，可自行调整。
export function createPreparation():Preparation {
 const items:PrepItem[]=[];
 function add(id:string,name:string,category:Category,hospitalQty:string,homeQty:string,guidance:string,source='医院清单 + 月嫂机构',priority:PrepItem['priority']='basic',delivery:Delivery='both'){
  items.push({id,name,category,places:[...(hospitalQty?['hospital' as const]:[]),...(homeQty?['home' as const]:[])],delivery,priority,hospitalQty,homeQty,guidance,source,status:'unknown',packed:false,note:''});
 }
 add('documents','保健手册（社区小卡）与产检大卡','证件资料','各 1 份','','放在同一个证件袋，出发前检查。','医院清单');
 add('ids','夫妻双方身份证、医保卡','证件资料','按医院要求备齐','','证件放在容易拿到的位置。','医院清单');
 add('baby-hat','婴儿小帽','宝宝用品','1 顶','按出行需要','医院要求带入产房／手术室；在家睡眠时不戴帽，避免过热。','医院清单 + CDC 安全睡眠');
 add('baby-band','婴儿防盗腕带','宝宝用品','1 条','','先问医院领取还是自购，以及指定型号。','医院清单','confirm');
 add('underpads','产褥垫（60 × 90 cm）','妈妈用品','顺产 20 片；剖宫产 13 片','按住院剩余补充','顺产：产房 20 片；剖宫产：手术室 3 片 + 术后 10 片。家中可继续用剩余的。');
 add('blood-pads','计血量卫生巾','妈妈用品','顺产 2 片；剖宫产 7 片','','剖宫产：手术室 1 片 + 术后 6 片。先确认医院要求的款式。','医院清单','confirm');
 add('ice-pads','会阴冰敷垫','妈妈用品','4 片','','顺产清单列出，使用时机与方式听医护指导。','医院顺产清单','confirm','vaginal');
 add('monitor-belt','胎心监护带','妈妈用品','2 条','','已有的先核对是否符合要求，不重复购买。','医院清单');
 add('adult-pants','成人安睡裤','妈妈用品','15 条','按住院剩余补充','与产后卫生巾、内裤按实际需要搭配，避免重复大量囤货。');
 add('belly-band','腹带','妈妈用品','1 条，数量待核实','','剖宫产清单的手术室和术后各列 1 条，先问能否复用；使用听医护指导。','医院剖宫产清单','confirm','cesarean');
 add('bedpan','便盆','妈妈用品','1 个','','顺产清单列出，先确认医院型号与供应情况。','医院顺产清单','confirm','vaginal');
 add('mother-clothes','前开襟衣裤 / 月子服','妈妈用品','出院用 1 套','换洗总量参考 2～3 套','医院带出院衣物；家中总量包含这 1 套，按洗晒情况调整。');
 add('nursing-bra','哺乳内衣','妈妈用品','出院用 1 件','换洗总量参考 3～4 件','选择合身舒适、方便哺乳的款式；家中总量含住院这件。');
 add('slippers','防滑拖鞋 / 出院鞋','妈妈用品','1 双','可复用','用自己穿着舒服、防滑的鞋即可。');
 add('baby-clothes','宝宝衣服','宝宝用品','出院用 1～2 件','先备少量换洗','尺码与厚薄按宝宝实际情况及季节调整，不提前大量囤同一尺码。');
 add('wrap','宝宝包单 / 抱被','宝宝用品','出院用 1 条','可复用，按需补充','用于出院抱持与保暖；不要作为松散被褥留在婴儿睡眠区。','医院清单 + 月嫂机构 + CDC 安全睡眠');
 add('diapers','NB 纸尿裤','宝宝用品','1 包约 50 片，另单放 1 片','先少量，合适再补','医院入产房／手术室另取 1 片；机构的 NB、S 各 100 片不作为必囤量。');
 add('s-diapers','S 码纸尿裤','宝宝用品','','按尺码需要后补','不用按机构清单提前大量囤货。','月嫂机构','optional');
 add('pump','吸奶器','喂养用品','1 个','同一个带回家','医院清单列出；购买或租用、配件及清洁要求先向医院确认。','医院清单 + 月嫂机构','confirm');
 add('feeding-cup','喂奶杯','喂养用品','1～2 个','可复用','按医院指导选用和喂养；机构清单中的硅胶勺、量杯不额外重复必买。','医院清单 + 月嫂机构','confirm');
 add('formula','新生儿配方奶（备用）','喂养用品','1 小罐，先确认','按喂养需要再备','医院清单标为备用；先确认是否需要自备及适用规格，喂养方式听医护指导。','医院清单 + 月嫂机构','confirm');
 add('bottles','奶瓶及适龄奶嘴','喂养用品','已消毒 1～2 个（配奶备用）','与住院用品复用','是否使用按喂养需要与医院要求确认，不重复采购两套。','医院清单 + 月嫂机构','confirm');
 add('charger','充电线与充电宝','日常洗护','1 套','已有即可','出发前充好电，放在随身包。','医院清单');
 add('tissues','纸巾 / 云柔巾','日常洗护','3 包','按用量补充','产房所需可从总量中分装。');
 add('wipes','湿巾 / 棉柔巾','日常洗护','3 包','先少量备用','医院清单二选一，不需要各带 3 包；按用途、皮肤耐受选择。');
 add('face-towel','一次性洗脸巾','日常洗护','1 包','日常用量','已有日常用品可直接带。');
 add('basin','折叠盆 / 清洗盆','日常洗护','1 个','按用途分开','与家中宝宝洗脸、清洗用盆区分，避免重复购买。');
 add('straw-cup','水杯、吸管 / 吸管杯','日常洗护','1 套','带回家复用','医院清单有水杯、吸管和吸管杯，合并为一套。');
 add('water','饮用水','日常洗护','2 瓶','','顺产产房清单列出；饮食饮水是否允许以当班医护要求为准。','医院顺产清单','basic','vaginal');
 add('snacks','食物与运动饮料','日常洗护','按医院要求','','顺产清单：食物除巧克力，饮料忌红牛；先问能否进食饮水，不自行套用到手术。','医院顺产清单','confirm','vaginal');
 add('utensils','餐具与一次性纸杯','日常洗护','筷子、饭勺；纸杯 5～10 个','','勺子一并备好。','医院清单');
 add('towel','毛巾','日常洗护','1 条（参考）','已有即可','顺产产房清单列出，数量由你们按需要调整。','医院顺产清单','basic','vaginal');
 add('toiletries','牙刷、牙膏与自用洗护','日常洗护','1 套','已有即可','用已有用品分装，带漱口杯。');
 add('bags','收纳袋 / 脏衣袋','日常洗护','按需分装','可复用','证件、产房物品、病房用品分开收纳。');
 add('placenta-bags','胎盘自留用袋','日常洗护','顺产清单列 2 个','','仅在决定自留且医院同意时准备；具体要求问医院。','医院清单','optional');
 add('underwear','一次性内裤 / 舒适内裤','妈妈用品','少量备用','按实际需要补充','机构列 30～40 条，这里不默认大量采购；与安睡裤搭配选择。','月嫂机构','optional');
 add('regular-pads','产后卫生巾','妈妈用品','','先少量备用','与安睡裤按需要搭配；医院指定的计血量卫生巾单独准备。','月嫂机构','optional');
 add('peri-bottle','会阴冲洗器','妈妈用品','按需 1 个','同一个复用','是否适用、如何清洁使用，先问医护。','月嫂机构','optional');
 add('toilet-cover','一次性马桶垫','日常洗护','按需 1 包','','按住院需求选择。','月嫂机构','optional');
 add('nursing-pillow','哺乳枕 / 孕妇枕','妈妈用品','','按需 1 个','供成人支撑使用，不放入宝宝睡眠区。','月嫂机构 + CDC 安全睡眠','optional');
 add('nipple-cream','乳头护理用品','妈妈用品','','有需要再选','不默认孕期开始使用；出现疼痛或皲裂先咨询医护及评估哺乳姿势。','月嫂机构（使用方式不照搬）','optional');
 add('breast-pads','防溢乳垫','妈妈用品','','先备 1 小包','按溢乳情况补充。','月嫂机构','optional');
 add('milk-bags','储奶袋','喂养用品','','有储奶需要再买','按实际储奶量选择，不提前大量囤货。','月嫂机构','optional');
 add('changing-pad','隔尿垫','宝宝用品','','先少量备用','一次性或可水洗款按需要选择，医院剩余产褥垫可酌情复用。','月嫂机构');
 add('cord-care','脐部护理用品','宝宝用品','','先问医院','碘伏棉签、护脐贴等不默认必买；用品和护理方法以出院指导为准。','月嫂机构','confirm');
 add('cotton-swabs','婴儿棉签','宝宝用品','','按需','仅作外部清洁，不伸入耳道或鼻腔。','月嫂机构','optional');
 add('nail-clippers','婴儿指甲剪','宝宝用品','','1 把','选择适合婴儿、方便安全操作的款式。','月嫂机构');
 add('thermometer','体温计','宝宝用品','','1 个','按医护建议选择适龄测温方式，不指定品牌。','月嫂机构');
 add('vitamins','维生素 D / AD 方案','宝宝用品','','出院时确认','记录医生建议的品种与剂量，不默认两种一起买或照机构清单服用。','月嫂机构','confirm');
 add('towels','宝宝浴巾、口水巾','日常洗护','','浴巾 2～3 条；口水巾 4～6 条（参考）','按洗晒情况增减，口水巾睡前取下。','月嫂机构 + NHS');
 add('baby-wash','婴儿洗浴用品','日常洗护','','先备少量','按实际需要选择温和产品，不默认把面霜、身体乳、抚触油、桃子水全部买齐。','月嫂机构');
 add('baby-moisturizer','婴儿保湿用品','日常洗护','','按需 1 件','面部和身体是否需分开，按实际皮肤情况选择。','月嫂机构','optional');
 add('diaper-cream','护臀用品','日常洗护','','按需 1 支','按实际皮肤情况选择；出现破损、持续红疹时咨询医护。','月嫂机构','optional');
 add('bath','宝宝浴盆','日常洗护','','1 个','浴网、水温计按需要搭配；洗澡全程由成人看护。','月嫂机构');
 add('laundry','衣物清洁与晾晒用品','日常洗护','','现有设备优先','清洁剂、衣架按需补；独立婴儿洗衣机、落地架不列为必需。','月嫂机构');
 add('nightlight','柔光小夜灯','日常洗护','','按需 1 个','方便夜间照看，避免直射宝宝眼睛。','月嫂机构','optional');
 add('bottle-brush','奶瓶刷与清洗用品','喂养用品','','使用奶瓶时备 1 套','奶瓶使用后清洗，按产品说明清洁与消毒。','月嫂机构 + CDC 奶具清洁','optional');
 add('sterilization','奶具消毒方式 / 设备','喂养用品','','先确认一种可行方式','根据用品耐热性与厂家说明，可选择煮沸或蒸汽等；不默认必须买消毒柜。','月嫂机构 + CDC 奶具清洁','optional');
 add('kettle','烧水设备 / 恒温壶','喂养用品','','现有设备优先','是否添置按喂养需要决定；配方奶冲调按产品说明及医护指导，不把恒温水直接等同于适宜冲调水。','月嫂机构','optional');
 add('warmer','温奶器','喂养用品','','有需要再买','与恒温壶、消毒柜分别判断，不默认整套添置。','月嫂机构','optional');
 add('pacifier','安抚奶嘴','喂养用品','','按需','母乳喂养时，可待喂养建立后再考虑；不作为出生前必买。','月嫂机构 + CDC 安全睡眠','optional');
 add('sleep-space','婴儿床 / 独立睡眠空间','睡眠出行','','1 处','坚实、平坦的睡眠表面，与家长同房；不放枕头、床围、松散被褥或玩偶。','月嫂机构 + CDC 安全睡眠');
 add('fitted-sheets','合适床垫与贴合床单','睡眠出行','','按床尺寸；床单备换洗','床垫与床体贴合，不另外铺软垫；床单紧贴床垫。','NHS + CDC 安全睡眠');
 add('sleep-bag','合身睡袋','睡眠出行','','按需 1～2 件','按身高、室温选择，不追求厚重；不作为宽松被褥使用。','月嫂机构 + NHS','optional');
 add('socks','宝宝袜子与外出保暖衣物','宝宝用品','','按季节少量准备','按实际温度调整，家中不默认戴帽或围肚围。','月嫂机构','optional');
 add('car-seat','适合新生儿的安全座椅','睡眠出行','乘车出院前安装好','车内长期使用','如乘车回家，提前核对适用身高体重与后向安装要求；“已装包”表示已装车备好。','月嫂机构 + NHS','basic');
 add('stroller','婴儿推车','睡眠出行','','按需 1 辆','新生儿使用时核对适龄和可平躺要求，结合家中空间选择。','月嫂机构 + NHS','optional');
 add('changing-table','尿布台 / 换尿布位置','睡眠出行','','准备安全、方便的位置','不一定购买独立尿布台；用品放在成人伸手可及处。','月嫂机构','optional');
 add('storage-cart','收纳推车','睡眠出行','','按空间需要','已有收纳可以继续使用。','月嫂机构','optional');
 add('diaper-bag','外出妈咪包','睡眠出行','','现有包可复用','能分装纸尿裤、换洗衣物即可。','月嫂机构','optional');
 add('toys','黑白卡 / 摇铃 / 安抚玩具','宝宝用品','','后续按需添置','不放入宝宝睡眠区，无需一次买齐。','月嫂机构 + CDC 安全睡眠','optional');
 return {catalogVersion:1,delivery:'both',items};
}
