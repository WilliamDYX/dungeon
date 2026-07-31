// skills.js - 技能(火球/治愈/炸弹)、商店、灵魂系统与永久加成

// ★★★ 通用技能释放器 ★★★
function useSkill(index){
  if(gameOver||actionDelay>0)return;
  const slot=skillSlots[index];
  if(!slot||!slot.unlocked){addMsg('未掌握此技能','info');return}
  if(slot.cdMax>0&&slot.cd>0){
    addMsg(slot.name+'冷却中（剩余'+Math.ceil(slot.cd/60)+'秒）','info');
    return;
  }
  if(slot.effect){
    const used=slot.effect();
    if(used!==false&&slot.cdMax>0)slot.cd=slot.cdMax;
  }
}

// ---- Shop System ----
function openShop(npc){
  shopOpen=true;currentShop=npc;
  document.getElementById('shop-title').textContent='⚒ '+npc.name;
  document.getElementById('shop-gold').textContent='金币: '+player.gold;
  const desc=npc.type==='weaponsmith'?'"上好武器，冒险者？"':
    npc.type==='staffmaster'?'"法杖蕴含古老之力..."':
    npc.type==='skillmaster'?'"知识需要代价..."':
    npc.type==='healer'?'"圣光保佑你，孩子..."':
    '"星辰之力在此..."';
  document.getElementById('shop-desc').textContent=desc;
  const container=document.getElementById('shop-items');
  container.innerHTML='';
  for(const item of npc.shop){
    const div=document.createElement('div');
    div.className='shop-item';
    const isOwned=(item.id==='skill_fire'&&isSkillOwned('fireball'))||(item.id==='skill_heal'&&isSkillOwned('heal'));
    const canAfford=player.gold>=item.cost;
    if(isOwned){div.classList.add('disabled');div.innerHTML=`<span>${item.name}</span><span class="owned">已拥有</span>`}
    else if(!canAfford){div.classList.add('disabled');div.innerHTML=`<span>${item.name}</span><span class="cost" style="color:#ef5350">${item.cost}G</span>`}
    else{
      div.innerHTML=`<span>${item.name}<br><span style="font-size:11px;color:#6a6a7a">${item.desc}</span></span><span class="cost">${item.cost}G</span>`;
      div.onclick=()=>buyItem(item,npc);
    }
    container.appendChild(div);
  }
  document.getElementById('shop-overlay').classList.add('show');
}

function closeShop(){
  shopOpen=false;currentShop=null;
  document.getElementById('shop-overlay').classList.remove('show');
  // 清除议价折扣状态(关闭商店即结束本轮优惠)
  if(typeof npcChatState!=='undefined'){npcChatState.discount=0;npcChatState.npc=null;npcChatState.npcType=null}
}

function buyItem(item,npc){
  if(player.gold<item.cost){addMsg('金币不足！','warning');return}
  if((item.id==='skill_fire'&&isSkillOwned('fireball'))||(item.id==='skill_heal'&&isSkillOwned('heal'))){
    addMsg('已掌握此技能','info');closeShop();return;
  }
  player.gold-=item.cost;
  spawnGoldParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2);
  addMsg(`花费 ${item.cost} 金币购买了 ${item.name}`,'info');
  item.effect();
  updateUI();
  closeShop();
  endTurn();
}
// ★★★ 技能冷却系统 - 火球术 ★★★
function castFireball(){
  if(gameOver||actionDelay>0)return false;
  const {dx,dy}=player.lastDir;
  if(dx===0&&dy===0)return false;

  actionDelay=14;

  const px=player.x*TILE+TILE/2,py=player.y*TILE+TILE/2;
  spawnParticles(px+dx*10,py+dy*10,'#ff6f00',8,{spread:0.8,gravity:-0.02});
  addFloatText(px+dx*20,py+dy*20,'🔥','#ff6f00');
  addMsg('发射火球术！','info');
  projectiles.push({
    x:player.x+dx,y:player.y+dy,dx,dy,
    life:8,dmg:Math.max(1,Math.floor(player.atk*1.2)),
    fromPlayer:true,type:'fireball',
  });
  endTurn();
  return true;
}

