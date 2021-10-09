const express = require('express');
const app = express();
const cors = require('cors');
const EC = require('elliptic').ec;
const keccak256 = require('js-sha3').keccak256;
const sha3_256 = require('js-sha3').sha3_256;
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

  // display public keys
  // it is helpful to output these for use in the sign-transaction.js module to verify signatures
  // before sending them through the client to the server
  console.log('Public Keys');
  console.log('==================');
  for (let i=0; i < publicKeys.length; i++) {
    console.log(`(${i}) 0x${publicKeys[i]}`);
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

function hexStringToIntegerArray(hexString) {
  const output = [];
  while (hexString.length) {
    // grab the first byte from the hex string
    var hexValue = hexString.substr(0, 2);

    // convert the hex string value to an 8-bit unsigned integer
    hexValue = parseInt(hexValue, 16);

    // add the 8-bit unsigned integer to the array
    output.push(hexValue);

    // remove the hex string characters just processed
    hexString = hexString.substr(2);
  }
  return output;
}

function verifySignature(sender, transaction, signature) {

  // look up the public key that corresponds to the purported sender
  const index = addresses.indexOf(sender);
  if (index === -1) {
    // we have no public key corresponding to the specified sender
    return false;
  }

  // get the public key
  const keyString = publicKeys[index];

  // calculate the hash of the transaction
  const hash = sha3_256(transaction);

  // create key Object from the public key
  const key = ec.keyFromPublic(keyString, 'hex');

  const result = key.verify(hash, signature);

  // return the verification result
  return key.verify(hash, signature);

}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {sender, recipient, amount, signature} = req.body;

  // reconstruct the transaction in preparation for verification
  const transaction = JSON.stringify({
    sender, recipient, amount
  }); 

  console.log('Transaction request received: ', transaction);

  // verify the signature before performing a transaction
  if (!verifySignature(sender, transaction, signature)) {
    console.log('\tSignature was not verified, not peforming transaction');
    return null;
  }
  console.log('\tSignature verified, checking amount and balances');

  // if we have made it here, the signature has been verified on the requested transaction
  // that does not necessarily mean that the transaction can be executed
  // for example, does the sender actually have the appropriate balance to support the transaction?
  if (amount < 0) {
    console.log('\tNegative transfer amounts not allowed')
    return null;
  }

  if (balances[sender] < amount) {
    // don't allow transfers when the account does not have an adequate balance
    console.log('\tInsufficient balance in sender address');
    return null;
  }

  console.log('\tProceeding with transaction...');
  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  console.log('\tNew balances:');
  console.log(`\t\t${sender}: ${balances[sender]} ETH`);
  console.log(`\t\t${recipient}: ${balances[recipient]} ETH`);

  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
