// 简易 HTTP 服务器，用于在手机上测试记账APP
var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = 8080;
var ROOT = __dirname; // src 目录

// MIME 类型映射
var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

var server = http.createServer(function (req, res) {
  var url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  var filePath = path.join(ROOT, url);

  // 安全检查：防止路径穿越
  if (filePath.indexOf(ROOT) !== 0) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    var ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, function () {
  console.log('服务器已启动: http://localhost:' + PORT);
  console.log('手机访问: http://你的电脑IP:' + PORT);
});
