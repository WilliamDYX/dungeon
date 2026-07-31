// game.js - 游戏流程：教程、楼层名/剧情事件、NPC生成、楼层初始化、重启、存档、游戏结束、冷却图标绘制

// ---- Tutorial & Story ----
let tutorialStep=0;
const tutorialData=[
  {
    title:'序章 · 暗影苏醒',
    content:`<div class="story-text">
      <p>你从昏迷中醒来，四周是一片黑暗的地牢。<span>潮湿的石壁</span>散发着霉味，远处传来水滴的声音。</p><br>
      <p>你是<span>阿尔德里克</span>，王国的骑士团长。三天前，你率队追查一股暗影能量，却被陷阱困在了这古老的<span>暗影地牢</span>中。</p><br>
      <p>你必须找到通往更深处的路，揭开地牢的秘密，并活着回到地面。</p>
    </div>`,
    btn:'继续',
  },
  {
    title:'基础操作',
    content:`<div class="story-text">
      <p>使用以下操作在暗影地牢中生存：</p>
    </div>
    <table class="controls-table">
      <tr><td>方向键 / WASD</td><td>移动角色</td></tr>
      <tr><td>空格</td><td>等待一回合</td></tr>
      <tr><td>F / 左键</td><td>射箭 - 朝光标方向远程攻击</td></tr>
      <tr><td>右键</td><td>NPC对话 - 靠近NPC右键点击打开聊天</td></tr>
      <tr><td>1</td><td>闪电链 - 弹跳闪电攻击（3秒CD）</td></tr>
      <tr><td>2</td><td>冰霜新星 - 冻结周围敌人（8秒CD）</td></tr>
      <tr><td>3</td><td>生命汲取 - 远程吸血攻击（5秒CD）</td></tr>
      <tr><td>Q</td><td>旋风斩 - 近战范围攻击</td></tr>
      <tr><td>R</td><td>火球术 - 爆炸火球（15秒CD）</td></tr>
      <tr><td>T</td><td>治愈术 - 恢复50%生命（15秒CD）</td></tr>
      <tr><td>G</td><td>拾取物品</td></tr>
      <tr><td>E</td><td>与商人/祭坛互动</td></tr>
      <tr><td>B</td><td>灵魂祭坛 - 永久强化</td></tr>
      <tr><td>&gt; / .</td><td>下到下一层</td></tr>
      <tr><td>P</td><td>存档 - 保存当前进度</td></tr>
      <tr><td>L</td><td>读档 - 读取已保存进度</td></tr>
      <tr><td>0</td><td>删除存档 - 清除本地进度</td></tr>
    </table>
    <div class="gesture-warning">⚠ 若右键打开NPC对话无效：请先关闭浏览器的「鼠标手势」插件/功能（或长按右键手势、超级拖拽等），否则右键事件会被浏览器拦截。</div>`,
    btn:'了解了',
  },
  {
    title:'生存指南',
    content:`<div class="story-text">
      <p><span>生命药剂</span> - 恢复8点生命值</p>
      <p><span>力量药剂</span> - 永久提升1点攻击力</p>
      <p><span>神秘卷轴</span> - 恢复少量生命值</p>
      <p><span>金币</span> - 向商人购买装备和技能</p><br>
      <p><span>商人</span> - 按 E 可购买武器/法杖/技能</p>
      <p><span>祭坛</span> - 按 E 互动，可能获得治疗或属性</p>
      <p><span>尖刺陷阱</span> - 小心脚下！</p><br>
      <p>每击败 <span>3</span> 个怪物即可升级！提升攻击、防御和生命上限！</p>
      <p><span>灵魂碎片</span> - 击败Boss获得，死亡不消失，按 B 永久强化</p><br>
      <p><span>初始技能</span>（按对应键释放）：</p>
      <p><span>[1] 闪电链</span> - 朝面朝方向释放5格闪电，命中后自动弹跳至5格内下一个敌人（3秒CD）</p>
      <p><span>[2] 冰霜新星</span> - 冻结周围1格内敌人1.5秒并造成少量伤害（8秒CD）</p>
      <p><span>[3] 生命汲取</span> - 发射吸血弹，命中回复50%伤害（5秒CD）</p><br>
      <p><span>存档系统</span>：</p>
      <p><span>P</span> 随时手动存档；<span>L</span> 读取存档；<span>0</span> 删除本地存档</p>
      <p>下楼、升级也会自动存档。死亡会清除进度存档（灵魂碎片仍会保留）。</p>
    </div>`,
    btn:'准备出发',
  },
  {
    title:'命运的召唤',
    content:`<div class="story-text">
      <p>传说这座地牢深处封印着远古的<span>暗影之王</span>。每五层，你都会遇到强大恶魔的阻挠。</p><br>
      <p>每下一层，暗影能量越强，怪物也会更加危险。</p><br>
      <p>祝你好运，骑士。<span>愿光明指引你的道路。</span></p>
    </div>`,
    btn:'开始冒险',
  },
];

