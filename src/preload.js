const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  setMousePassthrough(passthrough) {
    ipcRenderer.send('set-mouse-passthrough', passthrough);
  },
  dragStart(sx, sy) {
    ipcRenderer.send('drag-start', { screenX: sx, screenY: sy });
  },
  dragMove(sx, sy) {
    ipcRenderer.send('drag-move', { screenX: sx, screenY: sy });
  },
  dragEnd() {
    ipcRenderer.send('drag-end');
  },
  chatOpen(width) {
    ipcRenderer.send('chat-open', width);
  },
  chatClose(width) {
    ipcRenderer.send('chat-close', width);
  }
});