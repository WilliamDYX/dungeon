// map.js - 地图生成、视野(FOV/LOS)、玩家出生点

// ---- Map Generation ----
function initMap(){
  map=[];explored=[];visible=[];
  for(let y=0;y<MAP_H;y++){
    map[y]=new Array(MAP_W).fill(T_WALL);
    explored[y]=new Array(MAP_W).fill(false);
    visible[y]=new Array(MAP_W).fill(false);
  }
}

function carveRoom(r){
  for(let y=r.y;y<r.y+r.h;y++)
    for(let x=r.x;x<r.x+r.w;x++)
      if(x>=0&&x<MAP_W&&y>=0&&y<MAP_H)map[y][x]=T_FLOOR;
}

function overlaps(room,others){
  const pad=2;
  for(const o of others)
    if(room.x-pad<o.x+o.w&&room.x+room.w+pad>o.x&&room.y-pad<o.y+o.h&&room.y+room.h+pad>o.y)return true;
  return false;
}

function carveH(x1,x2,y){
  const s=Math.min(x1,x2),e=Math.max(x1,x2);
  for(let x=s;x<=e;x++)if(x>=0&&x<MAP_W&&y>=0&&y<MAP_H)map[y][x]=T_FLOOR;
}
function carveV(y1,y2,x){
  const s=Math.min(y1,y2),e=Math.max(y1,y2);
  for(let y=s;y<=e;y++)if(x>=0&&x<MAP_W&&y>=0&&y<MAP_H)map[y][x]=T_FLOOR;
}

