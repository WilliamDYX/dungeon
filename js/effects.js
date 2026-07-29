// effects.js - 粒子特效、浮动文字、刀光、金币掉落、击杀奖励、环境尘埃

// ---- Particles ----
function spawnParticles(x,y,color,count,opts={}){
  for(let i=0;i<count;i++){
    const a=randF(0,Math.PI*2),spd=randF(0.5,2.5);
    particles.push({
      x,y,
      vx:Math.cos(a)*spd*(opts.spread||1),
      vy:Math.sin(a)*spd*(opts.spread||1)-0.5,
      life:randF(15,35),maxLife:35,
      size:rand(2,5),color,
      gravity:opts.gravity!==undefined?opts.gravity:0.06,
      shrink:true,
    });
  }
}

function spawnHealParticles(x,y){
  for(let i=0;i<10;i++){
    particles.push({
      x:x+randF(-6,6),y:y+randF(-6,6),
      vx:randF(-0.3,0.3),vy:randF(-1.8,-0.3),
      life:randF(20,40),maxLife:40,
      size:rand(2,4),color:'#66bb6a',
      gravity:-0.02,shrink:true,
    });
  }
}

function spawnLevelUpParticles(x,y){
  const colors=['#ffd740','#ff6f00','#fff176','#ffab00'];
  for(let i=0;i<20;i++){
    const a=randF(0,Math.PI*2),spd=randF(1,3.5);
    particles.push({
      x,y,
      vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-1,
      life:randF(30,55),maxLife:55,
      size:rand(3,5),color:choose(colors),
      gravity:-0.03,shrink:true,
    });
  }
}

// ---- Floating Text ----
function addFloatText(x,y,text,color='#fff'){
  floatTexts.push({x,y,text,color,life:45,vy:-1});
}

function updateFloatTexts(){
  for(let i=floatTexts.length-1;i>=0;i--){
    const f=floatTexts[i];
    f.y+=f.vy;f.life--;
    if(f.life<=0)floatTexts.splice(i,1);
  }
}

// ---- Slash Effects ----
function updateSlashEffects(){
  for(let i=slashEffects.length-1;i>=0;i--){
    const s=slashEffects[i];
    s.life--;
    if(s.type==='arc'){s.angle+=s.rotationSpeed;}
    if(s.life<=0){slashEffects.splice(i,1);}
  }
}

function spawnSlashArc(x,y,color,count,minDist,maxDist){
  for(let i=0;i<count;i++){
    const a=randF(0,Math.PI*2);
    const dist=randF(minDist,maxDist);
    particles.push({
      x:x+Math.cos(a)*dist,y:y+Math.sin(a)*dist,
      vx:Math.cos(a)*randF(0.5,2),vy:Math.sin(a)*randF(0.5,2),
      life:randF(8,20),maxLife:20,
      size:rand(3,7),color,
      gravity:0,shrink:true,
    });
  }
}

// ---- Particles Update ----
function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;
    p.vy+=p.gravity;
    p.life--;
    if(p.shrink)p.size*=0.97;
    if(p.life<=0||p.size<0.3)particles.splice(i,1);
  }
}

function spawnGoldParticles(x,y){
  for(let i=0;i<8;i++){
    particles.push({
      x:x+randF(-4,4),y:y+randF(-4,4),
      vx:randF(-1,1),vy:randF(-2,-0.5),
      life:randF(20,35),maxLife:35,
      size:rand(2,4),color:'#ffd740',
      gravity:0.05,shrink:true,
    });
  }
}

function spawnGoldDrop(tileX, tileY, minG, maxG) {
  const amount = rand(minG, maxG);
  items.push({x:tileX, y:tileY, type:'gold', name:'金币', value:amount});
  spawnGoldParticles(tileX*TILE+TILE/2, tileY*TILE+TILE/2);
  addFloatText(tileX*TILE+TILE/2, tileY*TILE-TILE/2, '+'+amount, '#ffd740');
}

function onEnemyKilled(e) {
  const floorScale=1+Math.floor(floor/2)*0.5;
  const goldMap={slime:[3,8],bat:[5,12],skeleton:[8,18],ghost:[10,22],demon:[25,50],lich:[15,30],mimic:[12,25]};
  const g=goldMap[e.type]||[3,8];
  spawnGoldDrop(e.x, e.y, Math.floor(g[0]*floorScale), Math.floor(g[1]*floorScale));
  if(e.elite){
    spawnGoldDrop(e.x, e.y, Math.floor(g[0]*floorScale), Math.floor(g[1]*floorScale));
    addMsg('精英怪物掉落了额外金币！','special');
    collectSoul(1);
  }
  kills++;player.kills++;
  if(e.type==='demon'){collectSoul(1);spawnSoulGems()}
  if(player.kills>=player.nextLevel)levelUp();
  updateUI();
}
// ---- Game Loop ----
function spawnAmbientDust(){
  if(Math.random()<0.08&&player){
    const vpL2=clamp(player.x-Math.floor(COLS/2),0,MAP_W-COLS);
    const vpT2=clamp(player.y-Math.floor(ROWS/2),0,MAP_H-ROWS);
    const dx=rand(vpL2,vpL2+COLS-1),dy=rand(vpT2,vpT2+ROWS-1);
    if(explored[dy]&&explored[dy][dx]&&visible[dy]&&visible[dy][dx]&&map[dy][dx]!==T_WALL){
      particles.push({
        x:dx*TILE+randF(0,TILE),y:dy*TILE+randF(0,TILE),
        vx:randF(-0.1,0.1),vy:randF(-0.15,-0.02),
        life:randF(60,120),maxLife:120,
        size:rand(1,2),color:'rgba(200,200,220,0.15)',
        gravity:-0.002,shrink:false,
      });
    }
  }
}