// ★★★ 技能冷却系统 - 治愈术 ★★★
function castHeal(){
  if(gameOver||actionDelay>0)return false;
  const healAmt=Math.floor(player.maxHp*0.5);
  const actual=Math.min(healAmt,player.maxHp-player.hp);
  if(actual<=0){addMsg('生命值已满','info');return false}

  actionDelay=10;

  player.hp+=actual;
  const cx=player.x*TILE+TILE/2,cy=player.y*TILE+TILE/2;
  spawnHealParticles(cx,cy);
  spawnParticles(cx,cy,'#66bb6a',10,{spread:1.5,gravity:-0.03});
  addFloatText(cx,cy-12,'+'+actual,'#66bb6a');
  addMsg(`治愈术恢复 ${actual} 点生命！`,'heal');
  screenShake=2;
  updateUI();
  endTurn();
  return true;
}

function fireballExplosion(x,y,dmg){
  spawnParticles(x*TILE+TILE/2,y*TILE+TILE/2,'#ff6f00',15,{spread:2});
  spawnParticles(x*TILE+TILE/2,y*TILE+TILE/2,'#ffab00',10,{spread:1.8});
  spawnParticles(x*TILE+TILE/2,y*TILE+TILE/2,'#ff5252',8,{spread:1.5});
  screenShake=8;
  addFloatText(x*TILE+TILE/2,y*TILE+TILE/2-16,'💥 爆炸！','#ff6f00');
  for(const e of entities){
    if(e.dead)continue;
    if(Math.abs(e.x-x)<=1&&Math.abs(e.y-y)<=1){
      const d=debugInstakill?(e.hp+e.maxHp+1000):Math.max(1,dmg-e.def+rand(-1,2));
      e.hp-=d;e.hitFlash=10;
      const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
      spawnParticles(cx,cy,'#ff5252',10,{spread:1.5});
      addFloatText(cx,cy-TILE/2,'-'+d,'#ff5252');
      addMsg(`火球炸到${enemyName(e.type)}造成 ${d} 点伤害！`,'damage');
      if(e.hp<=0){
        e.dead=true;
        spawnParticles(cx,cy,'#ff8a80',20,{spread:2});
        addMsg(`${enemyName(e.type)}被火球烧成灰烬！`,'warning');
        onEnemyKilled(e);
      }
    }
  }
  cleanupDead();
}

// ---- Soul/Permanent System ----
function spawnSoulGems(){
  if(floor%5===0){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'soulgem',name:'灵魂碎片'});
  }
}

function collectSoul(count){
  soulShards+=count;
  SAFE_STORE.set('ds_souls',soulShards.toString());
  addMsg(`获得 ${count} 枚灵魂碎片！（共 ${soulShards}）`,'special');
}

function openSoulShop(){
  document.getElementById('soul-count').textContent='灵魂碎片: '+soulShards;
  const bonusText=`当前永久加成: +${soulBonusAtk} ATK, +${soulBonusDef} DEF, +${soulBonusHp} HP`;
  document.getElementById('soul-bonus').textContent=bonusText;
  const container=document.getElementById('soul-items');
  container.innerHTML='';
  const items=[
    {id:'sAtk',name:'⛆ 力量印记',desc:'永久攻击力+1（开局生效）',cost:3,
     effect:()=>{soulBonusAtk++;SAFE_STORE.set('ds_bonusAtk',soulBonusAtk.toString());addMsg('永久攻击力+1！','special')}},
    {id:'sDef',name:'⛆ 守护印记',desc:'永久防御力+1（开局生效）',cost:3,
     effect:()=>{soulBonusDef++;SAFE_STORE.set('ds_bonusDef',soulBonusDef.toString());addMsg('永久防御力+1！','special')}},
    {id:'sHp',name:'⛆ 生命印记',desc:'永久最大生命+10（开局生效）',cost:2,
     effect:()=>{soulBonusHp+=10;SAFE_STORE.set('ds_bonusHp',soulBonusHp.toString());addMsg('永久生命+10！','heal')}},
  ];
  for(const item of items){
    const div=document.createElement('div');
    div.className='soul-item';
    if(soulShards<item.cost){div.classList.add('disabled');div.innerHTML=`<span>${item.name}<br><span style="font-size:11px;color:#6a6a7a">${item.desc}</span></span><span class="cost" style="color:#ef5350">${item.cost}魂</span>`}
    else{
      div.innerHTML=`<span>${item.name}<br><span style="font-size:11px;color:#6a6a7a">${item.desc}</span></span><span class="cost">${item.cost}魂</span>`;
      div.onclick=()=>{if(soulShards>=item.cost){soulShards-=item.cost;SAFE_STORE.set('ds_souls',soulShards.toString());item.effect();updateUI();openSoulShop()}};
    }
    container.appendChild(div);
  }
  document.getElementById('soul-shop-overlay').classList.add('show');
}