function startTutorial(){
  tutorialStep=0;
  document.getElementById('tutorial-overlay').classList.add('show');
  showTutorialStep();
}

function showTutorialStep(){
  const data=tutorialData[tutorialStep];
  document.getElementById('tutorial-title').textContent=data.title;
  document.getElementById('tutorial-content').innerHTML=data.content;
  document.getElementById('tutorial-progress').textContent=`${tutorialStep+1} / ${tutorialData.length}`;
  document.getElementById('tutorial-btn').textContent=data.btn;
}

function nextTutorialStep(){
  tutorialStep++;
  if(tutorialStep>=tutorialData.length){
    document.getElementById('tutorial-overlay').classList.remove('show');
    addMsg('欢迎来到暗影地牢，勇敢的骑士！','special');
    return;
  }
  showTutorialStep();
}

const floorNames=[
  '遗忘之厅',
  '暗影回廊',
  '深渊前室',
  '灵魂墓穴',
  '恶魔巢穴',
  '诅咒之桥',
  '白骨之庭',
  '血池深殿',
  '迷宫之心',
  '暗影王座',
];

function getFloorName(f){
  if(f<=floorNames.length)return floorNames[f-1];
  if(f%5===0)return `暗影核心 - 第${f}层`;
  let name=`无尽深渊 - 第${f}层`;
  if(floorCurse)name+=` [${floorCurse.name}]`;
  return name;
}

function showFloorTitle(){
  const name=getFloorName(floor);
  addMsg(`━━━ ${name} ━━━`,'special');
  floorTitleTimer=120;
}

