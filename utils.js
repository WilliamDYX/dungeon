// utils.js - 工具函数（clamp/dist/choose/hexToRgba）与消息系统（addMsg）

// ---- Utility ----
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(x1,y1,x2,y2){return Math.hypot(x1-x2,y1-y2)}
function choose(arr){return arr[rand(0,arr.length-1)]}

function hexToRgba(hex, alpha) {
  if (!hex || hex[0] !== '#') return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---- Message ----
function addMsg(msg,cls=''){
  msgHistory.unshift({text:msg,cls:cls});
  if(msgHistory.length>20)msgHistory.pop();
  for(let i=0;i<3;i++){
    const el=document.getElementById('msg-'+i);
    if(msgHistory[i]){el.textContent=msgHistory[i].text;el.className='msg-line '+msgHistory[i].cls}
    else{el.textContent='';el.className='msg-line'}
  }
}

