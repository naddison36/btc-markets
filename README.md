BTC Markets Javascript API Client
===============

This is a node.js wrapper for the private and public methods exposed by the [BTC Markets API](https://github.com/BTCMarkets/API).
You will need have a registered account with [BTC Markets](https://btcmarkets.net) and generated API keys to access the private methods.

Please contact support@btcmarkets.net if you are having trouble opening and account or generating an API key. 

### Install

`npm install btc-markets`

### Design Principles
- **thin** the client is just a simple wrapper to the BTC Markets API. There is no parameter validation as this is delegated to the BTC Market API server. Similarly, there is no data transformation.
- **errors** all errors are returned as Error objects which can be used programmatically or for debugging
- **no retries** it's up to the calling program to handle retries as it'll vary between programs. For example, error handling timeouts on mutable API calls like addTrade and cancelOrder is not as simple as retying the API call as the operation my have been successful on the exchange but the response back was not.

### Error handling
The first parameter to each API function is a callback function which is passed error and data objects.

The error object is an instance of [VError](https://github.com/davepacheco/node-verror) which is an extension of the standard Error object.
The three main properties are:
- **message** a description of the error with all the available information so problems in production can be diagnosed. For example the url, http request method, parameters, error codes and messages
- **name** the HTTP error code or BTC Markets error message so specific errors can be programatically detected.
- **cause** the underlying error object. eg the error object from a failed request or json parse. Note there will be no cause error for BTC Markets errors

### Examples

```js
var BTCMarkets = require('btc-markets');

var client = new BTCMarkets(key, secret);

var numberConverter = 100000000;    // one hundred million

// get latest prices
client.getTick("BTC", "AUD", function(err, data)
{
    console.log('bid ' + data.bestBid + ' ask ' + data.bestAsk + ' last price ' + data.lastPrice);
});

// get order book
client.getOrderBook("BTC", "AUD", function(err, data)
{
    console.log(data.asks.length + ' asks with best ask having price ' + data.asks[0][0] +
        ' and amount ' + data.asks[0][1]);
});

// limit buy order for of 0.01 BTC at 230 AUD
client.createOrder("BTC", "AUD", 230 * numberConverter, 0.01 * numberConverter, 'Bid', 'Limit', "10001", function(err, data)
{
    console.log(err, data);
});

// market sell for 0.0001 BTC
client.createOrder("BTC", "AUD", null, 0.0001 * numberConverter, 'Ask', 'Market', null, function(err, data)
{
    console.log(err, data);
});

// cancel two limit orders with id's 123456 and 987654
client.cancelOrder([123456,987654], function(err, data)
{
    console.log('first order was cancelled ' + data.responses[0].success);
});

client.getAccountBalances(function(err, data)
{
    data.forEach(function(account)
    {
        console.log(account.currency + ' balance ' + account.balance / numberConverter + ' pending ' + account.pendingFunds / numberConverter);
    });
});

client.getTradingFee("BTC", "AUD", function(err, data)
{
    console.log(err, data);
});
```