function generateDungeon(){
  initMap();
  rooms=[];
  const maxRooms=rand(7,10);
  let att=0;
  while(rooms.length<maxRooms&&att<150){
    att++;
    const w=rand(5,11),h=rand(4,9);
    const x=rand(1,MAP_W-w-1),y=rand(1,MAP_H-h-1);
    const room={x,y,w,h,cx:Math.floor(x+w/2),cy:Math.floor(y+h/2)};
    if(!overlaps(room,rooms)){rooms.push(room);carveRoom(room)}
  }
  for(let i=1;i<rooms.length;i++){
    const a=rooms[i-1],b=rooms[i];
    if(Math.random()<0.5){carveH(a.cx,b.cx,a.cy);carveV(a.cy,b.cy,b.cx)}
    else{carveV(a.cy,b.cy,a.cx);carveH(a.cx,b.cx,b.cy)}
  }
  const last=rooms[rooms.length-1];
  map[last.cy][last.cx]=T_STAIRS;
  const floorThemes={};
  for(const room of rooms){
    if(room===rooms[0]||room===last)continue;
    const theme=Math.random();
    if(theme<0.15&&room.w>=7&&room.h>=6){
      floorThemes[room.cx+','+room.cy]='water';
      const px=rand(room.x+1,room.x+room.w-4);
      const py=rand(room.y+1,room.y+room.h-4);
      const pw=rand(3,Math.min(5,room.w-2));
      const ph=rand(2,Math.min(4,room.h-2));
      for(let wy=py;wy<py+ph;wy++)
        for(let wx=px;wx<px+pw;wx++)
          if(wx>=0&&wx<MAP_W&&wy>=0&&wy<MAP_H)map[wy][wx]=T_WATER;
    }else if(theme<0.3&&room.w>=5&&room.h>=5){
      floorThemes[room.cx+','+room.cy]='carpet';
      const cx=room.cx,cy=room.cy;
      const cw=rand(3,room.w-2),ch=rand(3,room.h-2);
      for(let cy2=cy-Math.floor(ch/2);cy2<=cy+Math.floor(ch/2);cy2++)
        for(let cx2=cx-Math.floor(cw/2);cx2<=cx+Math.floor(cw/2);cx2++)
          if(cx2>=0&&cx2<MAP_W&&cy2>=0&&cy2<MAP_H&&map[cy2][cx2]===T_FLOOR)map[cy2][cx2]=T_CARPET;
      const sx=rand(room.x+1,room.x+room.w-2),sy=rand(room.y+1,room.y+room.h-2);
      if(map[sy][sx]===T_FLOOR||map[sy][sx]===T_CARPET)items.push({x:sx,y:sy,type:'statue',name:'雕像'});
    }else if(theme<0.4&&room.w>=6&&room.h>=5){
      floorThemes[room.cx+','+room.cy]='library';
      for(let i=0;i<rand(2,4);i++){
        const bx=rand(room.x+1,room.x+room.w-2),by=rand(room.y+1,room.y+room.h-2);
        if(map[by][bx]===T_FLOOR)items.push({x:bx,y:by,type:'bookshelf',name:'书架'});
      }
    }else if(theme<0.48&&room.w>=5&&room.h>=5){
      floorThemes[room.cx+','+room.cy]='armory';
      const ax=rand(room.x+1,room.x+room.w-2),ay=rand(room.y+1,room.y+room.h-2);
      if(map[ay][ax]===T_FLOOR)items.push({x:ax,y:ay,type:'anvil',name:'铁砧'});
      if(Math.random()<0.5){
        const bx=rand(room.x+1,room.x+room.w-2),by=rand(room.y+1,room.y+room.h-2);
        if(map[by][bx]===T_FLOOR)items.push({x:bx,y:by,type:'barrel',name:'木桶'});
      }
    }else if(theme<0.55&&room.w>=5&&room.h>=5){
      floorThemes[room.cx+','+room.cy]='prison';
      const cx=rand(room.x+1,room.x+room.w-3),cy=rand(room.y+1,room.y+room.h-3);
      if(map[cy][cx]===T_FLOOR)items.push({x:cx,y:cy,type:'cage',name:'牢笼'});
    }
    if(floor>=5&&Math.random()<0.2){
      const cx=rand(room.x+1,room.x+room.w-2),cy=rand(room.y+1,room.y+room.h-2);
      if(map[cy][cx]===T_FLOOR&&!floorThemes[room.cx+','+room.cy])items.push({x:cx,y:cy,type:'cobweb',name:'蜘蛛网'});
    }
    if(floor>=3&&Math.random()<0.15&&!floorThemes[room.cx+','+room.cy]){
      const bx=rand(room.x+1,room.x+room.w-2),by=rand(room.y+1,room.y+room.h-2);
      if(map[by][bx]===T_FLOOR)items.push({x:bx,y:by,type:'blood',name:'血迹'});
    }
    if(Math.random()<0.2){
      const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'torch',name:'火炬'});
    }
    if(Math.random()<0.1){
      const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'barrel',name:'木桶'});
    }
    if(Math.random()<0.12){
      const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'candle',name:'蜡烛'});
    }
    if(floor>=2&&Math.random()<0.08&&!floorThemes[room.cx+','+room.cy]){
      const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'bones',name:'骸骨'});
    }
    if(floor>=4&&Math.random()<0.1){
      const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'mushroom',name:'发光蘑菇'});
    }
    if(room.w>=7&&room.h>=6&&Math.random()<0.15){
      const x=rand(room.x+2,room.x+room.w-3),y=rand(room.y+2,room.y+room.h-3);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'pillar',name:'石柱'});
    }
    if(Math.random()<0.07){
      const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'urn',name:'瓮'});
    }
    if(Math.random()<0.08){
      const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
      if(map[y][x]===T_FLOOR){
        const isCursed=Math.random()<0.25;
        items.push({x,y,type:'altar',name:isCursed?'诡异祭坛':'神秘祭坛',cursed:isCursed,uses:rand(1,isCursed?2:3)});
      }
    }
    if(room.w>=7&&room.h>=6&&Math.random()<0.18){
      const x=rand(room.x+2,room.x+room.w-3),y=rand(room.y+2,room.y+room.h-3);
      if(map[y][x]===T_FLOOR)items.push({x,y,type:'chandelier',name:'吊灯'});
    }
    if(Math.random()<0.12){
      const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
      for(let i=0;i<5;i++){
        const x=rand(room.x+1,room.x+room.w-2),y=rand(room.y+1,room.y+room.h-2);
        if(map[y][x]!==T_FLOOR)continue;
        const wallDir=dirs.find(d=>map[y+d[1]]&&map[y+d[1]][x+d[0]]===T_WALL);
        if(wallDir){items.push({x,y,type:'painting',name:'壁画'});break;}
      }
    }
  }
  for(let y=1;y<MAP_H-1;y++){
    for(let x=1;x<MAP_W-1;x++){
      if(map[y][x]!==T_FLOOR)continue;
      const isCorridor=
        (map[y-1][x]===T_WALL||map[y+1][x]===T_WALL)&&
        (map[y][x-1]===T_WALL||map[y][x+1]===T_WALL);
      if(isCorridor&&Math.random()<0.04)items.push({x,y,type:'spikes',name:'尖刺陷阱'});
      if(isCorridor&&Math.random()<0.08)items.push({x,y,type:'marble',name:'大理石地砖'});
    }
  }
  for(let y=1;y<MAP_H-1;y++){
    for(let x=1;x<MAP_W-1;x++){
      if(map[y][x]!==T_FLOOR)continue;
      const isCorridor=
        (map[y-1][x]===T_WALL||map[y+1][x]===T_WALL)&&
        (map[y][x-1]===T_WALL||map[y][x+1]===T_WALL);
      if(!isCorridor)continue;
      const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
      for(const d of dirs){
        const wx=x+d[0],wy=y+d[1];
        if(wx>=0&&wx<MAP_W&&wy>=0&&wy<MAP_H&&map[wy][wx]===T_WALL&&Math.random()<0.03)
          items.push({x:wx,y:wy,type:'wallChain',name:'铁链'});
      }
    }
  }
}

