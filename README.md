BTC Markets Javascript API Client
===============
[![npm version](https://badge.fury.io/js/btc-markets.svg)](https://badge.fury.io/js/btc-markets)

This library is a node.js wrapper for the private and public methods exposed by the [BTC Markets API](https://github.com/BTCMarkets/API).
You will need to have a registered account with [BTC Markets](https://btcmarkets.net) and generated API keys to access the private methods.

Please contact support@btcmarkets.net if you are having trouble opening an account or generating an API key. 

### Install

`npm install btc-markets`

### Version 1.0.x
This library has bee upgraded to be written in TypeScript and use promises. If you want the old version that used to callbacks, then use [v0.0.10](https://github.com/naddison36/btc-markets/tree/v0.0.10).

Other changes are:
- Removed the Underscore dependency
- Added static numberConverter to convert decimal numbers to BTC Markets API integers
- Added withdrawalHistory API (still in preview so not tested)

### Design Principles
- **thin** the client is just a simple wrapper to the BTC Markets API. There is no parameter validation as this is delegated to the BTC Market API server. Similarly, there is no data transformation.
- **errors** all errors are returned as Error objects which can be used programmatically or for debugging
- **no retries** it's up to the calling program to handle retries as it'll vary between programs. For example, error handling timeouts on mutable API calls like addTrade and cancelOrder is not as simple as retying the API call as the operation may have been successful on the exchange but the response back was not.

### Error handling
The first parameter to each API function is a callback function which is passed error and data objects.

The error object is an instance of [VError](https://github.com/davepacheco/node-verror) which is an extension of the standard Error object.
The three main properties are:
- **message** a description of the error with all the available information so problems in production can be diagnosed. For example, the url, http request method, parameters, error codes and messages
- **name** the HTTP error code or BTC Markets error message so specific errors can be programatically detected.
- **cause** the underlying error object. eg the error object from a failed request or json parse. Note there will be no cause error for BTC Markets errors

### Security Warning
Do not commit your API keys into public source code repositories. These can be in code, config files or IDE config files used to run tests or processes.

If you can't avoid committing API keys into your repo then use something like [git-crypt](https://github.com/AGWA/git-crypt).

Most cloud providers now offer solutions for securely storing API keys. For example:
* Google [Key Management Service (KMS](https://cloud.google.com/kms/)
* AWS [Key Management Service (KMS)](https://aws.amazon.com/kms/)
* Azure [Key Vault](https://azure.microsoft.com/en-au/services/key-vault/)
* Kubernetes [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)

And while I'm at it, make sure you enable two-factor authentication. Your account is easy to hack without 2FA enabled. You have been warned!

### Donations
If you'd like to thank me for this library, you can always donate some of your crypto trading profits to:
* BTC 13CPGPRf63nVWFkdnJgmvC4K69YGeR4zNn
* ETH 0x775053A6125cB51e618Eb132f00E93d6033934AD

### Examples
The following is from [examples.js](./examples.js)
```javascript
//const BTCMarkets = require('btc-markets').default;  // if you are using JavaScript
import BTCMarkets from 'btc-markets';   // if you are using TypeScript or Babel

// Either pass your API key and secret as the first and second parameters to examples.js. eg
// node examples.js your-api-key your-api-secret
//
// Or enter them below.
// WARNING never commit your API keys into a public repository.
const key = process.argv[2] || 'your-api-key';
const secret = process.argv[3] || 'your-api-secret';

const client = new BTCMarkets(key, secret);

// get latest prices
const tick = await client.getTick("BTC", "AUD");

// get order book
const orderBook = await client.getOrderBook("BTC", "AUD");

// get market trades since 728992317
const trades = await client.getTrades("BTC", "AUD", 728992317);

// limit buy order for of 0.001 ETH at 1000 AUD
const limitOrder = await client.createOrder("ETH", "AUD", 500 * BTCMarkets.numberConverter, 0.001 * BTCMarkets.numberConverter, 'Bid', 'Limit', "10001");

//market sell for 0.001 BTC
const marketOrder = await client.createOrder("BTC", "AUD", null, 0.001 * BTCMarkets.numberConverter, 'Ask', 'Market', null);

// cancel two limit orders with id's 1132477709 and 1133590603
const cancelledOrders = await client.cancelOrders([1132477709, 1133590603]);

const accountBalances = await client.getAccountBalances();

// get trading fee for a trading pair
const tradingFee = await client.getTradingFee("BTC", "AUD");

// get order details
const orderDetails = await client.getOrderDetail([206855175, 23988196]);

// get all trades since the start of time
const tradeHistory = await client.getTradeHistory("BTC", "AUD", undefined, null);

// get 50 orders since the start of time
const orderHistory = await client.getOrderHistory("BTC", "AUD", 50, null);

// get my open orders
const openOrders = await client.getOpenOrders('BTC', 'AUD', 10, null);

// withdrawal 0.05 ETH
const cryptoWithdrawal = await client.withdrawCrypto(0.05 * BTCMarkets.numberConverter, "0x775053A6125cB51e618Eb132f00E93d6033934AD", "ETH");

// withdrawal 0.05 ETH
const withdrawHistory = await client.withdrawHistory(null, null, null);
```