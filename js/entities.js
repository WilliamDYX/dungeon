// entities.js - 敌人创建、战斗(攻击/远程/旋风斩/投射物)、敌人AI回合、可移动判定

function createEnemy(type,x,y,elite){
  const hard=Math.max(1,Math.floor(floor/8));
  const e={
    id:enemyIdCounter++,x,y,type,
    hp:1,maxHp:1,atk:1,def:0,
    detectRange:5,hitFlash:0,dead:false,
    animOffset:randF(0,Math.PI*2),
    elite:!!elite,attackCd:0,
  };
  const em=elite?1.5:1;
  switch(type){
    case 'slime':
      e.hp=Math.floor((6+floor+hard*3)*em);e.maxHp=e.hp;
      e.atk=Math.floor((3+Math.floor(floor/2)+hard)*em);
      e.def=0;e.detectRange=5;
      break;
    case 'bat':
      e.hp=Math.floor((4+floor*0.8+hard*2)*em);e.maxHp=e.hp;
      e.atk=Math.floor((4+Math.floor(floor/2)+hard)*em);
      e.def=0;e.detectRange=7;
      break;
    case 'skeleton':
      e.hp=Math.floor((10+floor*2+hard*5)*em);e.maxHp=e.hp;
      e.atk=Math.floor((5+floor+hard*2)*em);
      e.def=Math.floor((2+Math.floor(floor/2))*em);e.detectRange=6;
      break;
    case 'ghost':
      e.hp=Math.floor((7+floor*1.5+hard*3)*em);e.maxHp=e.hp;
      e.atk=Math.floor((4+floor+hard*2)*em);e.def=1;
      e.detectRange=8;
      break;
    case 'lich':
      e.hp=Math.floor((12+floor*2+hard*4)*em);e.maxHp=e.hp;
      e.atk=Math.floor((6+floor*1.2+hard)*em);e.def=1;
      e.detectRange=9;e.ranged=true;
      break;
    case 'mimic':
      e.hp=Math.floor((8+floor*1.5+hard*3)*em);e.maxHp=e.hp;
      e.atk=Math.floor((5+floor+hard)*em);e.def=Math.floor((1+Math.floor(floor/3))*em);
      e.detectRange=0;e.ambush=true;
      break;
    case 'demon':
      e.hp=Math.floor((25+floor*3+hard*6)*em);e.maxHp=e.hp;
      e.atk=Math.floor((8+floor*1.5+hard*2)*em);
      e.def=Math.floor((3+Math.floor(floor/2)+hard)*em);
      e.detectRange=9;
      break;
  }
  return e;
}

function spawnEnemies(){
  const count=rand(4+Math.floor(floor/2),7+Math.floor(floor/2));
  const bossFloor=floor%5===0;
  let placed=0;
  for(let i=0;i<rooms.length-1&&placed<count;i++){
    if(bossFloor&&i===rooms.length-2){
      const room=rooms[i];
      const x=rand(room.x+1,room.x+room.w-2);
      const y=rand(room.y+1,room.y+room.h-2);
      entities.push(createEnemy('demon',x,y));
      placed++;continue;
    }
    if(Math.random()<0.6||placed+1>=count){
      const ri=Math.random()<0.5?rand(1,rooms.length-2):i;
      const room=rooms[ri];
      if(!room)continue;
      const x=rand(room.x+1,room.x+room.w-2);
      const y=rand(room.y+1,room.y+room.h-2);
      let type;
      const avail=['slime','bat','skeleton','ghost'];
      if(floor>=7)avail.push('lich');
      if(floor>=4)avail.push('mimic');
      type=choose(avail);
      if(floor<=2&&(type==='skeleton'||type==='ghost'||type==='mimic'))type='slime';
      if(floor<=4&&(type==='ghost'||type==='lich'))type='bat';
      const isElite=floor>=5&&Math.random()<0.2+floor*0.01;
      entities.push(createEnemy(type,x,y,isElite));
      placed++;
    }
  }
  if(placed<count&&rooms.length>1){
    const room=rooms[rand(1,rooms.length-1)];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    entities.push(createEnemy('slime',x,y));
  }
}

