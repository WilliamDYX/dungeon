// lore.js - 剧情卷轴系统（隐藏剧情文本池、随机抽取、弹窗展示）
// 每个玩家读到的剧情不同：从未读池里随机抽，读过的 id 记入存档不再出现。

// ===== 剧情文本池 =====
// 每条: { id, title, body }
// body 用 \n 分段。文本风格围绕地牢世界观、暗影之王、次元裂隙等。
const LORE_POOL = [
  { id:'lore_001', title:'褪色的日记残页',
    body:'..."第七十三天。火把快烧完了，但暗影之王的心脏还在跳动。\n我听到了——它在呼唤我的名字。\n也许成为它的一部分，并不是终点..."\n\n纸页的边角已被烧焦，字迹潦草而绝望。' },
  { id:'lore_002', title:'铁匠的账本',
    body:'王城军需清单：附魔长剑 ×200，破魔盾 ×50。\n备注：全部送往"地牢镇压部队"。日期是三百年前。\n\n这一页的墨水是红色的。' },
  { id:'lore_003', title:'祭司的忏悔录',
    body:'我欺骗了所有人。圣光从未真正净化这座地牢——\n它只是把黑暗封存得更深。\n每一次"祝福"，都是在喂养深渊。\n神啊，若你听得见，请原谅我。' },
  { id:'lore_004', title:'星图碎片',
    body:'一张精密的星图，标注着某颗坠落的"暗星"。\n旁注：当此星与地牢第七层共鸣之时，\n次元裂隙将彻底洞开。\n\n那颗星的位置，被人用血涂掉了。' },
  { id:'lore_005', title:'孩童的涂鸦',
    body:'歪歪扭扭的蜡笔画：一个小人，举着剑，\n对面是一个巨大的黑色身影。\n小人头顶写着"爸爸"。\n黑色身影的胸口，画着一颗金色的心。' },
  { id:'lore_006', title:'法师的实验笔记',
    body:'灵魂碎片实验记录：第 47 次尝试。\n将活体灵魂剥离并封存于次元裂隙——成功。\n副作用：实验体失去所有记忆，但保留了...笑容？\n这不对。这不对。' },
  { id:'lore_007', title:'布满灰尘的王谕',
    body:'奉国王之命：即日起，封锁地牢所有入口。\n任何人不得进入，亦不得离开。\n"那里的东西，不是我们能理解的。"\n——签署于王国覆灭前夜。' },
  { id:'lore_008', title:'盗贼的遗书',
    body:'别相信那些商人！他们不是人。\n我在霜语的眼睛里，看到了星空——\n真正的星空，不是倒影。\n他们都是从裂隙那一边来的。\n我要逃...如果我还跑得动的话。' },
  { id:'lore_009', title:'褪色的地图',
    body:'一张地牢全图，但第十层以下全是空白。\n边缘写着颤抖的字：\n"再下面就不是地牢了。\n那是它的胃。"' },
  { id:'lore_010', title:'诗人的断章',
    body:'当暗影吞噬最后的火光，\n当英雄的名字被风埋葬，\n唯有那颗不肯熄灭的心，\n在深渊之底，独自发烫。\n\n诗的结尾被撕掉了。' },
  { id:'lore_011', title:'炼金术士的配方',
    body:'生命药剂配方：月光草 ×3，银蛇胆 ×1，\n以及——一滴未堕落的英雄之血。\n注：最后一味材料早已绝迹。\n难怪现在的药剂，总差点意思。' },
  { id:'lore_012', title:'守墓人的留言',
    body:'我又埋了一个。这是这个月的第六个。\n他们都是笑着死的——说在黑暗里看见了光。\n但我检查过，他们的瞳孔是黑色的。\n到底什么才是"光"？' },
  { id:'lore_013', title:'古老的符文碑文',
    body:'碑文已被磨损，只能辨认出几个字：\n"...王...心脏...不要...取出...否则..."\n\n剩下的，被刻意凿去了。' },
  { id:'lore_014', title:'商人的私账',
    body:'进价：金币 ×1（裂隙那边几乎免费）。\n售价：金币 ×30。\n利润率：2900%。\n这些冒险者真是什么都信。\n——附：星辰又问我要灵魂了，烦。' },
  { id:'lore_015', title:'幸存者的信',
    body:'如果你读到这封信，说明你比我走得更远。\n请记住：暗影之王不是要杀你。\n它是要成为你。\n当你在镜子里看不清自己的眼睛时——已经太晚了。' },
  { id:'lore_016', title:'疯王的涂鸦墙',
    body:'满墙都是同一句话，重复了上千遍：\n"它是心脏。它是心脏。它是心脏。\n地牢是身体。怪物是免疫。\n我们是食物。我们是食物。"\n\n字迹越来越深，最后刻进了石墙里。' },
  { id:'lore_017', title:'预言者的话',
    body:'被撕碎的羊皮纸，拼凑出一句预言：\n"当无名的勇者取回金色的心，\n暗影将重获它的形体——\n而勇者，将戴上它褪下的王冠。"\n谁是无名的勇者？' },
  { id:'lore_018', title:'佣兵的合同',
    body:'任务：深入地牢，取回某物件。\n报酬：终身荣耀，或等额金币 10000。\n备注：雇主拒绝透露物件内容。\n签字栏是空的。没人接这单。' },
  { id:'lore_019', title:'一本残破的诗集',
    body:'扉页题字：献给我的爱人，她去了地牢，再没回来。\n翻开内页，每一首诗的标题都是同一个名字。\n最后一个标题旁边，画着一颗黑色的心。' },
  { id:'lore_020', title:'最后的记载',
    body:'这是地牢图书馆的最后一本书。\n其它书都自己烧毁了，只剩下这一本。\n它没有字。每一页都是镜子。\n你看着它，它看着你。\n你在笑吗？' },
];

