// curse.js - 诅咒系统（生成、应用、移除诅咒效果）

function generateCurse(){
  if(floor<8)return null;
  const existingCurses=[];
  if(floorCurse)existingCurses.push(floorCurse.id);
  const avail=CURSES.filter(c=>!existingCurses.includes(c.id));
  if(avail.length===0)return null;
  return choose(avail);
}

function applyCurseEffect(){
  if(!floorCurse)return;
  hud.curse='咒: '+floorCurse.name;
}

function removeCurseEffects(){
  floorCurse=null;
  hud.curse='';
}
