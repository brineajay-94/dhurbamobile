const { app, BrowserWindow } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ADMIN_DIR = path.join(__dirname, 'admin');
const PORT = 0;
const APP_NAME = 'Dhurba Admin';

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.json': 'application/json', '.txt': 'text/plain'
};

function startServer(cb) {
  const srv = http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';
    const filePath = path.join(ADMIN_DIR, url);
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  srv.listen(PORT, () => cb(srv.address().port));
  srv.on('error', () => app.quit());
}

function createShortcut() {
  const desktop = process.env.USERPROFILE
    ? path.join(process.env.USERPROFILE, 'Desktop')
    : path.join('C:\\Users\\Public', 'Desktop');
  const shortcutPath = path.join(desktop, APP_NAME + '.lnk');
  if (fs.existsSync(shortcutPath)) return;
  const tmpFile = path.join(app.getPath('temp'), 'mklnk-' + Date.now() + '.ps1');
  const script = `
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')
$s.TargetPath = '${process.execPath.replace(/'/g, "''")}'
$s.WorkingDirectory = '${path.dirname(process.execPath).replace(/'/g, "''")}'
$s.Description = '${APP_NAME}'
$s.Save()
  `.trim();
  fs.writeFileSync(tmpFile, script, 'utf8');
  execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpFile], () => {
    fs.unlink(tmpFile, () => {});
  });
}

app.whenReady().then(() => {
  createShortcut();
  startServer((port) => {
    const win = new BrowserWindow({
      width: 1400, height: 900,
      minWidth: 1024, minHeight: 600,
      title: APP_NAME,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    win.loadURL('http://localhost:' + port);
    win.setMenuBarVisibility(false);
  });
});