function checkStoryEvent(){
  if(floor===2)addMsg('你闻到一股腐臭的气息...这地牢远比想象的要深。','info');
  if(floor===3)addMsg('墙上出现了一些古老的符文，散发着微弱的光芒。','info');
  if(floor===5&&!gameOver){
    addMsg('⚡ 地面开始震颤！暗影之王的力量在增强...','warning');
    setTimeout(()=>addMsg('远处的咆哮声回荡在走廊中...','warning'),500);
  }
  if(floor===7)addMsg('空气中弥漫着血腥味...你离真相越来越近了。','info');
  if(floor===10&&!gameOver){
    addMsg('🔥 空气变得灼热！你接近了暗影的核心...','warning');
    setTimeout(()=>addMsg('墙上古老的符文开始发光，指引着前路。','info'),500);
  }
}
// ---- Init ----
function spawnNPCs(){
  npcs=[];
  if(floor<2)return;
  const types=[];
  if(floor>=2)types.push('weaponsmith');
  if(floor>=3)types.push('staffmaster');
  if(floor>=4)types.push('skillmaster');
  if(floor>=5)types.push('healer');
  if(floor>=7)types.push('enchanter');
  if(types.length===0)return;
  const count=Math.min(types.length,rand(2,3));
  const shuffled=types.sort(()=>Math.random()-0.5);
  for(let i=0;i<count&&i<rooms.length-1;i++){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    const type=shuffled[i];
    const npc={x,y,type,shop:[]};
    const floorBonus=Math.floor(floor/3);
    const costMul=1+floorBonus*0.2;
    if(type==='weaponsmith'){
      npc.name='铁匠·锻钢';
      npc.shop=[
        {id:'atk1',name:'磨刀石',desc:'攻击力+1',cost:Math.floor(10*costMul),effect:()=>{player.atk+=1;addMsg('攻击力+1！','special')}},
        {id:'atk2',name:'精钢长剑',desc:'攻击力+2',cost:Math.floor(25*costMul),effect:()=>{player.atk+=2;addMsg('攻击力+2！','special')}},
        {id:'atk3',name:'暗影之刃',desc:'攻击力+3',cost:Math.floor(45*costMul),effect:()=>{player.atk+=3;addMsg('攻击力+3！','special')}},
        {id:'atk4',name:'龙牙大刀',desc:'攻击力+5（深层限定）',cost:Math.floor(80*costMul),effect:()=>{player.atk+=5;addMsg('攻击力+5！','special')}},
      ];
    }else if(type==='staffmaster'){
      npc.name='法杖师·霜语';
      npc.shop=[
        {id:'hp1',name:'生命法杖',desc:'最大生命+5',cost:Math.floor(12*costMul),effect:()=>{player.maxHp+=5;player.hp+=5;addMsg('最大生命+5！','heal')}},
        {id:'hp2',name:'坚韧法杖',desc:'最大生命+10',cost:Math.floor(28*costMul),effect:()=>{player.maxHp+=10;player.hp+=10;addMsg('最大生命+10！','heal')}},
        {id:'hp3',name:'不朽法杖',desc:'最大生命+15',cost:Math.floor(55*costMul),effect:()=>{player.maxHp+=15;player.hp+=15;addMsg('最大生命+15！','heal')}},
        {id:'def1',name:'守护法杖',desc:'防御力+2',cost:Math.floor(20*costMul),effect:()=>{player.def+=2;addMsg('防御力+2！','special')}},
      ];
    }else if(type==='skillmaster'){
      npc.name='贤者·预言';
      npc.shop=[
        {id:'skill_fire',name:'火球术卷轴',desc:'R键 - 发射爆炸火球（2秒CD）',cost:Math.floor(30*costMul),effect:()=>{const i=getSkillIndex('fireball');if(i>=0){skillSlots[i].unlocked=true;addMsg('学会火球术！按 R 释放！','special');saveGame()}}},
        {id:'skill_heal',name:'治愈术卷轴',desc:'T键 - 恢复50%生命（15秒CD）',cost:Math.floor(25*costMul),effect:()=>{const i=getSkillIndex('heal');if(i>=0){skillSlots[i].unlocked=true;addMsg('学会治愈术！按 T 释放！','special');saveGame()}}},
      ];
    }else if(type==='healer'){
      npc.name='祭司·圣光';
      npc.shop=[
        {id:'cure1',name:'圣光治愈',desc:'恢复50%生命值',cost:Math.floor(8*costMul),effect:()=>{
          const h=Math.floor(player.maxHp*0.5);const a=Math.min(h,player.maxHp-player.hp);
          if(a>0){player.hp+=a;spawnHealParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2);addMsg(`恢复 ${a} 点生命！`,'heal')}
          else addMsg('生命值已满','info');
        }},
        {id:'cure2',name:'完全恢复',desc:'恢复全部生命值',cost:Math.floor(20*costMul),effect:()=>{
          const a=player.maxHp-player.hp;
          if(a>0){player.hp=player.maxHp;spawnHealParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2);addMsg('完全恢复！','heal');spawnLevelUpParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2)}
          else addMsg('生命值已满','info');
        }},
        {id:'bless',name:'圣光祝福',desc:'临时提升攻击+2（持续当前层）',cost:Math.floor(15*costMul),effect:()=>{
          player.atk+=2;addMsg('受到圣光祝福，攻击力+2！','special');
        }},
      ];
      if(floor>=8){
        npc.shop.push({id:'poisonMask',name:'🛡 防毒面罩',desc:'免疫当前层的毒雾伤害',cost:Math.floor(18*costMul),effect:()=>{
          poisonMaskActive=true;addMsg('戴上防毒面罩，毒雾无法侵蚀你！','special');
        }});
      }
    }else if(type==='enchanter'){
      npc.name='附魔师·星辰';
      npc.shop=[
        {id:'encAtk',name:'锋锐附魔',desc:'攻击力+2',cost:Math.floor(22*costMul),effect:()=>{player.atk+=2;addMsg('武器被附魔，攻击力+2！','special')}},
        {id:'encDef',name:'铁壁附魔',desc:'防御力+2',cost:Math.floor(22*costMul),effect:()=>{player.def+=2;addMsg('铠甲被附魔，防御力+2！','special')}},
        {id:'encHp',name:'活力附魔',desc:'最大生命+10',cost:Math.floor(18*costMul),effect:()=>{player.maxHp+=10;player.hp+=10;addMsg('获得活力附魔，生命+10！','heal')}},
        {id:'encDual',name:'双刃附魔',desc:'攻击+3 防御-1（高风险）',cost:Math.floor(35*costMul),effect:()=>{player.atk+=3;player.def=Math.max(0,player.def-1);addMsg('双刃附魔完成！攻击+3，防御-1！','warning')}},
      ];
    }
    npcs.push(npc);
  }
}