let bossWarning=false;

function spawnItems(){
  const potCount=rand(1,2);
  for(let i=0;i<potCount;i++){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'hpotion',name:'生命药剂'});
  }
  if(Math.random()<0.5){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'spotion',name:'力量药剂'});
  }
  if(floor>=2&&Math.random()<0.3){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'spotion',name:'力量药剂'});
  }
  const gc=rand(2,5+Math.floor(floor/2));
  for(let i=0;i<gc;i++){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    const val=5+rand(0,5+Math.floor(floor*1.5));
    items.push({x,y,type:'gold',name:'金币',value:val});
  }
  if(Math.random()<0.25){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'scroll',name:'神秘卷轴'});
  }
  if(floor>=3&&Math.random()<0.35){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'bomb',name:'炸弹'});
  }
  if(floor>=2&&Math.random()<0.0){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'mapscroll',name:'地图卷轴'});
  }
  if(floor>=5&&Math.random()<0.2){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'tpscroll',name:'传送卷轴'});
  }
  if(floor>=3&&Math.random()<0.3){
    spawnEquipment();
  }
  spawnSoulGems();
}

function spawnEquipment(){
  const ri=rand(1,rooms.length-1);
  const room=rooms[ri];
  const x=rand(room.x+1,room.x+room.w-2);
  const y=rand(room.y+1,room.y+room.h-2);
  if(Math.random()<0.5){
    const bonus=1+Math.floor(floor/5);
    items.push({x,y,type:'weapon',name:`铁剑+${bonus}`,bonus,equipType:'atk'});
  }else{
    const bonus=1+Math.floor(floor/6);
    items.push({x,y,type:'armor',name:`皮甲+${bonus}`,bonus,equipType:'def'});
  }
}

// ---- Combat ----
function enemyName(t){
  return {slime:'史莱姆',bat:'蝙蝠',skeleton:'骷髅',ghost:'幽灵',demon:'恶魔',lich:'巫妖',mimic:'宝箱怪'}[t]||t;
}

function playerAttack(e){
  const isCrit=Math.random()<0.12;
  const curseAtkPenalty=floorCurse&&floorCurse.id==='frailty'?3:0;
  const curseDefPenalty=floorCurse&&floorCurse.id==='heaviness'?2:0;
  const effectiveDef=Math.max(0,e.def+curseDefPenalty);
  const dmg=Math.max(1,(player.atk-curseAtkPenalty-effectiveDef+rand(-1,2))*(isCrit?2:1));
  e.hp-=dmg;e.hitFlash=8;
  const nm=enemyName(e.type);
  screenShake=4;
  const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
  spawnParticles(cx,cy,isCrit?'#ffd740':'#ff5252',isCrit?12:7,{spread:isCrit?1.8:1.2});
  addFloatText(cx,cy-TILE/2,(isCrit?'暴击！':'')+'-'+dmg,isCrit?'#ffd740':'#ff5252');
  addMsg(`对${nm}${isCrit?'暴击！':''}造成 ${dmg} 点伤害！`,'damage');
  if(e.hp<=0){
    e.dead=true;
    spawnParticles(cx,cy,'#ff8a80',14,{spread:1.5});
    addMsg(`${nm}被击败！掉落金币！`,'warning');
    onEnemyKilled(e);
    return true;
  }
  return false;
}

