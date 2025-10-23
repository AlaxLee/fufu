const stage = document.getElementById('stage');
const sprite = document.getElementById('sprite');
const chat = document.getElementById('chat');
const chatCloseBtn = document.getElementById('chat-close');
const chatSendBtn = document.getElementById('chat-send');
const chatInput = document.getElementById('chat-text');
const chatMessages = document.querySelector('.chat-messages');

// 素材路径：index.html 位于 src/ 下，assets 在项目根目录
const IDLE_CANDIDATES = [
  '../assets/furina_idle.gif',   // 你偏好循环 GIF，若存在则使用
  '../assets/furina_idle.png'    // 回退到 PNG（当前已存在）
];
const ACTION_SRC = '../assets/furina_action.gif'; // 点击播放一次
const ACTION_DURATION_MS = 2000; // 根据你的 GIF 实际时长调整

function setImageWithFallback(img, sources) {
  let idx = 0;
  const trySet = () => {
    if (idx >= sources.length) return;
    img.onerror = () => { idx++; trySet(); };
    img.src = sources[idx];
  };
  trySet();
}

function setIdle() {
  setImageWithFallback(sprite, IDLE_CANDIDATES);
}

let playing = false;
let dragging = false;
let dragInitiated = false;
let dragStartX = 0, dragStartY = 0;
let chatVisible = false;

function triggerAction() {
  if (playing) return;
  playing = true;
  sprite.onerror = null; // 动作素材不存在时不循环回退
  sprite.src = ACTION_SRC;
  setTimeout(() => { setIdle(); playing = false; }, ACTION_DURATION_MS);
}

function openChat() {
  if (chatVisible) return;
  chatVisible = true;
  chat.classList.add('visible');
  // 展开窗口并禁用穿透，确保聊天可交互
  window.api?.setMousePassthrough(false);
  window.api?.chatOpen?.(300);
}

function closeChat() {
  if (!chatVisible) return;
  chatVisible = false;
  chat.classList.remove('visible');
  window.api?.chatClose?.(300);
}

// 默认穿透；进入角色区域可交互，离开恢复穿透（聊天打开时不恢复）
stage.addEventListener('mouseenter', () => window.api?.setMousePassthrough(false));
stage.addEventListener('mouseleave', () => {
  if (dragging || chatVisible) return;
  window.api?.setMousePassthrough(true);
});

// 双击：打开聊天 + 播放动作
stage.addEventListener('dblclick', () => {
  openChat();
  triggerAction();
});

stage.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // 仅左键拖拽
  dragging = true;
  dragInitiated = false;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
});

stage.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dx = e.screenX - dragStartX;
  const dy = e.screenY - dragStartY;
  if (!dragInitiated && (dx * dx + dy * dy) > 9) {
    window.api?.dragStart(dragStartX, dragStartY);
    dragInitiated = true;
  }
  if (dragInitiated) {
    window.api?.dragMove(e.screenX, e.screenY);
  }
});

stage.addEventListener('mouseup', () => {
  if (dragging && dragInitiated) {
    window.api?.dragEnd();
  }
  dragging = false;
  dragInitiated = false;
});

chatCloseBtn?.addEventListener('click', () => {
  closeChat();
});

chatSendBtn?.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  const div = document.createElement('div');
  div.textContent = `你: ${text}`;
  chatMessages.appendChild(div);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 初始显示 Idle
setIdle();