function initFloor(){
  entities=[];items=[];particles=[];floatTexts=[];projectiles=[];npcs=[];slashEffects=[];
  generateDungeon();spawnPlayer();spawnEnemies();spawnItems();spawnNPCs();
  updateFOV(player.x,player.y,fovRadius());
  showFloorTitle();
}

function restartGame(){
  if(npcChatState.open)closeNPCChat();
  document.getElementById('npc-chat-overlay').classList.remove('show');
  document.getElementById('game-over-overlay').classList.remove('show');
  document.getElementById('level-up-notification').classList.remove('show');
  gameOver=false;floor=1;kills=0;turnCount=0;
  enemyIdCounter=0;bossWarning=false;actionDelay=0;floorTitleTimer=0;bossDefeated=false;
  poisonMaskActive=false;
  entities=[];items=[];particles=[];floatTexts=[];projectiles=[];msgHistory=[];npcs=[];slashEffects=[];
  // 重置技能槽并绑定效果函数
  const skillInit=[playerChainLightning,playerFrostNova,playerLifeDrain,playerSpecialAttack,castFireball,castHeal];
  for(let i=0;i<skillSlots.length;i++){
    skillSlots[i].cd=0;
    skillSlots[i].unlocked=i<4;
    skillSlots[i].effect=skillInit[i]||null;
  }

  npcChatState = {open:false,npc:null,npcType:null,messages:[],typing:false,triggeredEvents:{},discount:0,bargainCooldown:0,lastBargainResult:null};
  player={hp:30,maxHp:30,atk:6,def:2,level:1,kills:0,gold:0,nextLevel:3};
  initFloor();
  addMsg('重新开始挑战！','special');
  if(window.firstStart===undefined){window.firstStart=false;startTutorial()}
  else{
    addMsg('欢迎回到暗影地牢！','special');
    addMsg(`灵魂碎片: ${soulShards} | 按 B 打开灵魂祭坛`,'special');
  }
}

// ★★★ 存档系统 ★★★
// 完整快照存档：保存地图、怪物、物品、NPC、视野、玩家位置等全部布局，
// 读档后还原同一张地图，保证进度完全一致。
function saveGame(){
  if(!player||player.x===undefined)return false;
  try{
    const data={
      v:2,
      floor:floor,kills:kills,turnCount:turnCount,enemyIdCounter:enemyIdCounter,
      bossWarning:bossWarning,bossDefeated:bossDefeated,
      floorCurseId:floorCurse?floorCurse.id:null,
      player:{
        x:player.x,y:player.y,vx:player.vx,vy:player.vy,
        hp:player.hp,maxHp:player.maxHp,atk:player.atk,def:player.def,
        level:player.level,gold:player.gold,nextLevel:player.nextLevel||3,
        bombs:player.bombs||0,moveStreak:player.moveStreak||0,
      },
      playerKills:player.kills||0,
      skillSlots:skillSlots.map(s=>({id:s.id,unlocked:s.unlocked})),
      souls:{soulShards,soulBonusAtk,soulBonusDef,soulBonusHp},
      // 地图布局
      map:map,explored:explored,
      // 怪物（剔除瞬时渲染字段）
      entities:entities.map(e=>({
        id:e.id,x:e.x,y:e.y,type:e.type,
        hp:e.hp,maxHp:e.maxHp,atk:e.atk,def:e.def,
        detectRange:e.detectRange,elite:!!e.elite,attackCd:e.attackCd||0,
        dead:!!e.dead,
      })),
      // 物品
      items:items.map(it=>{const c={x:it.x,y:it.y,type:it.type};for(const k in it)if(k!=='x'&&k!=='y'&&k!=='type')c[k]=it[k];return c;}),
      // NPC
      npcs:npcs.map(n=>{const c={x:n.x,y:n.y,type:n.type,name:n.name};if(n.shop)c.shop=n.shop;if(n.discount)c.discount=n.discount;return c;}),
      ts:Date.now(),
    };
    SAFE_STORE.set(SAVE_KEY,JSON.stringify(data));
    return true;
  }catch(e){
    console.warn('[存档] 保存失败:',e);
    return false;
  }
}