function closeSoulShop(){
  document.getElementById('soul-shop-overlay').classList.remove('show');
}

function applySoulBonuses(){
  if(player){
    player.atk+=soulBonusAtk;
    player.def+=soulBonusDef;
    player.maxHp+=soulBonusHp;
    player.hp=player.maxHp;
  }
}
function useBomb(){
  if(gameOver||actionDelay>0)return;
  if(!player.bombs||player.bombs<=0){addMsg('没有炸弹！','info');return}
  player.bombs--;
  actionDelay=12;
  screenShake=12;
  damageFlash=6;
  const px=player.x*TILE+TILE/2,py=player.y*TILE+TILE/2;
  spawnParticles(px,py,'#ff6f00',20,{spread:3,gravity:-0.02});
  spawnParticles(px,py,'#ffab00',15,{spread:2.5,gravity:-0.01});
  spawnParticles(px,py,'#ff3d00',12,{spread:2,gravity:0});
  addFloatText(px,py-24,'💣 炸弹！','#ff6f00');
  addMsg('投掷炸弹！对周围3x3范围内所有敌人造成伤害！','warning');
  const bombDmg=Math.max(1,Math.floor(player.atk*1.5));
  for(const e of entities){
    if(e.dead)continue;
    if(Math.abs(e.x-player.x)<=1&&Math.abs(e.y-player.y)<=1){
      const dmg=bombDmg-e.def+rand(-1,3);
      const finalDmg=debugInstakill?(e.hp+e.maxHp+1000):Math.max(1,dmg);
      e.hp-=finalDmg;e.hitFlash=10;
      const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
      spawnParticles(cx,cy,'#ff5252',10,{spread:1.5});
      addFloatText(cx,cy-TILE/2,'-'+finalDmg,'#ff6f00');
      addMsg(`炸弹击中${enemyName(e.type)}造成 ${finalDmg} 点伤害！`,'damage');
      if(e.hp<=0){
        e.dead=true;
        spawnParticles(cx,cy,'#ff8a80',20,{spread:2});
        addMsg(`${enemyName(e.type)}被炸成碎片！`,'warning');
        onEnemyKilled(e);
      }
    }
  }
  cleanupDead();
  updateUI();
  endTurn();
}

