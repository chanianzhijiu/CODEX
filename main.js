const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const sizeStat = document.getElementById("sizeStat");
const levelStat = document.getElementById("levelStat");
const comboStat = document.getElementById("comboStat");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const tipText = document.getElementById("tipText");
const zoneList = document.getElementById("zoneList");

const tips = [
  "提示：靠近海草区可以暂时隐身，避免大型掠食者。",
  "提示：连击满 10 后开启狂暴冲刺，速度翻倍！",
  "提示：热泉附近会补充能量，但也会吸引强敌。",
  "提示：在深海层时视野变暗，记得开启探照技能。",
  "提示：优先吞噬同层级的小鱼，升级更稳定。",
];

const zones = [
  { name: "珊瑚浅湾", effect: "刷新大量小型鱼群" },
  { name: "深蓝裂谷", effect: "大型掠食者聚集" },
  { name: "海草迷宫", effect: "隐身与加速" },
  { name: "热泉环带", effect: "能量恢复" },
  { name: "幽光水域", effect: "视野降低但稀有鱼种出没" },
];

const fishCatalog = [
  "银梭鱼",
  "斑点河豚",
  "紫纹刺鱼",
  "蓝鳍小枪鱼",
  "霓虹凤尾鱼",
  "红鳍鲷",
  "碧影鲶",
  "海月水母",
  "金鳞鲤",
  "珊瑚剑鱼",
  "蓝影魔鬼鱼",
  "幽光鳗",
  "彩虹孔雀鱼",
  "琥珀狮子鱼",
  "深渊灯笼鱼",
  "翡翠海龟",
  "暴风鲨",
  "暗潮大王乌贼",
  "烈焰旗鱼",
  "晶鳞锦鲤",
  "赤霞海星",
  "白沙蝠鲼",
  "烈牙剑鲨",
  "绿影刀鱼",
  "流银大眼鱼",
  "金环鳝",
  "苍蓝巨鲈",
  "烈日翻车鱼",
  "紫晶鲍",
  "珊瑚鹦嘴鱼",
  "暮光电鳗",
  "幻影鲽",
  "霜蓝龙鱼",
  "翡翠蝶鱼",
  "暮色银鲳",
  "赤鳍鲨",
  "冰河旗鱼",
  "霞光海马",
  "蓝焰鲸鲨",
  "晶核鲨",
  "玄铁虎鲨",
  "晨曦虎鲸",
];

const state = {
  player: {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 16,
    speed: 2.6,
    energy: 100,
  },
  fish: [],
  bubbles: [],
  score: 0,
  combo: 0,
  level: 1,
  paused: false,
  skillIndex: 0,
  tick: 0,
};

const skills = [
  { name: "磁吸", desc: "吸引附近小鱼" },
  { name: "海流加速", desc: "短暂提高速度" },
  { name: "伪装", desc: "降低被追踪概率" },
];

const keyState = new Set();

const spawnFish = (count = 60) => {
  const newFish = [];
  for (let i = 0; i < count; i += 1) {
    newFish.push(makeFish());
  }
  state.fish = newFish;
};

const makeFish = () => {
  const tier = Math.floor(Math.random() * 8) + 1;
  const radius = 6 + tier * 3 + Math.random() * 6;
  const isPredator = tier >= 6;
  return {
    id: crypto.randomUUID(),
    name: fishCatalog[Math.floor(Math.random() * fishCatalog.length)],
    tier,
    radius,
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * (1.2 + tier * 0.2),
    vy: (Math.random() - 0.5) * (1.2 + tier * 0.2),
    color: isPredator ? "#ff8b8b" : "#79d3ff",
    isPredator,
  };
};

