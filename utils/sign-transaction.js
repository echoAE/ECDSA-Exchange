const EC = require('elliptic').ec;
const sha3_256 = require('js-sha3').sha3_256;
const readline = require('readline');

// create and initialize EC context
var ec = new EC('secp256k1');

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function integerArrayToHexString(arr) {
  let outputString = '';
  for (let i=0; i<arr.length; i++) {
    // zero pad each hex string, as necessary
    outputString += arr[i].toString(16).padStart(2, '0');
  }
  return outputString;
}

console.log('==============================================================');
console.log('DO NOT INCLUDE THE LEADING "0x" BEFORE PUBLIC AND PRIVATE KEYS');
console.log('==============================================================');

r1.question('Sender address? ', (sender) => {
  r1.question('Recipient address? ', (recipient) => {
    r1.question('Amount? ', (amount) => {
      r1.question('Private key? ', (privateKey) => {

        // trim the leading '0x' if the user accidentally left it on
        if (privateKey.toLowerCase().startsWith('0x')) {
          privateKey = privateKey.slice(2);
        }

        // construct the transaction to sign
        const transaction = JSON.stringify({
          sender, recipient, amount
        });
        console.log(`Transaction: ${transaction}`);

        // calculate the hash of the transaction
        const hash = sha3_256(transaction);
        console.log(`Hash of transaction: ${hash}`);

        // create a key Object from the provided private key
        const key = ec.keyFromPrivate(privateKey);

        // generate the signature from the transaction and private key Object
        const signature = key.sign(hash);

        // export Distinguished Encoding Rules (DER) encoded signature in Array
        const derSign = signature.toDER();

        // convert to a hex string
        const derSignHexString = integerArrayToHexString(derSign);
        console.log('DER Signature Hex String: ', derSignHexString);

        r1.question('Public key? ', (publicKey) => {

          // trim the leading '0x' if the user accidentally left it on
          if (publicKey.toLowerCase().startsWith('0x')) {
            publicKey = publicKey.slice(2);
          }

          const keyVerify = ec.keyFromPublic(publicKey, 'hex');
          const result = keyVerify.verify(hash, derSignHexString);
          console.log('Verification result: ', result);

          r1.close();
        });
      });
    });
  });
});