// ★ 特殊剧情：堕天使揭秘（第10层后才会被抽取，读完解锁堕天使出现）
const LORE_FALLEN_ANGEL = {
  id:'lore_fallen_angel',
  title:'堕天使的契约',
  unlock:'fallenAngel',
  body:'卷轴发出灼热的金光，文字自行浮现：\n\n"我曾是最耀眼的天使，路西菲尔。\n为对抗暗影之王，我堕入深渊，\n却反被黑暗吞噬，成为它的守门人。\n\n若你能读到这里，说明你已深入地牢第十层之下。\n我会出现在某条走廊的尽头。\n\n击败我，裂隙便会为你洞开——\n你可以选择逃出地牢，重见天日。\n但记住，光明从未真正属于过逃兵。"\n\n卷轴化为金粉，融入你的血脉。',
};

// 抽取一条未读剧情；全部读完后重置（让玩家继续能拾取）
function pickLore(){
  // 第10层后，优先抽堕天使解锁剧情（若尚未触发）
  if(floor>=10 && !fallenAngelUnlocked && !readLoreIds.includes(LORE_FALLEN_ANGEL.id)){
    return LORE_FALLEN_ANGEL;
  }
  let avail = LORE_POOL.filter(l => !readLoreIds.includes(l.id));
  if(avail.length===0){
    // 全读过了，重置已读记录，重新开始抽
    readLoreIds = [];
    avail = LORE_POOL.slice();
  }
  return avail[rand(0, avail.length-1)];
}

// 记录已读
function markLoreRead(id){
  if(!readLoreIds.includes(id)){
    readLoreIds.push(id);
    try { SAFE_STORE.set('ds_readLore', JSON.stringify(readLoreIds)); } catch(e){}
  }
}

// ===== 剧情弹窗展示 =====
function showLoreScroll(lore){
  markLoreRead(lore.id);
  // 处理解锁型剧情
  if(lore.unlock==='fallenAngel' && !fallenAngelUnlocked){
    fallenAngelUnlocked = true;
    try { SAFE_STORE.set('ds_fallenAngel','1'); } catch(e){}
    addMsg('✦ 一股神秘的力量在你体内觉醒...堕天使的契约已生效 ✦','special');
  }
  const overlay = document.getElementById('lore-overlay');
  if(!overlay){ return; } // 容错：DOM 未就绪
  document.getElementById('lore-title').textContent = '📜 ' + lore.title;
  const body = document.getElementById('lore-body');
  body.innerHTML = lore.body.split('\n').map(l => l==='' ? '<br>' : escapeHtml(l)).join('<br>');
  overlay.classList.add('show');
  // 暂停游戏交互（避免弹窗时被怪打）
  actionDelay = Math.max(actionDelay, 1);
}

function closeLoreScroll(){
  const overlay = document.getElementById('lore-overlay');
  if(overlay) overlay.classList.remove('show');
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