// ---- FOV ----
function fovRadius(){
  return floorCurse&&floorCurse.id==='darkness'?4:7;
}

function updateFOV(px,py,radius){
  for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)visible[y][x]=false;
  for(let y=Math.max(0,py-radius);y<=Math.min(MAP_H-1,py+radius);y++){
    for(let x=Math.max(0,px-radius);x<=Math.min(MAP_W-1,px+radius);x++){
      const d=dist(x,y,px,py);
      if(d<=radius&&hasLOS(px,py,x,y)){visible[y][x]=true;explored[y][x]=true}
    }
  }
}

function hasLOS(x0,y0,x1,y1){
  const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);
  const sx=x0<x1?1:-1,sy=y0<y1?1:-1;
  let err=dx-dy,cx=x0,cy=y0;
  while(true){
    if(cx===x1&&cy===y1)return true;
    if(map[cy][cx]===T_WALL&&!(cx===x0&&cy===y0))return false;
    const e2=2*err;
    if(e2>-dy){err-=dy;cx+=sx}
    if(e2<dx){err+=dx;cy+=sy}
  }
}

// ---- Entity Creation ----
function spawnPlayer(){
  const room=rooms[0];
  const prevGold=player?player.gold:0;
  const prevAtk=player?player.atk-6:0;
  const prevDef=player?player.def-2:0;
  const prevMaxHp=player?player.maxHp-30:0;
  const prevBombs=player?player.bombs||0:0;
  player={
    x:room.cx,y:room.cy,type:'player',
    hp:30+prevMaxHp,maxHp:30+prevMaxHp,
    atk:6+prevAtk,def:2+prevDef,
    level:1,kills:0,gold:prevGold,nextLevel:3,
    lastDir:{dx:0,dy:1},
    bombs:prevBombs,
    vx:room.cx*TILE,vy:room.cy*TILE,
    moveStreak:0,stutterX:0,stutterY:0,
  };
  applySoulBonuses();
}
