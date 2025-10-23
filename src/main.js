const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const iconPath = isDev
  ? path.join(__dirname, '..', 'assets', 'app-icon.ico')   // 开发环境
  : path.join(process.resourcesPath, 'assets', 'app-icon.ico'); // 打包后

let win = null;
let dragStartScreen = null;
let dragStartBounds = null;
let isDragging = false;
let isChatOpen = false;
let chatWidth = 0;

function createWindow() {
  const WIN_WIDTH = 300;
  const WIN_HEIGHT = 300;
  const margin = 5;
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
  const posX = areaX + areaWidth - WIN_WIDTH - margin;
  const posY = areaY + areaHeight - WIN_HEIGHT - margin;

  win = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    x: posX,
    y: posY,
    icon: iconPath,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true
    }
  });

  // 默认点击穿透；forward: true 允许页面收到鼠标移动/悬停事件
  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile(path.join(__dirname, 'index.html'));
}

// 渲染层请求切换穿透
ipcMain.on('set-mouse-passthrough', (_e, passthrough) => {
  if (win) win.setIgnoreMouseEvents(passthrough, { forward: true });
});

// 拖拽事件：开始、移动、结束
ipcMain.on('drag-start', (_e, pos) => {
  if (!win) return;
  dragStartScreen = { x: pos.screenX, y: pos.screenY };
  dragStartBounds = win.getBounds();
  isDragging = true;
});
ipcMain.on('drag-move', (_e, pos) => {
  if (!win || !isDragging || !dragStartScreen || !dragStartBounds) return;
  const dx = pos.screenX - dragStartScreen.x;
  const dy = pos.screenY - dragStartScreen.y;
  win.setPosition(dragStartBounds.x + dx, dragStartBounds.y + dy);
});
ipcMain.on('drag-end', () => {
  isDragging = false;
  dragStartScreen = null;
  dragStartBounds = null;
});

// 聊天面板：展开/收起窗口，右缘保持不动
ipcMain.on('chat-open', (_e, width) => {
  if (!win) return;
  if (isChatOpen) return;
  const b = win.getBounds();
  win.setBounds({ x: b.x - width, y: b.y, width: b.width + width, height: b.height });
  isChatOpen = true;
  chatWidth = width;
  // 聊天需要交互
  win.setIgnoreMouseEvents(false, { forward: true });
});

ipcMain.on('chat-close', (_e, width) => {
  if (!win) return;
  if (!isChatOpen) return;
  const w = width ?? chatWidth ?? 300;
  const b = win.getBounds();
  win.setBounds({ x: b.x + w, y: b.y, width: b.width - w, height: b.height });
  isChatOpen = false;
  chatWidth = 0;
  // 收起后恢复默认穿透（进入角色区域会自动禁用）
  win.setIgnoreMouseEvents(true, { forward: true });
});

// 可选：托盘图标与菜单
let tray;
app.whenReady().then(() => {
  tray = new Tray(iconPath);
  tray.setToolTip('Fufu Sprite');
  const contextMenu = Menu.buildFromTemplate([
    { label: '退出', click: () => app.quit() },
    { label: '退出', click: () => app.quit() }
  ]);
  tray.setContextMenu(contextMenu);
  createWindow();
});

app.on('window-all-closed', () => app.quit());