BTC Markets Javascript API Client
===============

This is a node.js wrapper for the private and public methods exposed by the [BTC Markets API](https://github.com/BTCMarkets/API).
You will need have a registered account with [BTC Markets](https://btcmarkets.net) and generated API keys to access the private methods.

Please contact support@btcmarkets.net if you are having trouble opening and account or generating an API key. 

### Install

`npm install btc-markets`

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
client.createOrder("BTC", "AUD", 230 * numberConverter, 0.01 * numberConverter, 'Bid', 'Limit', 10001, function(err, data)
{
    console.log('id ' + data.id);
});

// market sell for 0.0001 BTC
client.createOrder("BTC", "AUD", null, 0.0001 * numberConverter, 'Ask', 'Market', null, function(err, data)
{
    console.log('id ' + data.id);
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
```