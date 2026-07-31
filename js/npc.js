// npc.js - NPC对话AI系统（SenseNova接入、聊天UI、心情、议价、隐藏商品、性格覆盖）

// ============================================================
// SenseNova API - NPC 对话系统
// ============================================================

const SENSENOVA_API_KEY = 'sk-5UQHaMXsotPetObMiF3Z6GHOs1Kf4t1X';
const SENSENOVA_MODEL = 'deepseek-v4-flash';
const SENSENOVA_API_URL = 'https://token.sensenova.cn/v1/chat/completions';
const SENSENOVA_CORS_PROXY = 'https://api.allorigins.win/raw?url=';

let npcChatState = {
  open: false, npc: null, npcType: null, messages: [],
  typing: false, triggeredEvents: {}, discount: 0, bargainCooldown: 0,
  lastBargainResult: null,
};

function getNPCSystemPrompt(type) {
  const f = floor;
  const prompts = {
    weaponsmith: `你是「锻钢」，暗影地牢中的武器商人。过去你曾是王国的首席皇家铁匠，为虎贲军铸造过传奇兵器。因拒绝为一场不义的战争铸剑，被流放到了这座地牢。

性格：直率粗犷、对武器品质极度苛刻。看不起用劣质武器的人。内心有铁匠的骄傲，对真正懂行的人会变得热情。
说话风格：简短有力，喜欢用铁匠相关的比喻（锻打、淬火、回火等）。
目标：卖武器给冒险者，寻找懂得欣赏好铁器的人。

当前地牢第${f}层。你在这里开了个小铁匠铺。

隐藏线索（如果玩家提到以下关键词，请反应）：
- 虎贲/虎贲军：你一生最骄傲的作品，如果有人提起你会很激动。
- 龙鳞钢/龙鳞：你师门秘传的锻造术，可以打造出神兵利器。
- 王国/放逐：你被放逐的往事，提起会让你情绪低落但不排斥。

注意事项：请用中文回复，每句话控制在60字以内。保持角色感，不要跳出角色。你是游戏里的NPC，不是AI助手。`,

    staffmaster: `你是「霜语」，暗影地牢中的法杖商人。数百年前你进入地牢研究次元能量，因实验事故被困。你是古代大法师，知晓这座地牢的秘密。

性格：神秘莫测、说话故弄玄虚，习惯用诗意的隐喻。对魔法能量极度敏感，能感知暗影流动。
说话风格：优雅缓慢，喜欢反问和隐喻。偶尔会陷入沉思。
目标：出售法杖，同时寻找能理解魔法真谛的传人。

当前地牢第${f}层。你的法杖铺陈列着各种古董法杖。

隐藏线索：
- 次元裂隙/裂隙：你当年就是来封印裂隙的，这是地牢暗影能量的源头。
- 霜语：你的法号，被人叫出会感到惊讶和亲切。
- 暗影之王：你预感到封印即将破裂，但不确定何时。

注意事项：中文回复，每句60字内。保持神秘感。`,

    skillmaster: `你是「预言」，暗影地牢中的技能商人。曾经是最受尊敬的王国预言家，预见到了自己的囚禁却无力改变命运。

性格：睿智但健忘，说着说着会忘记话题。偶尔脱口而出准确的预言。对命运和因果有深刻理解。
说话风格：散漫跳跃，从话题跳到话题。突然说出很有哲理的话然后马上忘掉。
目标：出售技能卷轴，寻找"命中注定"的那个人。

当前地牢第${f}层。

隐藏线索：
- 预言/命运：你看到了一些未来的片段，但不能说得太清楚。
- 宿命：你会赠送一份小礼物给理解命运真谛的人。
- 第十层/10层：那里有重要的东西在等待。

注意事项：中文回复，每句60字内。偶尔健忘。`,

    healer: `你是「圣光」，暗影地牢中的光明祭司。曾是光明教会高阶祭司，主动进入地牢净化暗影，已经在这里待了三年。

性格：温柔慈悲，但眼神中有深深的疲惫。帮助每个受伤的灵魂，却无法治愈自己的心理创伤。
说话风格：柔和温暖，带有宗教式的语言。经常祈祷，偶尔流露脆弱。
目标：帮助受伤的冒险者，守护心中最后一点光明。

当前地牢第${f}层。

隐藏线索：
- 圣光/光明：你开始怀疑光明能否战胜这里的无尽黑暗。
- 救赎：你需要有人提醒你最初的信念。
- 教会/信仰：你离开教会太久了，有时会想家。

注意事项：中文回复，每句60字内。语气温柔、慈悲，偶尔流露出脆弱。`,

    enchanter: `你是「星辰」，暗影地牢中的附魔师。曾是研究宇宙奥秘的学者，发现地牢是连接虚空的节点后留在这里。

性格：极度狂热于星辰和虚空学问，说话充满热情。对危险毫不在意，只关心知识。
说话风格：语速快，充满感叹号，喜欢用天文学术语。经常一个人自言自语。
目标：研究虚空能量，寻找志同道合的学术讨论者。

当前地牢第${f}层。

隐藏线索：
- 星辰/星星：你会滔滔不绝地讲星辰和地牢构造的对应关系。
- 虚空：你触碰过虚空之力，获得了禁忌知识也付出了代价。
- 星陨/碎片：你发现了一块星陨碎片，蕴含着纯粹的星能。

注意事项：中文回复，每句60字内。狂热、语速快、充满活力。偶尔说些常人难懂的天文术语。`
  };
  return prompts[type] || prompts.weaponsmith;
}

