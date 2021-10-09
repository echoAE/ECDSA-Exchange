const express = require('express');
const app = express();
const cors = require('cors');
const EC = require('elliptic').ec;
const keccak256 = require('js-sha3').keccak256;
const port = 3042;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

// specify the number of accounts
const numAccounts = 3;

// initialize the EC context
var ec = new EC('secp256k1');

// generate key Objects
const privateKeys = [...Array(numAccounts)].map(() => ec.genKeyPair() );

// get corresponding public keys from the key Objects
const publicKeys = privateKeys.map((key) => key.getPublic().encode('hex'));

// use Ethereum address calculation
function getAddressFromPublicKey(key) {

  // Take the Keccak-256 hash of the public key
  const hash = keccak256(key);

  // take the last 20 bytes (40 characters) of the hashed value
  const address = '0x'.concat(hash.slice(hash.length - 40));

  return address;
}

// create account addresses from public keys
const addresses = publicKeys.map((key) => getAddressFromPublicKey(key));

// create Object that stores account balances
const balances = {};
addresses.forEach((address) => balances[address] = 100);

function displayAccountsAndKeys() {
  // add a new line for output formatting
  console.log('');

  // display information about accounts
  console.log('Available Accounts');
  console.log('==================');
  for (let i=0; i < addresses.length; i++) {
    console.log(`(${i}) ${addresses[i]} (${balances[addresses[i]]} ETH)`);
  }

  // add a new line for output formatting
  console.log('');

  // display private keys
  console.log('Private Keys');
  console.log('==================');
  for (let i=0; i < privateKeys.length; i++) {
    console.log(`(${i}) 0x${privateKeys[i].getPrivate('hex')}`);
  }

  // add a new line for output formatting
  console.log('');
}

displayAccountsAndKeys();

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {sender, recipient, amount} = req.body;
  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