function hasSave(){
  const raw=SAFE_STORE.get(SAVE_KEY);
  if(!raw)return false;
  try{ const d=JSON.parse(raw); return d&&d.player&&d.map&&d.floor!==undefined; }
  catch(e){ return false; }
}

function clearSave(){
  SAFE_STORE.remove(SAVE_KEY);
}

function loadGame(){
  const raw=SAFE_STORE.get(SAVE_KEY);
  if(!raw)return false;
  let data;
  try{ data=JSON.parse(raw); }catch(e){ return false; }
  if(!data||!data.player||!data.map)return false;

  // 应用永久魂加成
  soulShards=data.souls?data.souls.soulShards:soulShards;
  soulBonusAtk=data.souls?data.souls.soulBonusAtk:soulBonusAtk;
  soulBonusDef=data.souls?data.souls.soulBonusDef:soulBonusDef;
  soulBonusHp=data.souls?data.souls.soulBonusHp:soulBonusHp;

  // 重建基础状态
  gameOver=false;
  floor=data.floor||1;kills=data.kills||0;turnCount=data.turnCount||0;
  enemyIdCounter=data.enemyIdCounter||0;
  bossWarning=!!data.bossWarning;actionDelay=0;floorTitleTimer=0;bossDefeated=!!data.bossDefeated;
  particles=[];floatTexts=[];projectiles=[];msgHistory=[];slashEffects=[];
  npcChatState={open:false,npc:null,npcType:null,messages:[],typing:false,triggeredEvents:{},discount:0,bargainCooldown:0,lastBargainResult:null};
  // 还原技能（向后兼容旧存档）并重新绑定效果函数
  const skillInit=[playerChainLightning,playerFrostNova,playerLifeDrain,playerSpecialAttack,castFireball,castHeal];
  for(let i=0;i<skillSlots.length;i++){
    skillSlots[i].cd=0;
    skillSlots[i].unlocked=i<4;
    skillSlots[i].effect=skillInit[i]||null;
  }
  if(data.skillSlots){
    for(const sd of data.skillSlots){
      const idx=getSkillIndex(sd.id);
      if(idx>=0)skillSlots[idx].unlocked=sd.unlocked;
    }
  }else if(data.skills){
    const fi=getSkillIndex('fireball');if(fi>=0&&data.skills.fireball)skillSlots[fi].unlocked=true;
    const hi=getSkillIndex('heal');if(hi>=0&&data.skills.heal)skillSlots[hi].unlocked=true;
  }

  // 还原诅咒
  if(data.floorCurseId){
    floorCurse=CURSES.find(c=>c.id===data.floorCurseId)||null;
  }else{
    floorCurse=null;
  }
  applyCurseEffect();

  // 还原玩家
  const p=data.player;
  player={
    x:p.x,y:p.y,vx:p.vx!==undefined?p.vx:p.x*TILE,vy:p.vy!==undefined?p.vy:p.y*TILE,
    hp:p.hp,maxHp:p.maxHp,atk:p.atk,def:p.def,
    level:p.level,gold:p.gold,nextLevel:p.nextLevel||3,
    bombs:p.bombs||0,moveStreak:p.moveStreak||0,
    kills:data.playerKills||0,stutterX:0,stutterY:0,
  };

  // 还原地图与视野
  map=data.map;
  explored=data.explored||[];
  visible=[];
  for(let y=0;y<MAP_H;y++){
    visible[y]=new Array(MAP_W).fill(false);
  }
  // 重新计算当前可见范围（基于已探索区域）
  if(player.x!==undefined&&player.y!==undefined&&map[player.y]&&map[player.y][player.x]!==undefined){
    updateFOV(player.x,player.y,fovRadius());
  }

  // 还原怪物
  entities=(data.entities||[]).map(e=>({
    id:e.id,x:e.x,y:e.y,type:e.type,
    hp:e.hp,maxHp:e.maxHp,atk:e.atk,def:e.def,
    detectRange:e.detectRange||5,hitFlash:0,dead:!!e.dead,
    animOffset:randF(0,Math.PI*2),elite:!!e.elite,attackCd:e.attackCd||0,
  }));

  // 还原物品
  items=(data.items||[]).map(it=>Object.assign({},it));

  // 还原NPC
  npcs=(data.npcs||[]).map(n=>{const c={x:n.x,y:n.y,type:n.type,name:n.name};if(n.shop)c.shop=n.shop;if(n.discount)c.discount=n.discount;return c;});

  updateUI();
  addMsg(`继续探索 - 第 ${floor} 层`,'special');
  addMsg(`灵魂碎片: ${soulShards} | 按 B 打开灵魂祭坛`,'special');
  return true;
}

