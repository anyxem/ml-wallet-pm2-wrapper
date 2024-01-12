const http = require('http');
var cp = require('child_process');
const fs = require('node:fs');

const PATH_WALLET_CLI = process.env.PATH_WALLET_CLI || '';
const PATH_WALLET = process.env.PATH_WALLET || '';
const NETWORK = process.env.NETWORK || 'testnet';

const wallet = PATH_WALLET_CLI;
const child = cp.spawn(wallet, [NETWORK, '--wallet-file=' + PATH_WALLET]);

child.stdin.write('startstaking\n');

let currentHash = '';
let lastHashBeforeSent = '';
let lastBlockDate = '';

// child.stdout.on('data', function (data) {
//   console.log('stdout: ' + data);
// });

child.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
  const str = data.toString().trim();
  // Extract date and block ID using regular expressions
  const dateRegex = /\[(.*?) INFO/;
  const blockIdRegex = /block id: (.*?)$/;

  const dateMatch = str.match(dateRegex);
  const blockIdMatch = str.match(blockIdRegex);

  const date = dateMatch ? dateMatch[1] : null;
  const blockId = blockIdMatch ? blockIdMatch[1] : null;
  if (date && blockId) {
    // update currentHash
    console.log('update currentHash', blockId);
    currentHash = blockId;
    lastBlockDate = date;
  }
});

child.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
  if(data.includes('INFO wallet_controller::sync: Wallet syncing done to height')){
    currentHash = data.toString().trim().split('INFO wallet_controller::sync: Wallet syncing done to height ')[1];
  }
});

const hostname = '0.0.0.0';
const port = 8080;
const averageBlockTime = 120; // seconds

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('homepage');
    return;
  }

  if (req.url === '/balance' && req.method === 'GET') {
    const displayBalance = function (data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const result = { balance: data.toString().trim(), tip: currentHash };
      res.end(JSON.stringify(result));
      child.stdout.removeListener('data', displayBalance);
      return;
    }
    child.stdout.on('data', displayBalance);
    child.stdin.write('getbalance\n');
    return;
  }

  if (req.url === '/poolbalance' && req.method === 'GET') {
    const displayBalance = function (data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const result = { pooldata: data.toString().trim(), tip: currentHash };
      res.end(JSON.stringify(result));
      child.stdout.removeListener('data', displayBalance);
      return;
    }
    child.stdout.on('data', displayBalance);
    child.stdin.write('listpoolids\n');
    return;
  }

  if (req.url === '/logs' && req.method === 'GET') {
    const logs_file = '/home/admin/.pm2/logs/app-out.log';
    fs.readFile(logs_file, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      res.end(data);
      return;
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
  return;
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

