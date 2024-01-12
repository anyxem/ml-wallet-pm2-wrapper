const http = require('http');
var cp = require('child_process');
const fs = require('node:fs');

const PATH_WALLET_CLI = process.env.PATH_WALLET_CLI || '';
const PATH_WALLET = process.env.PATH_WALLET || '';
const NETWORK = process.env.NETWORK || 'testnet';
const CHAT_ID = process.env.CHAT_ID || '';
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';

const wallet = PATH_WALLET_CLI;
const child = cp.spawn(wallet, [NETWORK, '--wallet-file=' + PATH_WALLET]);

child.stdin.write('startstaking\n');

let lastKnownBlocksFound = 0;

let currentHash = '';
let lastHashBeforeSent = '';
let lastBlockDate = '';

const LOGFILE = '/home/admin/.pm2/logs/app-out.log';

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

child.stderr.on('data', async function (data) {
  console.log('stderr: ' + data);
  if(data.includes('INFO wallet_controller::sync: Wallet syncing done to height')){
    currentHash = data.toString().trim().split('INFO wallet_controller::sync: Wallet syncing done to height ')[1];
  }

  if(TELEGRAM_TOKEN && CHAT_ID && data.includes('New block generated successfully')){
    const displayBalance = async function (data) {
      const message = {chat_id: CHAT_ID, text: "New Block Found. " + data.toString().trim(), disable_notification: false};
      const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      child.stdout.removeListener('data', displayBalance);
      return;
    }
    child.stdout.on('data', displayBalance);
    child.stdin.write('listpoolids\n');
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
    const logs_file = LOGFILE;
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