function showGameOver(){
  if(npcChatState.open)closeNPCChat();
  document.getElementById('final-floor').textContent=floor;
  document.getElementById('final-kills').textContent=kills;
  document.getElementById('final-level').textContent=player.level;
  document.getElementById('final-gold').textContent=player.gold;
  document.getElementById('game-over-overlay').classList.add('show');
  const pEl=document.querySelector('#game-over-overlay p');
  const soulLine=document.createElement('p');
  soulLine.style.cssText='color:#ce93d8;font-size:13px;margin-top:6px';
  soulLine.textContent=`灵魂碎片: ${soulShards} (已永久保存在次元裂隙中)`;
  pEl.parentNode.insertBefore(soulLine,pEl.nextSibling);
  clearSave(); // 死亡清除进度存档（灵魂碎片已单独保存，不会丢失）
  spawnParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2,'#ef5350',30,{spread:3});
  spawnParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2,'#ff5252',20,{spread:2,gravity:-0.05});
  screenShake=12;
}

// ★ 胜利结局：击败堕天使，逃出地牢
function showVictory(){
  if(npcChatState.open)closeNPCChat();
  gameOver=true;
  bossDefeated=true;
  document.getElementById('victory-floor').textContent=floor;
  document.getElementById('victory-kills').textContent=kills;
  document.getElementById('victory-level').textContent=player.level;
  document.getElementById('victory-gold').textContent=player.gold;
  document.getElementById('victory-overlay').classList.add('show');
  // 金色庆祝特效
  const cx=player.x*TILE+TILE/2, cy=player.y*TILE+TILE/2;
  spawnParticles(cx,cy,'#ffd740',40,{spread:3,gravity:-0.04});
  spawnParticles(cx,cy,'#fff9c4',25,{spread:2.5,gravity:-0.03});
  spawnParticles(cx,cy,'#ffb300',30,{spread:3,gravity:-0.05});
  screenShake=8;
  clearSave(); // 通关清除进度存档
  addMsg('☀ 你击败了堕天使，金光撕开了地牢的穹顶...你自由了。','special');
}

// ★★★ 绘制技能冷却图标（右上角HUD） ★★★
function drawCooldownIcon(x, y, w, h, cdRemaining, cdMax, colorReady, iconChar, keyLabel) {
  const isReady = cdRemaining <= 0;
  const bgColor = isReady ? colorReady : '#2a2a35';
  const borderColor = isReady ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';

  // 背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // 发光效果（冷却好时）
  if (isReady) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.shadowColor = colorReady;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = colorReady;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
  }

  // 图标文字
  ctx.fillStyle = isReady ? '#fff' : '#6a6a7a';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(iconChar, x + w / 2, y + h / 2 - 4);

  // 冷却倒计时或就绪标记
  if (isReady) {
    ctx.fillStyle = '#66bb6a';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('OK', x + w / 2, y + h / 2 + 8);
  } else {
    const secLeft = Math.ceil(cdRemaining / 60);
    ctx.fillStyle = '#ffa726';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(secLeft + 's', x + w / 2, y + h / 2 + 7);
  }

  // 按键标签（在图标下方）
  ctx.fillStyle = '#8a8a8a';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[' + keyLabel + ']', x + w / 2, y + h + 12);
}
