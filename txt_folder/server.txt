// Minimal Node static file server — no dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5000;
const root = process.cwd();

const mime = {
  '.html':'text/html', '.htm':'text/html', '.css':'text/css', '.js':'application/javascript',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.txt':'text/plain'
};

const server = http.createServer((req,res)=>{
  try{
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if(urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(root, urlPath);
    // prevent escaping
    if(!filePath.startsWith(root)) return send404(res);
    fs.stat(filePath, (err, stat) => {
      if(err) return send404(res);
      if(stat.isDirectory()) return send404(res);
      const ext = path.extname(filePath).toLowerCase();
      const type = mime[ext] || 'application/octet-stream';
      res.writeHead(200, {'Content-Type': type});
      const stream = fs.createReadStream(filePath);
      stream.on('error', ()=> send404(res));
      stream.pipe(res);
    });
  } catch(e){ send404(res); }
});

function send404(res){ res.statusCode = 404; res.setHeader('Content-Type','text/plain'); res.end('404 Not Found'); }

server.listen(port, ()=> console.log(`Static server running at http://localhost:${port}/`));
