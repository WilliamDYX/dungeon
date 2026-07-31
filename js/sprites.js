// sprites.js - 像素精灵绘制（SPR/drawPx/rand/randF/initSprites）

// ---- Sprite System (32x32 pixel art) ----
const sprC = document.createElement('canvas');
sprC.width = TILE; sprC.height = TILE;
const sctx = sprC.getContext('2d');

const SPR = {};

// ---- 外部纹理图片加载（预渲染到 TILE×TILE 画布，性能更优） ----
const IMG = {};
function loadTexture(name, src) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = TILE; c.height = TILE;
    c.getContext('2d').drawImage(img, 0, 0, TILE, TILE);
    IMG[name] = c;
    console.log('[纹理] 已加载:', src);
  };
  img.onerror = () => { console.warn('[纹理] 加载失败:', src); };
  img.src = src;
}
loadTexture('naiwa', 'textures/naiwa.png');
loadTexture('nailong', 'textures/nailong.png');

function drawPx(s, x, y, w, h, c) {
  s.fillStyle = c; s.fillRect(x, y, w, h);
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function randF(a, b) {
  return Math.random() * (b - a) + a;
}

function initSprites() {
  // ---- Floor ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#5a4d3e';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4d4134';
  for (let y=0;y<TILE;y+=4) for (let x=0;x<TILE;x+=4)
    if ((x+y)%8===0) sctx.fillRect(x,y,4,4);
  sctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i=0;i<5;i++) sctx.fillRect(rand(0,TILE-4),rand(0,TILE-4),2,2);
  SPR.floor = sctx.getImageData(0,0,TILE,TILE);

  // ---- Floor v2 ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#5e5142';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#524537';
  for (let y=0;y<TILE;y+=4) for (let x=0;x<TILE;x+=4)
    if ((x+y)%8!==0) sctx.fillRect(x,y,4,4);
  drawPx(sctx,8,8,4,2,'rgba(0,0,0,0.06)');
  SPR.floor2 = sctx.getImageData(0,0,TILE,TILE);

  // ---- Wall ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3d33';
  sctx.fillRect(0,0,TILE,TILE);
  for (let y=0;y<TILE;y+=8) { sctx.fillStyle = '#3d322b'; sctx.fillRect(0,y,TILE,1); }
  for (let x=0;x<TILE;x+=8) { sctx.fillStyle = '#54463c'; sctx.fillRect(x,0,3,TILE); }
  drawPx(sctx,6,4,4,4,'rgba(0,0,0,0.15)');
  drawPx(sctx,20,14,6,4,'rgba(0,0,0,0.12)');
  drawPx(sctx,8,18,4,4,'rgba(60,40,30,0.12)');
  SPR.wall = sctx.getImageData(0,0,TILE,TILE);

  // ---- Wall with moss ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3d33';
  sctx.fillRect(0,0,TILE,TILE);
  for (let i=0;i<8;i++) {
    sctx.fillStyle = i%2===0 ? '#5a6b4a' : '#4d5a3e';
    sctx.fillRect(rand(0,26),rand(0,26),3,3);
  }
  for (let y=0;y<TILE;y+=8) { sctx.fillStyle = '#3d322b'; sctx.fillRect(0,y,TILE,1); }
  SPR.wall2 = sctx.getImageData(0,0,TILE,TILE);

  // ---- Stairs ----
  sctx.clearRect(0,0,TILE,TILE);
  for (let i=1;i<=6;i++) {
    sctx.fillStyle = i===6 ? '#ffb300' : '#ffd740';
    sctx.fillRect(2,i*3+1,i*4+4,3);
  }
  sctx.fillStyle = 'rgba(255,215,64,0.2)';
  sctx.fillRect(0,0,TILE,TILE);
  SPR.stairs = sctx.getImageData(0,0,TILE,TILE);

  // ---- Player (Knight) ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,11,10,10,18,'#7b1fa2');
  drawPx(sctx,10,18,12,6,'#6a1b9a');
  drawPx(sctx,10,12,12,12,'#546e7a');
  drawPx(sctx,10,12,12,3,'#78909c');
  drawPx(sctx,10,18,12,2,'#78909c');
  drawPx(sctx,7,11,5,4,'#455a64');
  drawPx(sctx,20,11,5,4,'#455a64');
  drawPx(sctx,10,24,6,6,'#37474f');
  drawPx(sctx,16,24,6,6,'#37474f');
  drawPx(sctx,9,28,7,4,'#4e342e');
  drawPx(sctx,16,28,7,4,'#4e342e');
  drawPx(sctx,10,4,12,10,'#8d6e63');
  drawPx(sctx,8,2,16,4,'#607d8b');
  drawPx(sctx,8,6,16,3,'#607d8b');
  drawPx(sctx,8,2,16,2,'#90a4ae');
  drawPx(sctx,12,6,8,2,'#263238');
  drawPx(sctx,13,6,2,2,'#4fc3f7');
  drawPx(sctx,18,6,2,2,'#4fc3f7');
  drawPx(sctx,3,14,4,8,'#bdbdbd');
  drawPx(sctx,3,14,4,2,'#e0e0e0');
  drawPx(sctx,3,12,4,3,'#795548');
  drawPx(sctx,12,4,3,2,'rgba(255,255,255,0.15)');
  SPR.player = sctx.getImageData(0,0,TILE,TILE);

  // ---- Slime ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#66bb6a';
  sctx.beginPath();
  sctx.ellipse(16,22,14,10,0,0,Math.PI*2);
  sctx.fill();
  sctx.fillStyle = '#81c784';
  sctx.beginPath();
  sctx.ellipse(16,18,10,6,0,0,Math.PI*2);
  sctx.fill();
  drawPx(sctx,10,18,6,4,'#fff');
  drawPx(sctx,18,18,6,4,'#fff');
  drawPx(sctx,12,20,2,2,'#1b5e20');
  drawPx(sctx,20,20,2,2,'#1b5e20');
  drawPx(sctx,14,24,4,2,'#1b5e20');
  drawPx(sctx,10,10,8,5,'rgba(255,255,255,0.2)');
  SPR.slime = sctx.getImageData(0,0,TILE,TILE);

  // ---- Bat ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,1,10,12,12,'#7b1fa2');
  drawPx(sctx,19,10,12,12,'#7b1fa2');
  drawPx(sctx,3,12,8,8,'#9c27b0');
  drawPx(sctx,21,12,8,8,'#9c27b0');
  drawPx(sctx,10,8,12,14,'#4a148c');
  drawPx(sctx,10,8,12,3,'#6a1b9a');
  drawPx(sctx,12,10,4,4,'#f44336');
  drawPx(sctx,18,10,4,4,'#f44336');
  drawPx(sctx,13,11,2,2,'#b71c1c');
  drawPx(sctx,19,11,2,2,'#b71c1c');
  drawPx(sctx,7,2,6,8,'#4a148c');
  drawPx(sctx,19,2,6,8,'#4a148c');
  SPR.bat = sctx.getImageData(0,0,TILE,TILE);

  // ---- Skeleton ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,9,3,14,12,'#e0e0e0');
  drawPx(sctx,9,3,14,3,'#bdbdbd');
  drawPx(sctx,10,5,5,5,'#000');
  drawPx(sctx,18,5,5,5,'#000');
  drawPx(sctx,12,6,2,2,'#f44336');
  drawPx(sctx,20,6,2,2,'#f44336');
  drawPx(sctx,12,10,8,3,'#000');
  drawPx(sctx,13,11,6,1,'#fff');
  drawPx(sctx,10,15,12,12,'#bdbdbd');
  drawPx(sctx,12,17,8,3,'#9e9e9e');
  drawPx(sctx,12,21,8,3,'#9e9e9e');
  drawPx(sctx,4,16,6,6,'#bdbdbd');
  drawPx(sctx,22,16,6,6,'#bdbdbd');
  drawPx(sctx,10,27,6,5,'#9e9e9e');
  drawPx(sctx,16,27,6,5,'#9e9e9e');
  SPR.skeleton = sctx.getImageData(0,0,TILE,TILE);

  // ---- Ghost ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = 'rgba(200,200,230,0.7)';
  sctx.beginPath();
  sctx.ellipse(16,14,13,14,0,0,Math.PI*2);
  sctx.fill();
  sctx.fillStyle = 'rgba(180,180,220,0.5)';
  sctx.beginPath();
  sctx.ellipse(16,10,9,8,0,0,Math.PI*2);
  sctx.fill();
  drawPx(sctx,10,10,6,5,'rgba(255,255,255,0.9)');
  drawPx(sctx,18,10,6,5,'rgba(255,255,255,0.9)');
  drawPx(sctx,12,11,2,3,'rgba(100,150,255,0.9)');
  drawPx(sctx,20,11,2,3,'rgba(100,150,255,0.9)');
  drawPx(sctx,6,22,6,4,'rgba(200,200,230,0.3)');
  drawPx(sctx,14,24,6,4,'rgba(200,200,230,0.3)');
  drawPx(sctx,22,22,6,4,'rgba(200,200,230,0.3)');
  SPR.ghost = sctx.getImageData(0,0,TILE,TILE);

  // ---- Demon (Boss) ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,8,8,16,16,'#c62828');
  drawPx(sctx,8,8,16,4,'#e53935');
  drawPx(sctx,8,2,16,10,'#b71c1c');
  drawPx(sctx,9,2,14,3,'#c62828');
  drawPx(sctx,5,0,7,6,'#4a4a4a');
  drawPx(sctx,20,0,7,6,'#4a4a4a');
  drawPx(sctx,10,4,5,4,'#ffeb3b');
  drawPx(sctx,18,4,5,4,'#ffeb3b');
  drawPx(sctx,12,5,2,2,'#f44336');
  drawPx(sctx,20,5,2,2,'#f44336');
  drawPx(sctx,10,8,12,4,'#4a4a4a');
  drawPx(sctx,12,8,8,2,'#f44336');
  drawPx(sctx,8,24,8,8,'#b71c1c');
  drawPx(sctx,16,24,8,8,'#b71c1c');
  drawPx(sctx,26,12,6,4,'#c62828');
  drawPx(sctx,28,10,4,4,'#c62828');
  SPR.demon = sctx.getImageData(0,0,TILE,TILE);

  // ---- Items ----
  // Health Potion
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,9,6,14,6,'#ef5350');
  drawPx(sctx,7,8,18,16,'#e53935');
  drawPx(sctx,9,12,14,10,'#c62828');
  drawPx(sctx,11,8,5,4,'#ff8a80');
  drawPx(sctx,9,8,4,3,'rgba(255,255,255,0.2)');
  SPR.hPotion = sctx.getImageData(0,0,TILE,TILE);

  // Strength Potion
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,9,6,14,6,'#ffa726');
  drawPx(sctx,7,9,18,14,'#ff8f00');
  drawPx(sctx,9,12,14,10,'#e65100');
  drawPx(sctx,11,8,5,4,'#ffd54f');
  drawPx(sctx,9,8,4,3,'rgba(255,255,255,0.2)');
  SPR.sPotion = sctx.getImageData(0,0,TILE,TILE);

  // Gold
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#ffd740';
  sctx.beginPath();
  sctx.ellipse(16,18,11,8,0,0,Math.PI*2);
  sctx.fill();
  sctx.fillStyle = '#ffb300';
  sctx.beginPath();
  sctx.ellipse(16,16,9,6,0,0,Math.PI*2);
  sctx.fill();
  drawPx(sctx,11,12,10,4,'#ffe082');
  drawPx(sctx,12,12,4,2,'rgba(255,255,255,0.3)');
  SPR.gold = sctx.getImageData(0,0,TILE,TILE);

  // Scroll
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,7,6,18,20,'#d7ccc8');
  drawPx(sctx,7,6,18,3,'#bcaaa4');
  drawPx(sctx,7,23,18,3,'#bcaaa4');
  drawPx(sctx,7,6,3,20,'#8d6e63');
  drawPx(sctx,22,6,3,20,'#8d6e63');
  drawPx(sctx,13,12,7,7,'#ef5350');
  SPR.scroll = sctx.getImageData(0,0,TILE,TILE);

  // Torch
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,12,16,8,16,'#4e342e');
  sctx.fillStyle = '#ff6f00';
  sctx.beginPath();
  sctx.ellipse(16,10,11,9,0,0,Math.PI*2);
  sctx.fill();
  sctx.fillStyle = '#ffab00';
  sctx.beginPath();
  sctx.ellipse(16,8,8,6,0,0,Math.PI*2);
  sctx.fill();
  sctx.fillStyle = '#ffd740';
  sctx.beginPath();
  sctx.ellipse(16,7,5,3,0,0,Math.PI*2);
  sctx.fill();
  SPR.torch = sctx.getImageData(0,0,TILE,TILE);

  // Barrel
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,5,6,22,20,'#795548');
  drawPx(sctx,5,6,22,4,'#6d4c41');
  drawPx(sctx,5,22,22,4,'#6d4c41');
  drawPx(sctx,5,6,5,20,'#5d4037');
  drawPx(sctx,22,6,5,20,'#5d4037');
  drawPx(sctx,14,6,4,20,'#4e342e');
  drawPx(sctx,5,12,22,2,'#4e342e');
  drawPx(sctx,5,18,22,2,'#4e342e');
  SPR.barrel = sctx.getImageData(0,0,TILE,TILE);

  // ---- Water ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#1a3a5c';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#1e4470';
  for (let y=0;y<TILE;y+=4) for (let x=0;x<TILE;x+=4)
    if ((x+y)%8===0) sctx.fillRect(x,y,4,4);
  sctx.fillStyle = 'rgba(100,180,255,0.15)';
  sctx.fillRect(2,6,28,4);
  sctx.fillRect(4,14,24,3);
  sctx.fillRect(6,22,20,3);
  SPR.water = sctx.getImageData(0,0,TILE,TILE);

  // ---- Carpet ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#6d1a1a';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#8a2222';
  for (let y=0;y<TILE;y+=4) for (let x=0;x<TILE;x+=4)
    if ((x+y)%8===0) sctx.fillRect(x+1,y+1,2,2);
  sctx.fillStyle = '#c9a84c';
  sctx.fillRect(4,2,24,2);
  sctx.fillRect(4,28,24,2);
  sctx.fillRect(2,4,2,24);
  sctx.fillRect(28,4,2,24);
  SPR.carpet = sctx.getImageData(0,0,TILE,TILE);

  // ---- Statue ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,10,2,12,10,'#9e9e9e');
  drawPx(sctx,8,4,16,2,'#bdbdbd');
  drawPx(sctx,10,4,3,3,'#616161');
  drawPx(sctx,19,4,3,3,'#616161');
  drawPx(sctx,13,8,6,3,'#616161');
  drawPx(sctx,8,12,16,14,'#757575');
  drawPx(sctx,6,14,4,8,'#9e9e9e');
  drawPx(sctx,22,14,4,8,'#9e9e9e');
  drawPx(sctx,8,26,16,4,'#616161');
  drawPx(sctx,10,8,12,2,'#616161');
  drawPx(sctx,7,6,4,4,'#9e9e9e');
  drawPx(sctx,21,6,4,4,'#9e9e9e');
  SPR.statue = sctx.getImageData(0,0,TILE,TILE);

  // ---- Altar ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,4,4,24,4,'#5d4037');
  drawPx(sctx,6,8,20,18,'#6d4c41');
  drawPx(sctx,6,8,20,3,'#795548');
  drawPx(sctx,6,23,20,3,'#4e342e');
  drawPx(sctx,10,12,12,10,'#3e2723');
  sctx.fillStyle = 'rgba(255,215,64,0.2)';
  sctx.fillRect(8,14,16,6);
  drawPx(sctx,14,16,4,2,'#ffd740');
  drawPx(sctx,13,14,6,6,'rgba(255,215,64,0.15)');
  SPR.altar = sctx.getImageData(0,0,TILE,TILE);

  // ---- Spikes ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3d33';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#bdbdbd';
  for (let i=0;i<5;i++) {
    drawPx(sctx,2+i*7,20-i*3,8,4+i*3,'#9e9e9e');
    drawPx(sctx,3+i*7,19-i*3,6,2,'#bdbdbd');
  }
  drawPx(sctx,6,22,4,2,'rgba(180,30,30,0.3)');
  drawPx(sctx,18,24,6,2,'rgba(180,30,30,0.25)');
  SPR.spikes = sctx.getImageData(0,0,TILE,TILE);

  // ---- Arrow (Projectile) ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,2,14,28,4,'#a0a0a0');
  drawPx(sctx,2,14,6,4,'#e0e0e0');
  drawPx(sctx,6,12,4,8,'#795548');
  drawPx(sctx,26,10,6,12,'#c62828');
  drawPx(sctx,26,10,6,3,'#ef5350');
  drawPx(sctx,26,19,6,3,'#ef5350');
  SPR.arrow = (()=>{const c=document.createElement('canvas');c.width=TILE;c.height=TILE;c.getContext('2d').drawImage(sprC,0,0);return c;})();

  // ---- Bookshelf ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,2,2,28,28,'#4e342e');
  drawPx(sctx,2,2,28,4,'#3e2723');
  drawPx(sctx,2,26,28,4,'#3e2723');
  for(let i=0;i<4;i++){
    const by=6+i*6;
    drawPx(sctx,2,by,28,2,'#5d4037');
    for(let j=0;j<4;j++)drawPx(sctx,5+j*7,by-4,5,5,'#8d6e63');
  }
  drawPx(sctx,4,8,4,4,'#ef5350');
  drawPx(sctx,18,14,4,4,'#66bb6a');
  drawPx(sctx,11,20,4,4,'#42a5f5');
  SPR.bookshelf = sctx.getImageData(0,0,TILE,TILE);

  // ---- Cage ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,2,2,4,28,'#607d8b');
  drawPx(sctx,26,2,4,28,'#607d8b');
  drawPx(sctx,2,2,28,4,'#607d8b');
  drawPx(sctx,2,14,28,4,'#607d8b');
  drawPx(sctx,2,26,28,4,'#607d8b');
  for(let i=0;i<5;i++)drawPx(sctx,6+i*5,6,2,20,'rgba(96,125,139,0.4)');
  drawPx(sctx,12,12,8,8,'#e0e0e0');
  drawPx(sctx,13,13,3,3,'#000');
  drawPx(sctx,17,13,3,3,'#000');
  SPR.cage = sctx.getImageData(0,0,TILE,TILE);

  // ---- Anvil ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,4,8,24,20,'#616161');
  drawPx(sctx,4,8,24,4,'#757575');
  drawPx(sctx,6,4,20,6,'#424242');
  drawPx(sctx,6,4,20,3,'#616161');
  drawPx(sctx,10,28,4,4,'#616161');
  drawPx(sctx,18,28,4,4,'#616161');
  drawPx(sctx,22,2,4,8,'#a0a0a0');
  drawPx(sctx,24,2,2,4,'#e0e0e0');
  drawPx(sctx,20,0,8,3,'#795548');
  SPR.anvil = sctx.getImageData(0,0,TILE,TILE);

  // ---- Cobweb ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle='rgba(200,200,220,0.08)';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.strokeStyle='rgba(200,200,220,0.2)';
  sctx.lineWidth=1;
  for(let i=0;i<4;i++){
    const a=i*Math.PI/4+Math.PI/8;
    sctx.beginPath();sctx.moveTo(16,4);sctx.lineTo(16+Math.cos(a)*14,4+Math.sin(a)*14);sctx.stroke();
  }
  for(let r=4;r<=12;r+=4){
    sctx.beginPath();sctx.arc(16,4,r,0,Math.PI*2);sctx.stroke();
  }
  SPR.cobweb = sctx.getImageData(0,0,TILE,TILE);

  // ---- Marble Floor ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#5c5c6a';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4e4e5c';
  for (let y=0;y<TILE;y+=4) for (let x=0;x<TILE;x+=4)
    if ((x+y)%8===0) sctx.fillRect(x,y,4,4);
  sctx.fillStyle = 'rgba(255,255,255,0.05)';
  sctx.fillRect(4,4,24,2);
  sctx.fillRect(6,16,20,2);
  SPR.marble = sctx.getImageData(0,0,TILE,TILE);

  // ---- Blood Floor ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#5a4d3e';
  sctx.fillRect(0,0,TILE,TILE);
  drawPx(sctx,4,8,20,16,'rgba(180,30,30,0.25)');
  drawPx(sctx,6,10,8,5,'rgba(180,20,20,0.3)');
  drawPx(sctx,14,14,12,8,'rgba(180,25,25,0.2)');
  drawPx(sctx,10,20,6,3,'rgba(150,20,20,0.2)');
  SPR.bloodFloor = sctx.getImageData(0,0,TILE,TILE);

  // ---- Candle ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,13,14,6,14,'#d7ccc8');
  drawPx(sctx,13,14,6,3,'#bcaaa4');
  drawPx(sctx,13,25,6,3,'#bcaaa4');
  sctx.fillStyle='#ff6f00';
  sctx.beginPath();sctx.ellipse(16,10,4,6,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#ffd740';
  sctx.beginPath();sctx.ellipse(16,8,3,4,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#fff9c4';
  sctx.beginPath();sctx.ellipse(16,7,2,2,0,0,Math.PI*2);sctx.fill();
  SPR.candle = sctx.getImageData(0,0,TILE,TILE);

  // ---- Bones ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle='#5a4d3e';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.strokeStyle='#e0e0e0';sctx.lineWidth=2;
  sctx.beginPath();sctx.moveTo(8,12);sctx.lineTo(24,20);sctx.stroke();
  sctx.beginPath();sctx.moveTo(10,20);sctx.lineTo(22,12);sctx.stroke();
  drawPx(sctx,6,10,5,4,'#e0e0e0');
  drawPx(sctx,22,18,5,4,'#e0e0e0');
  drawPx(sctx,20,10,5,4,'#e0e0e0');
  drawPx(sctx,8,18,5,4,'#e0e0e0');
  drawPx(sctx,13,14,6,6,'#eee');
  drawPx(sctx,14,15,2,2,'#333');
  drawPx(sctx,17,15,2,2,'#333');
  drawPx(sctx,15,18,2,2,'#333');
  SPR.bones = sctx.getImageData(0,0,TILE,TILE);

  // ---- Mushroom ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle='#5a4d3e';
  sctx.fillRect(0,0,TILE,TILE);
  drawPx(sctx,13,18,6,12,'#bdbdbd');
  sctx.fillStyle='#7b1fa2';
  sctx.beginPath();
  sctx.ellipse(16,14,8,6,0,0,Math.PI*2);
  sctx.fill();
  sctx.fillStyle='#ce93d8';
  sctx.beginPath();
  sctx.ellipse(16,12,6,4,0,0,Math.PI*2);
  sctx.fill();
  drawPx(sctx,10,12,2,2,'#e1bee7');
  drawPx(sctx,20,11,2,2,'#e1bee7');
  drawPx(sctx,15,9,2,2,'#e1bee7');
  SPR.mushroom = sctx.getImageData(0,0,TILE,TILE);

  // ---- Pillar ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,6,2,20,28,'#757575');
  drawPx(sctx,6,2,20,4,'#9e9e9e');
  drawPx(sctx,6,26,20,4,'#9e9e9e');
  drawPx(sctx,4,4,24,2,'#616161');
  drawPx(sctx,4,26,24,2,'#616161');
  drawPx(sctx,6,6,4,20,'#616161');
  drawPx(sctx,22,6,4,20,'#616161');
  for(let y=8;y<24;y+=6)drawPx(sctx,12,y,8,2,'#616161');
  SPR.pillar = sctx.getImageData(0,0,TILE,TILE);

  // ---- Urn ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,8,8,16,20,'#6d4c41');
  drawPx(sctx,6,10,20,16,'#5d4037');
  drawPx(sctx,10,6,12,4,'#8d6e63');
  drawPx(sctx,10,6,12,2,'#a1887f');
  drawPx(sctx,6,10,3,4,'#795548');
  drawPx(sctx,23,10,3,4,'#795548');
  drawPx(sctx,10,24,12,2,'#4e342e');
  drawPx(sctx,10,14,12,2,'rgba(255,215,0,0.2)');
  drawPx(sctx,10,18,12,2,'rgba(255,215,0,0.15)');
  SPR.urn = sctx.getImageData(0,0,TILE,TILE);

  // ---- Wall v3: Cracked ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3d33';
  sctx.fillRect(0,0,TILE,TILE);
  for (let y=0;y<TILE;y+=8) { sctx.fillStyle = '#3d322b'; sctx.fillRect(0,y,TILE,1); }
  for (let x=0;x<TILE;x+=8) { sctx.fillStyle = '#54463c'; sctx.fillRect(x,0,3,TILE); }
  drawPx(sctx,6,4,4,4,'rgba(0,0,0,0.15)');
  sctx.strokeStyle='rgba(0,0,0,0.3)';sctx.lineWidth=2;
  sctx.beginPath();sctx.moveTo(16,2);sctx.lineTo(14,10);sctx.lineTo(18,16);sctx.lineTo(12,24);sctx.lineTo(14,30);sctx.stroke();
  sctx.lineWidth=1;
  sctx.beginPath();sctx.moveTo(14,10);sctx.lineTo(8,14);sctx.stroke();
  sctx.beginPath();sctx.moveTo(18,16);sctx.lineTo(24,20);sctx.stroke();
  SPR.wall3 = sctx.getImageData(0,0,TILE,TILE);

  // ---- Wall v4: Mossy ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3d33';
  sctx.fillRect(0,0,TILE,TILE);
  for (let y=0;y<TILE;y+=8) { sctx.fillStyle = '#3d322b'; sctx.fillRect(0,y,TILE,1); }
  for (let x=0;x<TILE;x+=8) { sctx.fillStyle = '#54463c'; sctx.fillRect(x,0,3,TILE); }
  drawPx(sctx,6,4,4,4,'rgba(0,0,0,0.15)');
  drawPx(sctx,20,14,6,4,'rgba(0,0,0,0.12)');
  for(let i=0;i<10;i++){
    sctx.fillStyle=i%2===0?'rgba(80,120,60,0.35)':'rgba(60,90,50,0.25)';
    sctx.fillRect(rand(0,26),rand(0,26),rand(4,8),rand(3,5));
  }
  SPR.wall4 = sctx.getImageData(0,0,TILE,TILE);

  // ---- Floor v3: Diagonal flagstone ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#55483a';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3e32';
  for (let y=0;y<TILE;y+=8) for (let x=0;x<TILE;x+=8)
    if ((x/8+y/8)%2!==0) sctx.fillRect(x,y,8,8);
  sctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i=0;i<4;i++) sctx.fillRect(rand(0,TILE-4),rand(0,TILE-4),2,2);
  SPR.floor3 = sctx.getImageData(0,0,TILE,TILE);

  // ---- Floor v4: Worn cracked floor ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#5e5142';
  sctx.fillRect(0,0,TILE,TILE);
  sctx.fillStyle = '#524537';
  for (let y=0;y<TILE;y+=4) for (let x=0;x<TILE;x+=4)
    if ((x+y)%8===0) sctx.fillRect(x+1,y+1,2,2);
  sctx.fillStyle = 'rgba(0,0,0,0.1)';
  drawPx(sctx,4,10,2,12,'rgba(0,0,0,0.08)');
  drawPx(sctx,12,6,10,2,'rgba(0,0,0,0.06)');
  drawPx(sctx,20,18,2,8,'rgba(0,0,0,0.08)');
  drawPx(sctx,8,22,6,2,'rgba(0,0,0,0.06)');
  SPR.floor4 = sctx.getImageData(0,0,TILE,TILE);

  // ---- Chandelier ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,14,0,4,14,'#5d4037');
  sctx.fillStyle='#795548';
  for(let y=2;y<14;y+=4)drawPx(sctx,14,y+1,4,2,'#795548');
  drawPx(sctx,4,12,24,3,'#6d4c41');
  drawPx(sctx,4,12,24,1,'#8d6e63');
  drawPx(sctx,6,15,4,4,'#4e342e');
  drawPx(sctx,22,15,4,4,'#4e342e');
  drawPx(sctx,12,15,4,4,'#4e342e');
  drawPx(sctx,18,15,4,4,'#4e342e');
  sctx.fillStyle='#ff6f00';
  sctx.beginPath();sctx.ellipse(8,14,3,4,0,0,Math.PI*2);sctx.fill();
  sctx.beginPath();sctx.ellipse(24,14,3,4,0,0,Math.PI*2);sctx.fill();
  sctx.beginPath();sctx.ellipse(14,12,3,4,0,0,Math.PI*2);sctx.fill();
  sctx.beginPath();sctx.ellipse(20,12,3,4,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#ffab00';
  sctx.beginPath();sctx.ellipse(8,12,2,3,0,0,Math.PI*2);sctx.fill();
  sctx.beginPath();sctx.ellipse(24,12,2,3,0,0,Math.PI*2);sctx.fill();
  sctx.beginPath();sctx.ellipse(14,10,2,3,0,0,Math.PI*2);sctx.fill();
  sctx.beginPath();sctx.ellipse(20,10,2,3,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#ffd740';
  drawPx(sctx,7,8,2,4,'#ffd740');
  drawPx(sctx,23,8,2,4,'#ffd740');
  drawPx(sctx,13,6,2,4,'#ffd740');
  drawPx(sctx,19,6,2,4,'#ffd740');
  SPR.chandelier = sctx.getImageData(0,0,TILE,TILE);

  // ---- Wall Chain ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3d33';
  sctx.fillRect(0,0,TILE,TILE);
  drawPx(sctx,14,0,4,32,'#5d4037');
  sctx.fillStyle = '#795548';
  for(let y=2;y<30;y+=6) drawPx(sctx,14,y+1,4,3,'#795548');
  drawPx(sctx,13,28,6,4,'#4e342e');
  drawPx(sctx,14,0,4,3,'#8d6e63');
  SPR.wallChain = sctx.getImageData(0,0,TILE,TILE);

  // ---- Painting ----
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle = '#4a3d33';
  sctx.fillRect(0,0,TILE,TILE);
  drawPx(sctx,3,2,26,28,'#5d4037');
  drawPx(sctx,3,2,26,3,'#795548');
  drawPx(sctx,3,27,26,3,'#4e342e');
  drawPx(sctx,3,2,3,28,'#795548');
  drawPx(sctx,26,2,3,28,'#4e342e');
  drawPx(sctx,5,18,22,8,'#2e7d32');
  drawPx(sctx,12,14,8,6,'#388e3c');
  drawPx(sctx,8,16,6,4,'#43a047');
  drawPx(sctx,16,12,10,8,'#388e3c');
  drawPx(sctx,6,8,6,10,'#1565c0');
  drawPx(sctx,10,6,4,6,'#90caf9');
  drawPx(sctx,7,5,3,3,'#fff9c4');
  sctx.fillStyle='rgba(255,215,64,0.05)';
  sctx.fillRect(5,18,22,8);
  SPR.painting = sctx.getImageData(0,0,TILE,TILE);

  // ---- Depleted Altar ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,4,4,24,4,'#3e2723');
  drawPx(sctx,6,8,20,18,'#4e342e');
  drawPx(sctx,6,8,20,3,'#5d4037');
  drawPx(sctx,6,23,20,3,'#3e2723');
  drawPx(sctx,10,12,12,10,'#2c1a0e');
  drawPx(sctx,12,10,2,6,'#1a0e08');
  drawPx(sctx,18,14,2,8,'#1a0e08');
  drawPx(sctx,14,20,6,2,'#1a0e08');
  SPR.altarDepleted = sctx.getImageData(0,0,TILE,TILE);

  // ---- Cursed Altar ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,4,4,24,4,'#4a1a1a');
  drawPx(sctx,6,8,20,18,'#5c2020');
  drawPx(sctx,6,8,20,3,'#6d2828');
  drawPx(sctx,6,23,20,3,'#3a1010');
  drawPx(sctx,10,12,12,10,'#2c0e0e');
  sctx.fillStyle='rgba(180,30,30,0.2)';
  sctx.fillRect(8,14,16,6);
  drawPx(sctx,14,16,4,2,'#ef5350');
  drawPx(sctx,13,14,6,6,'rgba(255,50,50,0.15)');
  SPR.altarCursed = sctx.getImageData(0,0,TILE,TILE);

  // ---- NPC Sprites ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,8,4,16,16,'#37474f');
  drawPx(sctx,6,8,4,12,'#795548');
  drawPx(sctx,22,8,4,12,'#795548');
  drawPx(sctx,10,20,12,10,'#455a64');
  drawPx(sctx,8,2,16,4,'#546e7a');
  drawPx(sctx,10,3,4,3,'#ffd740');
  drawPx(sctx,18,3,4,3,'#ffd740');
  drawPx(sctx,4,10,4,10,'#9e9e9e');
  drawPx(sctx,2,8,6,4,'#795548');
  drawPx(sctx,10,14,12,6,'#4e342e');
  SPR.npcWeapon = sctx.getImageData(0,0,TILE,TILE);

  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,8,4,16,20,'#1a237e');
  drawPx(sctx,8,4,16,3,'#283593');
  drawPx(sctx,10,22,12,6,'#1a237e');
  drawPx(sctx,8,2,16,4,'#bcaaa4');
  drawPx(sctx,10,3,4,3,'#42a5f5');
  drawPx(sctx,18,3,4,3,'#42a5f5');
  drawPx(sctx,10,0,12,4,'#1a237e');
  drawPx(sctx,11,0,10,2,'#283593');
  drawPx(sctx,24,2,3,26,'#5d4037');
  drawPx(sctx,22,0,6,4,'#ffd740');
  drawPx(sctx,22,26,6,4,'#ffd740');
  sctx.fillStyle='rgba(66,165,245,0.2)';
  sctx.fillRect(22,0,6,28);
  SPR.npcStaff = sctx.getImageData(0,0,TILE,TILE);

  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,8,4,16,20,'#311b92');
  drawPx(sctx,8,4,16,3,'#4527a0');
  drawPx(sctx,10,22,12,6,'#311b92');
  drawPx(sctx,8,2,16,4,'#d7ccc8');
  drawPx(sctx,10,3,4,3,'#ce93d8');
  drawPx(sctx,18,3,4,3,'#ce93d8');
  drawPx(sctx,7,0,18,4,'#311b92');
  drawPx(sctx,6,2,20,2,'#4527a0');
  drawPx(sctx,10,2,12,2,'#1a0e2e');
  drawPx(sctx,12,12,2,2,'#ce93d8');
  drawPx(sctx,18,12,2,2,'#ce93d8');
  drawPx(sctx,14,16,4,2,'#ce93d8');
  drawPx(sctx,12,20,8,2,'#ce93d8');
  sctx.fillStyle='rgba(206,147,216,0.15)';
  sctx.fillRect(10,10,12,14);
  drawPx(sctx,4,12,4,8,'#311b92');
  drawPx(sctx,24,12,4,8,'#311b92');
  SPR.npcSkill = sctx.getImageData(0,0,TILE,TILE);

  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,8,4,16,16,'#1b5e20');
  drawPx(sctx,8,4,16,3,'#2e7d32');
  drawPx(sctx,10,20,12,10,'#1b5e20');
  drawPx(sctx,8,2,16,4,'#bcaaa4');
  drawPx(sctx,10,3,4,3,'#81c784');
  drawPx(sctx,18,3,4,3,'#81c784');
  drawPx(sctx,4,12,4,10,'#bdbdbd');
  drawPx(sctx,24,12,4,10,'#bdbdbd');
  drawPx(sctx,0,10,6,4,'#795548');
  drawPx(sctx,10,14,12,6,'#fff');
  drawPx(sctx,12,14,8,2,'#81c784');
  drawPx(sctx,12,17,8,2,'#81c784');
  SPR.npcHealer = sctx.getImageData(0,0,TILE,TILE);

  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,8,4,16,20,'#4a148c');
  drawPx(sctx,8,4,16,3,'#6a1b9a');
  drawPx(sctx,10,22,12,6,'#4a148c');
  drawPx(sctx,8,2,16,4,'#d7ccc8');
  drawPx(sctx,10,3,4,3,'#ce93d8');
  drawPx(sctx,18,3,4,3,'#ce93d8');
  drawPx(sctx,7,0,18,4,'#4a148c');
  for (let i=0;i<6;i++) {
    const rx=rand(2,26), ry=rand(4,26);
    const colors=['#ce93d8','#e1bee7','#ffd740'];
    drawPx(sctx,rx,ry,3,3,choose(colors));
  }
  drawPx(sctx,24,2,4,26,'#5d4037');
  sctx.fillStyle='#ce93d8';
  sctx.beginPath();sctx.ellipse(26,2,5,5,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#e1bee7';
  sctx.beginPath();sctx.ellipse(26,2,3,3,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='rgba(206,147,216,0.15)';
  sctx.fillRect(22,0,8,28);
  SPR.npcEnchanter = sctx.getImageData(0,0,TILE,TILE);

  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle='rgba(0,0,0,0)';
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,6,6,20,20,'#7b1fa2');
  drawPx(sctx,6,6,20,4,'#9c27b0');
  drawPx(sctx,6,22,20,4,'#4a148c');
  drawPx(sctx,10,10,12,12,'#9c27b0');
  drawPx(sctx,12,12,8,8,'#ce93d8');
  drawPx(sctx,14,14,4,4,'#e1bee7');
  sctx.fillStyle='rgba(206,147,216,0.15)';
  sctx.fillRect(6,6,20,20);
  SPR.soulGem = sctx.getImageData(0,0,TILE,TILE);

  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle='#ff6f00';
  sctx.beginPath();sctx.ellipse(16,16,14,14,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#ffab00';
  sctx.beginPath();sctx.ellipse(16,16,10,10,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#ffd740';
  sctx.beginPath();sctx.ellipse(16,16,6,6,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#fff9c4';
  sctx.beginPath();sctx.ellipse(16,16,3,3,0,0,Math.PI*2);sctx.fill();
  SPR.fireball = sctx.getImageData(0,0,TILE,TILE);

  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle='rgba(0,0,0,0)';
  sctx.clearRect(0,0,TILE,TILE);
  sctx.fillStyle='#66bb6a';
  sctx.beginPath();sctx.ellipse(16,16,14,14,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#81c784';
  sctx.beginPath();sctx.ellipse(16,16,10,10,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#a5d6a7';
  sctx.beginPath();sctx.ellipse(16,16,6,6,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='rgba(255,255,255,0.2)';
  sctx.fillRect(10,6,12,2);
  sctx.fillRect(6,14,4,4);
  sctx.fillRect(20,14,4,4);
  SPR.healSprite = sctx.getImageData(0,0,TILE,TILE);

  // ---- Lich ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,6,4,20,20,'#1a1a2e');
  drawPx(sctx,6,4,20,4,'#2a2a4e');
  drawPx(sctx,8,8,16,12,'#16213e');
  drawPx(sctx,10,8,4,4,'#0f3460');
  drawPx(sctx,18,8,4,4,'#0f3460');
  drawPx(sctx,10,9,4,2,'#e94560');
  drawPx(sctx,18,9,4,2,'#e94560');
  drawPx(sctx,12,14,8,3,'#0f3460');
  drawPx(sctx,13,15,6,1,'#e94560');
  drawPx(sctx,8,2,16,3,'#ffd740');
  drawPx(sctx,10,0,4,4,'#ffd740');
  drawPx(sctx,18,0,4,4,'#ffd740');
  drawPx(sctx,24,6,3,20,'#4a148c');
  sctx.fillStyle='rgba(233,69,96,0.15)';
  sctx.fillRect(20,4,10,24);
  sctx.fillStyle='rgba(233,69,96,0.3)';
  sctx.fillRect(24,4,4,4);
  SPR.lich = sctx.getImageData(0,0,TILE,TILE);

  // ---- Fallen Angel (堕天使 - 隐藏Boss) ----
  sctx.clearRect(0,0,TILE,TILE);
  // 翅膀(白色发光)
  drawPx(sctx,0,10,8,10,'rgba(220,230,255,0.85)');
  drawPx(sctx,24,10,8,10,'rgba(220,230,255,0.85)');
  drawPx(sctx,2,8,6,4,'#fff');
  drawPx(sctx,24,8,6,4,'#fff');
  drawPx(sctx,0,14,4,8,'rgba(200,210,240,0.6)');
  drawPx(sctx,28,14,4,8,'rgba(200,210,240,0.6)');
  // 身体(深色长袍)
  drawPx(sctx,10,8,12,18,'#1a1a2e');
  drawPx(sctx,9,10,14,14,'#16213e');
  drawPx(sctx,10,8,12,2,'#2a2a4e');
  // 头部(苍白)
  drawPx(sctx,11,2,10,8,'#e8e8f0');
  drawPx(sctx,11,2,10,2,'#fff');
  // 头发(金色)
  drawPx(sctx,10,0,12,3,'#ffd740');
  // 眼睛(金色发光)
  drawPx(sctx,12,5,3,2,'#ffd740');
  drawPx(sctx,17,5,3,2,'#ffd740');
  // 黑泪
  drawPx(sctx,13,7,1,2,'#1a1a2e');
  drawPx(sctx,18,7,1,2,'#1a1a2e');
  // 光环
  drawPx(sctx,11,0,2,1,'#fff9c4');
  drawPx(sctx,19,0,2,1,'#fff9c4');
  drawPx(sctx,8,1,2,1,'rgba(255,249,196,0.6)');
  drawPx(sctx,22,1,2,1,'rgba(255,249,196,0.6)');
  // 腿
  drawPx(sctx,11,26,4,6,'#0f0f1e');
  drawPx(sctx,17,26,4,6,'#0f0f1e');
  // 金色光晕
  sctx.fillStyle='rgba(255,215,64,0.12)';
  sctx.fillRect(6,0,20,32);
  SPR.fallenAngel = sctx.getImageData(0,0,TILE,TILE);

  // ---- Mimic ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,4,8,24,20,'#5d4037');
  drawPx(sctx,4,8,24,4,'#795548');
  drawPx(sctx,4,24,24,4,'#4e342e');
  drawPx(sctx,4,8,4,20,'#6d4c41');
  drawPx(sctx,24,8,4,20,'#6d4c41');
  drawPx(sctx,12,12,8,8,'#ffd740');
  drawPx(sctx,14,14,4,4,'#ffa000');
  drawPx(sctx,14,14,2,2,'#000');
  drawPx(sctx,8,16,6,2,'#e0e0e0');
  drawPx(sctx,18,16,6,2,'#e0e0e0');
  drawPx(sctx,12,18,8,2,'#ef5350');
  SPR.mimic = sctx.getImageData(0,0,TILE,TILE);

  // ---- Bomb ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,10,6,12,18,'#37474f');
  drawPx(sctx,10,6,12,4,'#455a64');
  drawPx(sctx,10,20,12,4,'#263238');
  drawPx(sctx,14,2,4,6,'#795548');
  drawPx(sctx,15,0,2,4,'#ff6f00');
  sctx.fillStyle='#ffab00';
  sctx.beginPath();sctx.ellipse(16,1,3,2,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='#fff9c4';
  sctx.beginPath();sctx.ellipse(16,1,1,1,0,0,Math.PI*2);sctx.fill();
  SPR.bomb = sctx.getImageData(0,0,TILE,TILE);

  // ---- Map Scroll ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,7,6,18,20,'#d7ccc8');
  drawPx(sctx,7,6,18,3,'#bcaaa4');
  drawPx(sctx,7,23,18,3,'#bcaaa4');
  drawPx(sctx,7,6,3,20,'#8d6e63');
  drawPx(sctx,22,6,3,20,'#8d6e63');
  drawPx(sctx,12,12,10,8,'#4e342e');
  drawPx(sctx,14,14,4,4,'#ffd740');
  drawPx(sctx,15,15,2,2,'#ef5350');
  SPR.mapScroll = sctx.getImageData(0,0,TILE,TILE);

  // ---- Teleport Scroll ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,7,6,18,20,'#e1bee7');
  drawPx(sctx,7,6,18,3,'#ce93d8');
  drawPx(sctx,7,23,18,3,'#ce93d8');
  drawPx(sctx,7,6,3,20,'#9c27b0');
  drawPx(sctx,22,6,3,20,'#9c27b0');
  sctx.fillStyle='rgba(156,39,176,0.3)';
  sctx.beginPath();sctx.ellipse(16,16,6,6,0,0,Math.PI*2);sctx.fill();
  sctx.fillStyle='rgba(206,147,216,0.4)';
  sctx.beginPath();sctx.ellipse(16,16,3,3,0,0,Math.PI*2);sctx.fill();
  SPR.teleportScroll = sctx.getImageData(0,0,TILE,TILE);

  // ---- Equipment: Sword ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,12,2,8,24,'#e0e0e0');
  drawPx(sctx,12,2,8,4,'#fff');
  drawPx(sctx,12,22,8,4,'#9e9e9e');
  drawPx(sctx,10,0,12,4,'#795548');
  drawPx(sctx,11,0,10,2,'#8d6e63');
  drawPx(sctx,14,12,4,4,'#ffd740');
  SPR.equipSword = sctx.getImageData(0,0,TILE,TILE);

  // ---- Equipment: Shield ----
  sctx.clearRect(0,0,TILE,TILE);
  drawPx(sctx,4,4,24,24,'#455a64');
  drawPx(sctx,4,4,24,4,'#546e7a');
  drawPx(sctx,4,24,24,4,'#37474f');
  drawPx(sctx,4,4,4,24,'#546e7a');
  drawPx(sctx,24,4,4,24,'#37474f');
  drawPx(sctx,10,10,12,12,'#607d8b');
  drawPx(sctx,12,12,8,8,'#ffd740');
  drawPx(sctx,14,14,4,4,'#ffa000');
  SPR.equipShield = sctx.getImageData(0,0,TILE,TILE);

  for (const key of Object.keys(SPR)) {
    const val = SPR[key];
    if (val instanceof ImageData) {
      const c = document.createElement('canvas');
      c.width = TILE; c.height = TILE;
      const tmp = c.getContext('2d');
      tmp.putImageData(val, 0, 0);
      SPR[key] = c;
    }
  }
}
