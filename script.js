// ===== Settings (改這裡就好) =====
const DISCORD_USER_ID = "1180760727942860820"; // 你的 Discord User ID
const LINKS = {
  discordInvite: "https://discord.gg/WKqDca9Cjp",
  github: "https://github.com",
  instagram: "https://instagram.com/rexvamutrruv1",
};

// ===== i18n =====
const I18N = {
  zh: {
    bio: "數位創作者｜Discord 社群經營",
    discord_server: "Discord 社群",
    github_profile: "GitHub 個人頁",
    instagram_profile: "Instagram",
    all_links: "All links",
    back: "← 返回",
    links_title: "All links",
    links_desc: "所有個人連結一覽",
    status_online: "線上",
    status_idle: "閒置",
    status_dnd: "請勿打擾",
    status_offline: "離線",
  },
  en: {
    bio: "Digital creator · Discord community",
    discord_server: "Discord server",
    github_profile: "GitHub profile",
    instagram_profile: "Instagram",
    all_links: "All links",
    back: "← Back",
    links_title: "All links",
    links_desc: "All links in one place",
    status_online: "Online",
    status_idle: "Idle",
    status_dnd: "Do not disturb",
    status_offline: "Offline",
  }
};

function getLang(){
  return localStorage.getItem("lang") || "zh";
}

function setLang(lang){
  localStorage.setItem("lang", lang);
  applyI18n();
}

function applyI18n(){
  const lang = getLang();
  const dict = I18N[lang] || I18N.zh;

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  // 狀態字（如果已經有狀態）
  if (window.__presenceState) {
    renderPresence(window.__presenceState);
  }
}

function wireLangToggle(){
  const btn = document.getElementById("langToggle");
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    setLang(getLang()==="zh" ? "en" : "zh");
  });
}

// ===== ripple positioning =====
function wireRipple(){
  document.querySelectorAll(".ripple").forEach(el=>{
    el.addEventListener("pointerdown", (e)=>{
      const rect = el.getBoundingClientRect();
      const rx = ((e.clientX - rect.left) / rect.width) * 100;
      const ry = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--rx", rx + "%");
      el.style.setProperty("--ry", ry + "%");
    });
  });
}

// ===== Discord presence via Lanyard =====
function presenceColor(status){
  switch(status){
    case "online": return "#22c55e"; // green
    case "idle": return "#f59e0b";   // amber
    case "dnd": return "#ef4444";    // red
    default: return "#6b7280";       // gray
  }
}

function presenceText(status){
  const lang = getLang();
  const dict = I18N[lang] || I18N.zh;
  if(status === "online") return dict.status_online;
  if(status === "idle") return dict.status_idle;
  if(status === "dnd") return dict.status_dnd;
  return dict.status_offline;
}

function renderPresence(status){
  window.__presenceState = status;

  const dot = document.getElementById("presenceDot");
  const text = document.getElementById("presenceText");
  if(!dot || !text) return;

  dot.style.background = presenceColor(status);
  text.textContent = presenceText(status);
}

function connectLanyard(){
  // 只在首頁有狀態顯示的時候連
  if(!document.getElementById("presenceDot")) return;

  // 先顯示離線
  renderPresence("offline");

  const ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.addEventListener("open", ()=>{
    ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID }}));
  });

  ws.addEventListener("message", (event)=>{
    try{
      const msg = JSON.parse(event.data);

      // HELLO -> start heartbeats
      if(msg.op === 1 && msg.d?.heartbeat_interval){
        setInterval(()=>{
          try{ ws.send(JSON.stringify({ op: 3 })); }catch{}
        }, msg.d.heartbeat_interval);
      }

      // INIT_STATE
      if(msg.t === "INIT_STATE"){
        const p = msg.d;
        if(p?.discord_status) renderPresence(p.discord_status);
      }

      // PRESENCE_UPDATE
      if(msg.t === "PRESENCE_UPDATE"){
        const p = msg.d;
        if(p?.discord_status) renderPresence(p.discord_status);
      }
    }catch{}
  });

  ws.addEventListener("close", ()=> renderPresence("offline"));
  ws.addEventListener("error", ()=> renderPresence("offline"));
}

// ===== init =====
(function init(){
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  wireLangToggle();
  wireRipple();
  applyI18n();
  connectLanyard();
})();