// ★★★ 闪电链 ★★★
function playerChainLightning() {
  if (gameOver || actionDelay > 0) return false;
  const {dx, dy} = player.lastDir;
  if (dx === 0 && dy === 0) return false;
  actionDelay = 14;

  const px = player.x * TILE + TILE / 2;
  const py = player.y * TILE + TILE / 2;

  // 朝面朝方向搜索5格内的第一个敌人
  let firstTarget = null;
  for (let i = 1; i <= 5; i++) {
    const cx = player.x + dx * i, cy = player.y + dy * i;
    if (cx < 0 || cx >= MAP_W || cy < 0 || cy >= MAP_H) break;
    for (const e of entities) {
      if (e.dead) continue;
      if (e.x === cx && e.y === cy) { firstTarget = e; break; }
    }
    if (firstTarget) break;
  }

  if (!firstTarget) {
    // 即使没击中目标也显示闪电特效
    const endX = px + dx * 5 * TILE, endY = py + dy * 5 * TILE;
    const steps = 20;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const jx = px + (endX - px) * t + randF(-6, 6);
      const jy = py + (endY - py) * t + randF(-6, 6);
      particles.push({x:jx,y:jy,vx:randF(-0.5,0.5),vy:randF(-0.5,0.5),life:randF(18,30),maxLife:30,size:rand(3,6),color:'#ffffff',gravity:0,shrink:true});
      particles.push({x:jx,y:jy,vx:randF(-0.4,0.4),vy:randF(-0.4,0.4),life:randF(22,35),maxLife:35,size:rand(2,5),color:'#ffd740',gravity:0,shrink:true});
      particles.push({x:jx,y:jy,vx:randF(-0.3,0.3),vy:randF(-0.3,0.3),life:randF(28,40),maxLife:40,size:rand(4,7),color:'rgba(255,215,64,0.4)',gravity:0,shrink:true});
    }
    spawnParticles(endX, endY, '#ffffff', 8, {spread: 2.5});
    spawnParticles(endX, endY, '#ffd740', 6, {spread: 1.5});
    screenShake = 4;
    addFloatText(px, py - 20, '⚡ 闪电链 ⚡', '#ffd740');
    addMsg('闪电链没有击中任何敌人', 'info');
    endTurn(); return true;
  }

  // 从第一个目标开始，链式寻找5格内最近的未击中敌人
  const chain = [firstTarget];
  const hitIds = new Set([firstTarget.id]);
  let cur = firstTarget;
  while (true) {
    let nearest = null, nearDist = Infinity;
    for (const e of entities) {
      if (e.dead || hitIds.has(e.id)) continue;
      const d = dist(cur.x, cur.y, e.x, e.y);
      if (d <= 5 && d < nearDist) { nearDist = d; nearest = e; }
    }
    if (!nearest) break;
    chain.push(nearest);
    hitIds.add(nearest.id);
    cur = nearest;
  }

  // ★ 闪电链视觉效果
  let prevX = px, prevY = py;
  for (let ci = 0; ci < chain.length; ci++) {
    const target = chain[ci];
    let dmg = Math.max(1, Math.floor(player.atk * 1.1) - target.def + rand(-1, 2));
    if(debugInstakill)dmg=target.hp+target.maxHp+1000;
    target.hp -= dmg; target.hitFlash = 12;

    const tx = target.x * TILE + TILE / 2;
    const ty = target.y * TILE + TILE / 2;

    // 每次弹跳的闪光
    spawnParticles(tx, ty, '#ffffff', 6, {spread: 2.5});
    spawnParticles(tx, ty, '#ffd740', 10, {spread: 1.8});
    spawnParticles(tx, ty, '#fff176', 8, {spread: 1.2});

    // 闪电路径：从 prev 到 target 的粗闪电粒子带
    const steps = Math.max(8, Math.round(dist(prevX, prevY, tx, ty) / 8));
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const jx = prevX + (tx - prevX) * t + randF(-6, 6);
      const jy = prevY + (ty - prevY) * t + randF(-6, 6);
      // 内核（亮白）
      particles.push({
        x: jx, y: jy, vx: randF(-0.5, 0.5), vy: randF(-0.5, 0.5),
        life: randF(18, 30), maxLife: 30,
        size: rand(3, 6), color: '#ffffff',
        gravity: 0, shrink: true,
      });
      // 外层（黄）
      particles.push({
        x: jx, y: jy, vx: randF(-0.4, 0.4), vy: randF(-0.4, 0.4),
        life: randF(22, 35), maxLife: 35,
        size: rand(2, 5), color: '#ffd740',
        gravity: 0, shrink: true,
      });
      // 外层晕（淡黄，稍大）
      particles.push({
        x: jx, y: jy, vx: randF(-0.3, 0.3), vy: randF(-0.3, 0.3),
        life: randF(28, 40), maxLife: 40,
        size: rand(4, 7), color: 'rgba(255,215,64,0.4)',
        gravity: 0, shrink: true,
      });
    }

    addFloatText(tx, ty - TILE / 2, '-' + dmg, '#ffd740');
    addMsg('⚡ 闪电链弹到 ' + enemyName(target.type) + '，造成 ' + dmg + ' 点伤害！', 'damage');
    screenShake = Math.max(screenShake, 4);

    if (target.hp <= 0) {
      target.dead = true;
      spawnParticles(tx, ty, '#ff8a80', 14, {spread: 1.5});
      addMsg(enemyName(target.type) + '被闪电链吞噬！', 'warning');
      onEnemyKilled(target);
    }

    prevX = tx; prevY = ty;
  }

  // 起始大闪光
  screenShake = 6;
  spawnParticles(px, py, '#ffffff', 20, {spread: 2.5});
  spawnParticles(px, py, '#ffd740', 12, {spread: 2});
  addFloatText(px, py - 20, '⚡ 闪电链 ⚡', '#ffd740');
  addMsg('⚡ 闪电链弹射了 ' + chain.length + ' 个敌人！', 'special');

  cleanupDead(); updateUI(); endTurn(); return true;
}