// 调用 AI：优先走本地服务器代理(避免浏览器CORS)；服务器不可用时回退直连
async function callSenseNova(messages) {
  const payload = { model: SENSENOVA_MODEL, messages: messages };
  // 优先用本地服务器代理（同源，无CORS问题）
  const useProxy = location.protocol === 'http:' || location.protocol === 'https:';
  try {
    let resp;
    if (useProxy) {
      resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.msg || ('HTTP ' + resp.status));
      return { error: false, text: data.text };
    } else {
      // file:// 下直连（浏览器可能拦截，作为最后的尝试）
      resp = await fetch(SENSENOVA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SENSENOVA_API_KEY,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(()=>'');
        throw new Error('HTTP ' + resp.status + ' ' + errText.slice(0,120));
      }
      const data = await resp.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) throw new Error('AI返回格式异常');
      return { error: false, text: text };
    }
  } catch (e) {
    console.error('[NPC] 调用失败:', e);
    let hint = e.message || String(e);
    if (hint === 'Failed to fetch') {
      hint = useProxy
        ? '无法连接服务器，请确认已运行 node server.js 并用 http://localhost:3000 打开'
        : '浏览器拦截了跨域请求(file协议限制)。请运行 node server.js 后用 http://localhost:3000/roguelike.html 打开';
    }
    return { error: true, msg: '调用失败: ' + hint };
  }
}

