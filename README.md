# ECDSA-Exchange

## Server

To run the server:
```
cd server
node index.js
```
This will display the addresses, public keys, and private keys that are present on the server.


## Client

To run the client:
```
cd client
npx parcel index.html
```
Navigate to `localhost:1234` in a browser to interact with the client.


## Generating Signatures

You will need the information printed by the server process when it is started.

Specifically:
  - Sender address
  - Recipient address
  - Amount in transaction
  - Private key of sender
  - (optional) Public key of sender - this will enable verification of the signature using the same process present in the server


To generate a signature:
```
cd utils
node sign-transaction.js
```
Follow the prompts and provide the requested information for each.
