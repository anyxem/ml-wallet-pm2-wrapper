const http = require('http');
var cp = require('child_process');
const crypto = require('crypto');
const { Buffer } = require('buffer');

function decrypt(text) {
  let iv = Buffer.from(text.split(':')[0], 'hex');
  let encryptedText = Buffer.from(text.split(':')[1], 'hex');
  let decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    // eslint-disable-next-line no-undef
    Buffer.from(process.env.CRYPTO_SECRET),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const wallet = '/home/admin/mintlayer/wallet-cli';
const child = cp.spawn(wallet, ['testnet', '--wallet-file=/home/admin/mintlayer/wallet/wallet_pi1']);

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
      const result = { balance: data.toString().trim(), tip: currentHash, lastBlockDate };
      res.end(JSON.stringify(result));
      child.stdout.removeListener('data', displayBalance);
      return;
    }
    child.stdout.on('data', displayBalance);
    child.stdin.write('getbalance\n');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
  return;
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