function addChatMessage(text, cls) {
  const container = document.getElementById('npc-chat-messages');
  const div = document.createElement('div');
  div.className = 'npc-chat-msg ' + cls;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function openNPCChat(npc) {
  if (gameOver || npcChatState.open) return;
  npcChatState.open = true;
  npcChatState.npc = npc;
  npcChatState.npcType = npc.type;
  npcChatState.messages = [];
  npcChatState.typing = false;
  npcChatState.discount = 0;
  if (!npcChatState.triggeredEvents[npc.type]) npcChatState.triggeredEvents[npc.type] = {};

  const personality = NPC_PERSONALITIES[npc.type];
  const names = {weaponsmith:'铁匠·锻钢',staffmaster:'法杖师·霜语',skillmaster:'贤者·预言',healer:'祭司·圣光',enchanter:'附魔师·星辰'};

  document.getElementById('npc-chat-name').textContent = (names[npc.type]||'商人') + ' | ' + (personality?personality.title:'');
  updateChatMoodDisplay();
  document.getElementById('npc-chat-messages').innerHTML = '';

  const titles = {
    weaponsmith:'"哼，又来个想买武器的？"',
    staffmaster:'"哦？你也能感受到魔法流动吗？"',
    skillmaster:'"嗯...我好像记得你...还是忘了...你是谁来着？"',
    healer:'"愿圣光保佑你，受伤的旅人。"',
    enchanter:'"你注意到了吗！头顶的星辰排列和这座地牢的结构完全一致！"',
  };
  addChatMessage(titles[npc.type]||'"你好，冒险者。"','npc');
  npcChatState.messages.push({role:'assistant',content:titles[npc.type]||'"你好，冒险者。"'});

  document.getElementById('npc-chat-overlay').classList.add('show');
  setTimeout(() => {
    const input = document.getElementById('npc-chat-input');
    input.focus();
    input.value = '';
  }, 100);
}

function closeNPCChat() {
  npcChatState.open = false;
  npcChatState.npc = null;
  npcChatState.npcType = null;
  npcChatState.typing = false;
  document.getElementById('npc-chat-overlay').classList.remove('show');
}

function openNPCShip() {
  const npc = npcChatState.npc;
  // 先记住折扣(按 npc.type 标记)，再关聊天(避免 closeNPCChat 清空 state 导致折扣失效)
  const discount = npcChatState.discount;
  if (npc) {
    openShop(npc);
    closeNPCChat();
    // 关闭聊天后把折扣记回，让 openShop 覆盖逻辑和购买逻辑仍能识别
    npcChatState.npc = npc;
    npcChatState.npcType = npc.type;
    npcChatState.discount = discount;
    // 重新刷新商店价格显示(应用折扣)
    const items = document.getElementById('shop-items');
    if (items && discount > 0) {
      const priceEls = items.querySelectorAll('.cost');
      for (const el of priceEls) {
        const match = el.textContent.match(/(\d+)G/);
        if (match) {
          const origPrice = parseInt(match[1]);
          const newPrice = Math.max(1, Math.floor(origPrice * (100 - discount) / 100));
          el.textContent = newPrice + 'G';
          el.title = `原价 ${origPrice}G（${discount}% 折扣）`;
          el.style.color = '#66bb6a';
        }
      }
      const goldEl = document.getElementById('shop-gold');
      if (goldEl) goldEl.textContent = '金币: '+player.gold+' | 当前折扣: '+discount+'%';
    }
  }
}

function updateChatMoodDisplay() {
  const names = {weaponsmith:'铁匠·锻钢',staffmaster:'法杖师·霜语',skillmaster:'贤者·预言',healer:'祭司·圣光',enchanter:'附魔师·星辰'};
  const per = NPC_PERSONALITIES[npcChatState.npcType];
  if (!per) return;
  const nm = names[npcChatState.npcType]||'商人';
  const mood = per.mood;
  const stars = mood >= 80 ? '★★★★★' : mood >= 65 ? '★★★★☆' : mood >= 50 ? '★★★☆☆' : mood >= 35 ? '★★☆☆☆' : '★☆☆☆☆';
  const moodColors = {5:'#66bb6a',4:'#aed581',3:'#ffd740',2:'#ffa726',1:'#ef5350'};
  const starIdx = mood >= 80 ? 5 : mood >= 65 ? 4 : mood >= 50 ? 3 : mood >= 35 ? 2 : 1;
  document.getElementById('npc-chat-name').textContent = nm + ' | ' + per.title;
  const moodEl = document.getElementById('npc-chat-mood');
  moodEl.textContent = stars;
  moodEl.style.color = moodColors[starIdx]||'#ffd740';
}

async function sendChatMessage() {
  const input = document.getElementById('npc-chat-input');
  const text = input.value.trim();
  if (!text || npcChatState.typing || !npcChatState.npcType) return;
  input.value = '';
  addChatMessage(text, 'player');
  npcChatState.messages.push({role:'user',content:text});

  checkHiddenTriggers(text);

  npcChatState.typing = true;
  addChatMessage('思考中...', 'typing');

  const per = NPC_PERSONALITIES[npcChatState.npcType];
  const dynamicPrompt = getNPCSystemPrompt(npcChatState.npcType);
  const bargainState = npcChatState.discount > 0 ? `\n玩家当前享受 ${npcChatState.discount}% 折扣。` : '';
  const moodState = `\n当前心情值: ${per.mood}/100（影响价格和态度）。`;
  const systemMsg = dynamicPrompt + bargainState + moodState;

  const apiMessages = [
    {role:'system', content: systemMsg},
    ...npcChatState.messages.slice(-10),
  ];

  const result = await callSenseNova(apiMessages);

  const container = document.getElementById('npc-chat-messages');
  const typingEl = container.querySelector('.typing');
  if (typingEl) typingEl.remove();
  npcChatState.typing = false;

  let reply;
  if (result.error) {
    reply = getFallbackReply(npcChatState.npcType, text);
    addChatMessage(reply, 'npc');
    addChatMessage('[离线模式] NPC使用本地回复', 'system');
  } else {
    reply = result.text;
    addChatMessage(reply, 'npc');
  }
  npcChatState.messages.push({role:'assistant',content:reply});
}

function getFallbackReply(type, playerText) {
  const t = playerText.toLowerCase();
  const generic = {
    weaponsmith: [
      '"好钢出好剑，这是铁匠的道理。"',
      '"看你的身手不错，要不要看看新到的货？"',
      '"哼，这地牢里的铁匠就我一个靠谱的。"',
      '"武器是战士的第二条命，选把好的。"',
      '"我这儿的家伙事儿，都是真材实料。"',
    ],
    staffmaster: [
      '"法杖不仅是武器，更是通往真理的钥匙。"',
      '"你能感受到魔法的流动吗？就在你我之间。"',
      '"有趣，你的灵魂波动和常人不同。"',
      '"这座地牢隐藏着比暗影更深的秘密..."',
      '"每一根法杖都有自己的记忆。"',
    ],
    skillmaster: [
      '"嗯？我刚才说到哪儿了...哦对，技能。"',
      '"命运就像一本翻不完的书..."',
      '"我好像记得你，又好像不记得了。"',
      '"想学点真本事？那得看缘分。"',
      '"你的未来...嗯，我忘了。"',
    ],
    healer: [
      '"愿圣光治愈你的伤口，也治愈你的心灵。"',
      '"在这黑暗之中，更要守护心中的光。"',
      '"孩子，你受伤了，让我看看。"',
      '"圣光从未离开，只是有时我们感受不到。"',
      '"每一个生命都值得被拯救。"',
    ],
    enchanter: [
      '"你看那边！那块石头的纹路和星图一模一样！"',
      '"你知道宇宙中有多少颗星星吗？比这座地牢的砂砾还多！"',
      '"虚空在呼唤...哦抱歉，我又走神了。"',
      '"附魔不是魔法，是科学！是宇宙的规律！"',
      '"我昨晚又观测到一颗新星，太神奇了！"',
    ],
  };
  const list = generic[type] || generic.weaponsmith;
  const keywordMap = {
    '武器|剑|刀|斧|锤|矛|盾': 'weaponsmith',
    '法杖|魔法|魔力|咒语|法术': 'staffmaster',
    '技能|卷轴|能力|本事|学习': 'skillmaster',
    '治疗|治愈|伤|恢复|生命|祈祷': 'healer',
    '附魔|星辰|星星|宇宙|虚空|星': 'enchanter',
  };
  for (const [kws, target] of Object.entries(keywordMap)) {
    if (new RegExp(kws).test(t) && target !== type) {
      const cross = generic[target];
      if (cross) return cross[Math.floor(Math.random() * cross.length)];
    }
  }
  return list[Math.floor(Math.random() * list.length)];
}

function checkHiddenTriggers(text) {
  const type = npcChatState.npcType;
  if (!type) return;
  const triggers = NPC_PERSONALITIES[type].hiddenTriggers;
  if (!triggers) return;
  const triggered = npcChatState.triggeredEvents[type] || {};

  for (const [keyword, data] of Object.entries(triggers)) {
    if (text.includes(keyword) && !triggered[keyword]) {
      triggered[keyword] = true;
      if (!npcChatState.triggeredEvents[type]) npcChatState.triggeredEvents[type] = {};
      npcChatState.triggeredEvents[type][keyword] = true;
      data.effect();
      NPC_PERSONALITIES[type].mood = Math.min(100, NPC_PERSONALITIES[type].mood + 10);
      updateChatMoodDisplay();
      addChatMessage('✦ 触发隐藏剧情！心情提升！', 'event');
    }
  }
}

function bargainWithNPC() {
  if (npcChatState.typing || !npcChatState.npcType) return;
  if (npcChatState.bargainCooldown > 0) {
    addChatMessage(`[系统] 讨价还价还需等待 ${npcChatState.bargainCooldown} 回合`, 'system');
    return;
  }

  const per = NPC_PERSONALITIES[npcChatState.npcType];
  const mood = per.mood;
  const r = Math.random();

  let success = false;
  let discountGain = 0;
  let responseText = '';

  if (mood >= 70) {
    success = r < 0.7;
    discountGain = success ? rand(8, 18) : 0;
  } else if (mood >= 50) {
    success = r < 0.45;
    discountGain = success ? rand(5, 12) : 0;
  } else if (mood >= 30) {
    success = r < 0.25;
    discountGain = success ? rand(3, 8) : 0;
  } else {
    success = r < 0.1;
    discountGain = success ? rand(2, 5) : 0;
  }

  if (success) {
    npcChatState.discount += discountGain;
    per.mood = Math.max(10, per.mood - 5);
    responseText = discountGain >= 12
      ? '"唉，你这张嘴啊...好吧，给你打个折，就当交个朋友。"'
      : '"行吧行吧，给你便宜一点，别到处说。"';
    addChatMessage('💰 讨价还价成功！获得 '+discountGain+'% 折扣！（累计 '+npcChatState.discount+'%）', 'event');
    addMsg(`与${per.name}讨价还价成功，获得${discountGain}%折扣！`,'special');
  } else {
    per.mood = Math.max(5, per.mood - 10);
    responseText = mood >= 60
      ? '"不行不行，这价格已经很公道了！再低我就亏本了！"'
      : '"哼，你当我是开善堂的吗？不买拉倒。"';
    addChatMessage('讨价还价失败... NPC 的心情变差了。', 'system');
    addMsg('讨价还价失败，NPC不太高兴。','warning');
  }

  updateChatMoodDisplay();
  addChatMessage(responseText, 'npc');
  npcChatState.messages.push({role:'assistant',content:responseText});
  npcChatState.bargainCooldown = 5;
}

const _origOpenShop = openShop;
openShop = function(npc) {
  _origOpenShop(npc);
  if (npcChatState.npc && npcChatState.npcType === npc.type && npcChatState.discount > 0) {
    const items = document.getElementById('shop-items');
    const discount = npcChatState.discount;
    const priceEls = items.querySelectorAll('.cost');
    for (const el of priceEls) {
      const match = el.textContent.match(/(\d+)G/);
      if (match) {
        const origPrice = parseInt(match[1]);
        const newPrice = Math.max(1, Math.floor(origPrice * (100 - discount) / 100));
        el.textContent = newPrice + 'G';
        el.title = `原价 ${origPrice}G（${discount}% 折扣）`;
        el.style.color = '#66bb6a';
      }
    }
    const goldEl = document.getElementById('shop-gold');
    if (goldEl) goldEl.textContent = '金币: '+player.gold+' | 当前折扣: '+discount+'%';
  }
};

const _origBuyItem = buyItem;
buyItem = function(item, npc) {
  let cost = item.cost;
  let discount = 0;
  if (npcChatState.npc && npcChatState.npcType === npc.type && npcChatState.discount > 0) {
    discount = npcChatState.discount;
    const newCost = Math.max(1, Math.floor(cost * (100 - discount) / 100));
    item.cost = newCost;
  }
  _origBuyItem(item, npc);
  if (discount > 0) {
    item.cost = cost;
  }
};

const _origSpawnNPCs = spawnNPCs;
spawnNPCs = function() {
  _origSpawnNPCs();
  for (const npc of npcs) {
    if (NPC_PERSONALITIES[npc.type]) {
      npc.personality = NPC_PERSONALITIES[npc.type];
    }
  }
};

const NPC_PERSONALITIES = {
  weaponsmith: {
    name: '锻钢', title: '前皇家铁匠',
    mood: 60, discount: 0,
    hiddenTriggers: {
      '虎贲': {
        effect: () => {
          addMsg('锻钢提到虎贲军时眼中闪着光...他似乎更加信任你了。','special');
          NPC_PERSONALITIES.weaponsmith.mood = Math.min(100, NPC_PERSONALITIES.weaponsmith.mood + 15);
          npcChatState.discount += 10;
        }
      },
      '龙鳞钢': {
        effect: () => {
          if (!npcChatState.triggeredEvents['weaponsmith']?.['龙鳞钢']) {
            addMsg('锻钢悄悄说他能用龙鳞钢为你打造一件武器...','special');
            if (typeof addHiddenShopItem === 'function') addHiddenShopItem('weaponsmith');
          }
        }
      },
    }
  },
  staffmaster: {
    name: '霜语', title: '古老贤者',
    mood: 50, discount: 0,
    hiddenTriggers: {
      '次元裂隙': {
        effect: () => {
          addMsg('霜语透露了地牢的秘密——它建在次元裂隙之上！','info');
        }
      },
      '霜语': {
        effect: () => {
          addMsg('霜语因你叫出他的法号而惊讶，对你另眼相看。','special');
          NPC_PERSONALITIES.staffmaster.mood = Math.min(100, NPC_PERSONALITIES.staffmaster.mood + 15);
          npcChatState.discount += 15;
        }
      },
    }
  },
  skillmaster: {
    name: '预言', title: '预言者',
    mood: 45, discount: 0,
    hiddenTriggers: {
      '预言': {
        effect: () => {
          addMsg('预言者说："烈火与寒冰交织，光明在第十层等待。"','info');
        }
      },
      '宿命': {
        effect: () => {
          const fbIdx=getSkillIndex('fireball');
          const healIdx=getSkillIndex('heal');
          if (fbIdx>=0&&!skillSlots[fbIdx].unlocked) {
            skillSlots[fbIdx].unlocked = true;
            addMsg('预言者赠送了你一本火球术卷轴！','special');
          } else if (healIdx>=0&&!skillSlots[healIdx].unlocked) {
            skillSlots[healIdx].unlocked = true;
            addMsg('预言者赠送了你一本治愈术卷轴！','special');
          } else {
            player.atk += 1;
            addMsg('预言者赐予你「命运之力」，攻击力+1！','special');
          }
          spawnLevelUpParticles(player.x*TILE+TILE/2, player.y*TILE+TILE/2);
        }
      },
    }
  },
  healer: {
    name: '圣光', title: '光明牧师',
    mood: 55, discount: 0,
    hiddenTriggers: {
      '圣光': {
        effect: () => {
          addMsg('圣光向你倾诉了她的迷茫...她在这地牢中待了太久。','info');
        }
      },
      '救赎': {
        effect: () => {
          const healAmt = Math.floor(player.maxHp * 0.3);
          player.hp = Math.min(player.maxHp, player.hp + healAmt);
          addMsg('圣光为你祈祷，恢复了'+healAmt+'点生命！','heal');
          spawnHealParticles(player.x*TILE+TILE/2, player.y*TILE+TILE/2);
        }
      },
    }
  },
  enchanter: {
    name: '星辰', title: '星穹学者',
    mood: 50, discount: 0,
    hiddenTriggers: {
      '星辰': {
        effect: () => {
          addMsg('星辰对谈论星星非常兴奋！他似乎准备给你看些好东西。','special');
        }
      },
      '虚空': {
        effect: () => {
          if (Math.random() < 0.5) {
            player.atk += 2;
            addMsg('星辰展示了虚空之力！攻击力+2！','special');
            spawnLevelUpParticles(player.x*TILE+TILE/2, player.y*TILE+TILE/2);
          } else {
            player.hp = Math.max(1, player.hp - 5);
            addMsg('虚空之力反噬！损失5点生命！','damage');
            spawnParticles(player.x*TILE+TILE/2, player.y*TILE+TILE/2, '#9c27b0', 10, {spread:1.5});
          }
        }
      },
    }
  }
};

function addHiddenShopItem(npcType) {
  const npc = npcs.find(n => n.type === npcType);
  if (!npc) return;
  switch (npcType) {
    case 'weaponsmith':
      if (!npc.shop.find(i => i.id === 'hidden_dragon')) {
        npc.shop.push({
          id: 'hidden_dragon', name: '🐉 龙鳞刀',
          desc: '由传说中的龙鳞钢打造！攻击力+8',
          cost: Math.floor(120 * (1 + Math.floor(floor/3) * 0.2)),
          effect: () => { player.atk += 8; addMsg('龙鳞刀散发出耀眼的寒光！攻击力+8！','special'); }
        });
        addMsg('锻钢向你展示了珍藏的龙鳞刀！','special');
      }
      break;
    case 'staffmaster':
      if (!npc.shop.find(i => i.id === 'hidden_rift')) {
        npc.shop.push({
          id: 'hidden_rift', name: '🌀 裂隙法杖',
          desc: '蕴含次元裂隙之力！防御+3 生命+15',
          cost: Math.floor(100 * (1 + Math.floor(floor/3) * 0.2)),
          effect: () => { player.def += 3; player.maxHp += 15; player.hp += 15; addMsg('裂隙法杖的魔力涌入体内！','special'); }
        });
        addMsg('霜语从暗处取出一柄泛着蓝光的法杖...','special');
      }
      break;
  }
}