// ★★★ 冰霜新星 ★★★
function playerFrostNova() {
  if (gameOver || actionDelay > 0) return false;
  actionDelay = 12;
  const px = player.x * TILE + TILE / 2, py = player.y * TILE + TILE / 2;
  spawnParticles(px, py, '#81d4fa', 20, {spread: 2.5});
  spawnParticles(px, py, '#e3f2fd', 15, {spread: 2});
  addFloatText(px, py - 20, '❄ 冰霜新星 ❄', '#81d4fa');
  screenShake = 6;
  let hitCount = 0;
  for (const e of entities) {
    if (e.dead) continue;
    if (Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1) {
      e.frozen = 12;
      let dmg = Math.max(1, Math.floor(player.atk * 0.4) - e.def + rand(-1, 1));
      if(debugInstakill)dmg=e.hp+e.maxHp+1000;
      e.hp -= dmg; e.hitFlash = 6;
      const cx = e.x * TILE + TILE / 2, cy = e.y * TILE + TILE / 2;
      spawnParticles(cx, cy, '#81d4fa', 8, {spread: 1});
      addFloatText(cx, cy - TILE / 2, '-' + dmg + ' ❄', '#81d4fa');
      addMsg('冰霜新星冻结' + enemyName(e.type) + '造成 ' + dmg + ' 点伤害！', 'damage');
      hitCount++;
      if (e.hp <= 0) {
        e.dead = true;
        spawnParticles(cx, cy, '#bbdefb', 12, {spread: 1.5});
        addMsg(enemyName(e.type) + '被冰霜新星粉碎！', 'warning');
        onEnemyKilled(e);
      }
    }
  }
  if (hitCount === 0) addMsg('冰霜新星没有击中任何敌人', 'info');
  else addMsg('冰霜新星冻结了 ' + hitCount + ' 个敌人！', 'special');
  cleanupDead(); updateUI(); endTurn(); return true;
}

// ★★★ 生命汲取 ★★★
function playerLifeDrain() {
  if (gameOver || actionDelay > 0) return false;
  const {dx, dy} = player.lastDir;
  if (dx === 0 && dy === 0) return false;
  actionDelay = 10;
  const px = player.x * TILE + TILE / 2, py = player.y * TILE + TILE / 2;
  spawnParticles(px + dx * 10, py + dy * 10, '#ce93d8', 6, {spread: 0.6, gravity: -0.02});
  addFloatText(px + dx * 20, py + dy * 20, '💜', '#ce93d8');
  addMsg('释放生命汲取！', 'info');
  projectiles.push({
    x: player.x + dx, y: player.y + dy, dx, dy,
    life: 6, dmg: Math.max(1, Math.floor(player.atk * 0.9)),
    fromPlayer: true, type: 'lifedrain',
  });
  endTurn(); return true;
}