const spawnBubbles = () => {
  state.bubbles = Array.from({ length: 30 }, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 300,
    r: Math.random() * 3 + 1,
    vy: Math.random() * -0.6 - 0.2,
  }));
};

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(14, 70, 115, 0.65)");
  gradient.addColorStop(1, "rgba(4, 18, 32, 0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#74d7ff";
  for (const bubble of state.bubbles) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawFish = (fish) => {
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.radius * 1.4, fish.radius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(fish.radius * 0.7, -fish.radius * 0.2, fish.radius * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(4, 18, 32, 0.6)";
  ctx.beginPath();
  ctx.arc(fish.radius * 0.8, -fish.radius * 0.2, fish.radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawPlayer = () => {
  const { player } = state;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = "#fbd36b";
  ctx.beginPath();
  ctx.ellipse(0, 0, player.size * 1.6, player.size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff6c1";
  ctx.beginPath();
  ctx.arc(player.size * 0.8, -player.size * 0.2, player.size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1c0a";
  ctx.beginPath();
  ctx.arc(player.size * 0.85, -player.size * 0.2, player.size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const updateStats = () => {
  sizeStat.textContent = state.player.size.toFixed(1);
  levelStat.textContent = state.level;
  comboStat.textContent = state.combo;
};

const updateTips = () => {
  if (state.tick % 360 === 0) {
    tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
  }
};

const updateZones = () => {
  zoneList.innerHTML = "";
  zones.forEach((zone) => {
    const li = document.createElement("li");
    li.textContent = `${zone.name}：${zone.effect}`;
    zoneList.appendChild(li);
  });
};

const applySkillEffect = () => {
  const skill = skills[state.skillIndex];
  if (!skill) return;
  if (skill.name === "磁吸") {
    state.fish.forEach((fish) => {
      const dx = state.player.x - fish.x;
      const dy = state.player.y - fish.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 140 && fish.radius < state.player.size) {
        fish.vx += dx / (distance + 20);
        fish.vy += dy / (distance + 20);
      }
    });
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const movePlayer = () => {
  const { player } = state;
  const speedBoost = keyState.has(" ") && player.energy > 5 ? 1.8 : 1;
  const speed = player.speed * speedBoost;

  if (keyState.has("ArrowUp") || keyState.has("w")) player.y -= speed;
  if (keyState.has("ArrowDown") || keyState.has("s")) player.y += speed;
  if (keyState.has("ArrowLeft") || keyState.has("a")) player.x -= speed;
  if (keyState.has("ArrowRight") || keyState.has("d")) player.x += speed;

  player.x = clamp(player.x, player.size, canvas.width - player.size);
  player.y = clamp(player.y, player.size, canvas.height - player.size);

  if (speedBoost > 1) {
    player.energy = Math.max(0, player.energy - 0.4);
  } else {
    player.energy = Math.min(100, player.energy + 0.2);
  }
};

const moveFish = () => {
  state.fish.forEach((fish) => {
    fish.x += fish.vx;
    fish.y += fish.vy;
    if (fish.x < 0 || fish.x > canvas.width) fish.vx *= -1;
    if (fish.y < 0 || fish.y > canvas.height) fish.vy *= -1;

    if (fish.isPredator) {
      const dx = state.player.x - fish.x;
      const dy = state.player.y - fish.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 220) {
        fish.vx += (dx / dist) * 0.02;
        fish.vy += (dy / dist) * 0.02;
      }
    }
  });
};

const updateBubbles = () => {
  state.bubbles.forEach((bubble) => {
    bubble.y += bubble.vy;
    if (bubble.y < -10) {
      bubble.y = canvas.height + Math.random() * 200;
      bubble.x = Math.random() * canvas.width;
    }
  });
};

const handleCollisions = () => {
  const { player } = state;
  state.fish = state.fish.filter((fish) => {
    const dx = player.x - fish.x;
    const dy = player.y - fish.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.size + fish.radius) {
      if (fish.radius <= player.size * 0.9) {
        player.size += fish.radius * 0.08;
        state.score += Math.round(fish.radius * 2);
        state.combo = Math.min(20, state.combo + 1);
        return false;
      }
      if (fish.radius > player.size * 1.1) {
        player.size = Math.max(12, player.size - 2);
        state.combo = 0;
      }
    }
    return true;
  });
};

const updateLevel = () => {
  state.level = Math.floor(state.player.size / 8);
  if (state.fish.length < 40) {
    state.fish.push(makeFish(), makeFish(), makeFish());
  }
};

const renderHUDOverlay = () => {
  const { player } = state;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(20, 20, 180, 60);
  ctx.fillStyle = "#e6f7ff";
  ctx.font = "14px sans-serif";
  ctx.fillText(`能量: ${Math.round(player.energy)}`, 30, 45);
  ctx.fillText(`技能: ${skills[state.skillIndex].name}`, 30, 65);
  ctx.restore();
};

const draw = () => {
  drawBackground();
  state.fish.forEach(drawFish);
  drawPlayer();
  renderHUDOverlay();
};

const tick = () => {
  if (state.paused) {
    requestAnimationFrame(tick);
    return;
  }
  state.tick += 1;
  movePlayer();
  moveFish();
  updateBubbles();
  handleCollisions();
  updateLevel();
  applySkillEffect();
  updateStats();
  updateTips();
  draw();
  requestAnimationFrame(tick);
};

const reset = () => {
  state.player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 16,
    speed: 2.6,
    energy: 100,
  };
  state.score = 0;
  state.combo = 0;
  state.level = 1;
  spawnFish(80);
  spawnBubbles();
  updateStats();
};

window.addEventListener("keydown", (event) => {
  keyState.add(event.key.toLowerCase());
  if (event.key === "q") {
    state.skillIndex = (state.skillIndex + skills.length - 1) % skills.length;
  }
  if (event.key === "e") {
    state.skillIndex = (state.skillIndex + 1) % skills.length;
  }
});

window.addEventListener("keyup", (event) => {
  keyState.delete(event.key.toLowerCase());
});

pauseBtn.addEventListener("click", () => {
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? "继续" : "暂停";
});

restartBtn.addEventListener("click", () => {
  reset();
});

updateZones();
reset();
tick();