function playerRangedAttack(){
  if(gameOver||actionDelay>0)return;
  const {dx,dy}=player.lastDir;
  if(dx===0&&dy===0)return;
  actionDelay=8;
  const px=player.x*TILE+TILE/2,py=player.y*TILE+TILE/2;
  spawnParticles(px+dx*10,py+dy*10,'#ffd740',6,{spread:0.6,gravity:-0.02});
  spawnParticles(px+dx*6,py+dy*6,'#fff176',4,{spread:0.4});
  damageFlash=2;
  screenShake=2;
  addFloatText(px+dx*20,py+dy*20,'🏹','#ffd740');
  projectiles.push({
    x:player.x+dx,y:player.y+dy,dx,dy,
    life:8,dmg:Math.max(1,Math.floor(player.atk*0.8)),
    fromPlayer:true,
  });
  addMsg('发射箭矢！','info');
  endTurn();
}

// ★ 旋风斩 - 近战范围攻击 + 刀光特效 ★
function playerSpecialAttack(){
  if(gameOver||actionDelay>0)return;
  actionDelay=10;
  screenShake=8;
  damageFlash=4;
  const px=player.x*TILE+TILE/2,py=player.y*TILE+TILE/2;

  const arcLayers=[
    {color:'#ffffff',count:5,radiusMin:10,radiusMax:22,arcLen:1.4,rotSpeed:0.15,life:26,lineW:4},
    {color:'#42a5f5',count:6,radiusMin:16,radiusMax:30,arcLen:1.2,rotSpeed:0.10,life:24,lineW:5},
    {color:'#1e88e5',count:7,radiusMin:22,radiusMax:40,arcLen:1.0,rotSpeed:0.07,life:22,lineW:4},
    {color:'#90caf9',count:6,radiusMin:28,radiusMax:50,arcLen:0.85,rotSpeed:0.05,life:20,lineW:3},
    {color:'#ffd740',count:4,radiusMin:12,radiusMax:32,arcLen:0.7,rotSpeed:0.12,life:18,lineW:3},
  ];

  for(const layer of arcLayers){
    for(let i=0;i<layer.count;i++){
      const baseAngle=randF(0,Math.PI*2);
      slashEffects.push({
        type:'arc',
        x:px,y:py,
        radius:randF(layer.radiusMin,layer.radiusMax),
        arcLength:layer.arcLen,
        angle:baseAngle,
        rotationSpeed:layer.rotSpeed*(Math.random()<0.5?1:-1),
        life:rand(Math.floor(layer.life*0.8),layer.life),
        maxLife:layer.life,
        color:layer.color,
        lineWidth:layer.lineW,
      });
    }
  }

  const lineColors=['#ffffff','#42a5f5','#90caf9','#e3f2fd'];
  const lineCount=10;
  for(let i=0;i<lineCount;i++){
    const angle=(i/lineCount)*Math.PI*2+randF(-0.15,0.15);
    const len=randF(22,50);
    slashEffects.push({
      type:'line',
      x:px,y:py,
      angle:angle,
      length:len,
      life:rand(14,22),
      maxLife:22,
      color:choose(lineColors),
      width:randF(1.5,3.5),
    });
  }

  const lineCount2=8;
  for(let i=0;i<lineCount2;i++){
    const angle=(i/lineCount2)*Math.PI*2+randF(0.1,0.35);
    const len=randF(18,42);
    slashEffects.push({
      type:'line',
      x:px,y:py,
      angle:angle,
      length:len,
      life:rand(10,18),
      maxLife:18,
      color:choose(['#ffffff','#42a5f5','#1e88e5']),
      width:randF(1,2.5),
    });
  }

  spawnSlashArc(px,py,'#ffffff',20,10,30);
  spawnSlashArc(px,py,'#42a5f5',18,8,26);
  spawnSlashArc(px,py,'#90caf9',14,6,22);
  spawnSlashArc(px,py,'#1e88e5',12,7,24);
  spawnSlashArc(px,py,'#ffd740',8,4,16);

  for(let i=0;i<30;i++){
    const a=randF(0,Math.PI*2);
    const spd=randF(1.5,4);
    particles.push({
      x:px,y:py,
      vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life:randF(10,25),maxLife:25,
      size:rand(2,5),
      color:choose(['#42a5f5','#90caf9','#ffffff','#1e88e5']),
      gravity:0,shrink:true,
    });
  }

  for(let i=0;i<40;i++){
    const a=(i/40)*Math.PI*2;
    const r=randF(12,28);
    particles.push({
      x:px+Math.cos(a)*r,y:py+Math.sin(a)*r,
      vx:Math.cos(a)*randF(0.3,1.2),vy:Math.sin(a)*randF(0.3,1.2),
      life:randF(8,20),maxLife:20,
      size:rand(2,4),
      color:choose(['#42a5f5','#ffffff','#90caf9']),
      gravity:-0.01,shrink:true,
    });
  }

  addFloatText(px,py-20,'⚔ 旋风斩 ⚔','#42a5f5');

  const slashDmg=Math.max(1,Math.floor(player.atk*1.3));
  let hitCount=0;
  for(const e of entities){
    if(e.dead)continue;
    const dx = Math.abs(e.x - player.x);
    const dy = Math.abs(e.y - player.y);
    if(dx <= 1 && dy <= 1){
      const dmg=Math.max(1,slashDmg-e.def+rand(-1,3));
      e.hp-=dmg;e.hitFlash=8;
      const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
      spawnParticles(cx,cy,'#42a5f5',8,{spread:1.2});
      spawnParticles(cx,cy,'#90caf9',5,{spread:0.8});
      spawnParticles(cx,cy,'#ffffff',3,{spread:0.6});
      addFloatText(cx,cy-TILE/2,'-'+dmg,'#42a5f5');
      addMsg(`旋风斩击中${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
      hitCount++;
      if(e.hp<=0){
        e.dead=true;
        spawnParticles(cx,cy,'#ff8a80',14,{spread:1.5});
        addMsg(`${enemyName(e.type)}被旋风斩斩灭！`,'warning');
        onEnemyKilled(e);
      }
    }
  }

  if(hitCount===0){
    addMsg('旋风斩挥出，但没有击中任何敌人','info');
  } else {
    addMsg(`旋风斩横扫！击中 ${hitCount} 个敌人！`,'special');
  }

  cleanupDead();
  updateUI();
  endTurn();
}
function updateProjectiles(){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    if(!p.fromPlayer)continue;
    if(map[p.y]&&map[p.y][p.x]===T_WALL){
      if(p.type==='fireball'){fireballExplosion(p.x,p.y,p.dmg)}
      else{spawnParticles(p.x*TILE+TILE/2,p.y*TILE+TILE/2,'#9e9e9e',5,{spread:0.5})}
      projectiles.splice(i,1);continue;
    }
    let hit=false;
    for(const e of entities){
      if(e.dead)continue;
      if(e.x===p.x&&e.y===p.y){
        if(p.type==='fireball'){
          fireballExplosion(p.x,p.y,p.dmg);
          hit=true;break;
        }
        const dmg=Math.max(1,p.dmg-e.def+rand(-1,1));
        e.hp-=dmg;e.hitFlash=8;
        const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
        spawnParticles(cx,cy,'#ff5252',7,{spread:1});
        addFloatText(cx,cy-TILE/2,'-'+dmg,'#ff5252');
        addMsg(`箭矢击中${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
        screenShake=3;
        if(e.hp<=0){
          e.dead=true;
          spawnParticles(cx,cy,'#ff8a80',14,{spread:1.5});
          addMsg(`${enemyName(e.type)}被击败！`,'warning');
          onEnemyKilled(e);
        }
        hit=true;break;
      }
    }
    if(hit){projectiles.splice(i,1);continue;}
    p.life--;
    if(p.life<=0){projectiles.splice(i,1);continue;}
    p.x+=p.dx;p.y+=p.dy;
  }
}
function enemyAttack(e){
  const extraAtk=floorCurse&&floorCurse.id==='bloodlust'?3:0;
  const dmg=Math.max(1,Math.floor(e.atk*0.8)+extraAtk-player.def+rand(-1,1));
  player.hp-=dmg;damageFlash=6;screenShake=6;
  const cx=player.x*TILE+TILE/2,cy=player.y*TILE+TILE/2;
  spawnParticles(cx,cy,'#ff5252',6,{spread:1});
  addFloatText(cx,cy-TILE/2,'-'+dmg,'#ff5252');
  addMsg(`${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
  if(player.hp<=0){player.hp=0;gameOver=true;showGameOver()}
  updateUI();
}

function lichRangedAttack(e){
  const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
  spawnParticles(cx,cy,'#e94560',8,{spread:0.8});
  const extraAtk=floorCurse&&floorCurse.id==='bloodlust'?3:0;
  const dmg=Math.max(1,Math.floor(e.atk*0.8)+extraAtk-player.def+rand(-1,2));
  player.hp-=dmg;damageFlash=6;screenShake=5;
  addFloatText(player.x*TILE+TILE/2,player.y*TILE+TILE/2-12,'-'+dmg,'#e94560');
  spawnParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2,'#e94560',10,{spread:1.2});
  addMsg(`巫妖的法术造成 ${dmg} 点伤害！`,'damage');
  if(player.hp<=0){player.hp=0;gameOver=true;showGameOver();updateUI();return}
  updateUI();
}

// ---- AI ----
function takeEnemyTurns(){
  for(const e of entities){
    if(e.dead)continue;
    if(!visible[e.y]||!visible[e.y][e.x])continue;
    if(e.attackCd>0){e.attackCd--;continue}
    const d=dist(e.x,e.y,player.x,player.y);
    if(e.ranged&&d>1.5&&d<=e.detectRange){
      lichRangedAttack(e);
      e.attackCd=12;
      continue;
    }
    if(e.ambush&&d<=1.5){
      addMsg(`${enemyName(e.type)}突然现形攻击！`,'warning');
      enemyAttack(e);
      e.attackCd=14;
      continue;
    }
    if(d<=1.5){
      enemyAttack(e);
      e.attackCd=10+rand(0,5);
      continue
    }
    if(d<=e.detectRange){
      const dirs=[
        {dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0},
        {dx:-1,dy:-1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:1,dy:1}
      ];
      dirs.sort((a,b)=>dist(e.x+a.dx,e.y+a.dy,player.x,player.y)-dist(e.x+b.dx,e.y+b.dy,player.x,player.y));
      for(const d of dirs){
        const nx=e.x+d.dx,ny=e.y+d.dy;
        if(nx===player.x&&ny===player.y){enemyAttack(e);break}
        if(canMove(nx,ny,e)){
          e.x=nx;e.y=ny;
          for(const item of items){
            if(item.type==='spikes'&&item.x===nx&&item.y===ny){
              e.hp-=2;e.hitFlash=6;
              spawnParticles(nx*TILE+TILE/2,ny*TILE+TILE/2,'#ff5252',5,{spread:0.8});
              addFloatText(nx*TILE+TILE/2,ny*TILE+TILE/2-8,'-2','#ff5252');
              if(e.hp<=0){e.dead=true;addMsg(`${enemyName(e.type)}被尖刺陷阱消灭！`,'warning');onEnemyKilled(e)}
            }
          }
          break
        }
      }
    }else if(Math.random()<0.25){
      const d=choose([{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}]);
      const nx=e.x+d.dx,ny=e.y+d.dy;
      if(canMove(nx,ny,e)){e.x=nx;e.y=ny}
    }
  }
}

function canMove(x,y,e){
  if(x<0||x>=MAP_W||y<0||y>=MAP_H)return false;
  if(map[y][x]===T_WALL)return false;
  for(const en of entities)if(en!==e&&!en.dead&&en.x===x&&en.y===y)return false;
  if(player&&player.x===x&&player.y===y)return false;
  return true;
}

function canPlayerMove(x,y){
  return !(x<0||x>=MAP_W||y<0||y>=MAP_H)&&map[y][x]!==T_WALL;
}

// ---- Player Actions ----
