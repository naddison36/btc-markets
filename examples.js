//const BTCMarkets = require('btc-markets').default;  // if you are using JavaScript
// import BTCMarkets from 'btc-markets';   // if you are using TypeScript or Babel
const BTCMarkets = require('./index').default;  // used for testing inside the BTC Markets library

// Either pass your API key and secret as the first and second parameters to examples.js. eg
// node examples.js your-api-key your-api-secret
//
// Or enter them below.
// WARNING never commit your API keys into a public repository.
const key = process.argv[2] || 'your-api-key';
const secret = process.argv[3] || 'your-api-secret';

const client = new BTCMarkets(key, secret);

// // get latest prices
// client.getTick("BTC", "AUD", function(err, data)
// {
//    console.log(err, JSON.stringify(data));
// });
//
// // get order book
// client.getOrderBook("BTC", "AUD", function(err, data)
// {
//    console.log(data.asks.length + ' asks with best ask having price ' + data.asks[0][0] +
//        ' and amount ' + data.asks[0][1]);
//    console.log(err, JSON.stringify(data));
// });
// client.getTrades("BTC", "AUD", function(err, data)
// {
//     console.log(err, JSON.stringify(data));
// });
// // get trades since a trade id
// client.getTrades("BTC", "AUD", function(err, data)
// {
//     console.log(err, data);
// }, 728992317);
//
// // limit buy order for of 0.001 ETH at 1000 AUD
// client.createOrder("ETH", "AUD", 500 * BTCMarkets.numberConverter, 0.001 * BTCMarkets.numberConverter, 'Bid', 'Limit', "10001", function(err, data)
// {
//    console.log(err, JSON.stringify(data));
// });
//
// //market sell for 0.001 BTC
// client.createOrder("BTC", "AUD", null, 0.001 * BTCMarkets.numberConverter, 'Ask', 'Market', null, function(err, data)
// {
//    console.log(err, JSON.stringify(data));
// });
//
// // cancel two limit orders with id's 1132477709 and 1132477881
// client.cancelOrders([1132477709, 1132477881], function(err, data)
// {
//    console.log(err, JSON.stringify(data));
// });
//
// client.getAccountBalances(function(err, data)
// {
//    data.forEach(function(account)
//    {
//        console.log(account.currency + ' balance ' + account.balance / BTCMarkets.numberConverter + ' pending ' + account.pendingFunds / BTCMarkets.numberConverter);
//    });
//    console.log(err, JSON.stringify(data));
// });
//
// // get trading fee for a trading pair
// client.getTradingFee("BTC", "AUD", function(err, data)
// {
//     console.log(err, JSON.stringify(data));
// });
//
// // get order details
// client.getOrderDetail([206855175, 23988196], function(err, data)
// {
//    console.log(err, JSON.stringify(data));
// });
//
// // get all trades since the start of time
// client.getTradeHistory("BTC", "AUD", undefined, null, function(err, data)
// {
//    console.log(err, JSON.stringify(data));
// });
//
// // get 50 orders since the start of time
// client.getOrderHistory("BTC", "AUD", 50, null, function(err, data)
// {
//    console.log(err, data);
// });
//
// client.getOpenOrders('BTC', 'AUD', 10, null, function(err, orders)
// {
//    console.log(err, orders);
// });
//
// // withdrawal 0.05 ETH
// client.withdrawCrypto(0.05 * BTCMarkets.numberConverter, "F777fc174776879eeD1855560C37Eded66389a3b", "ETH", function(err, data)
// {
//     console.log(err, JSON.stringify(data));
// });
//
// // withdrawal 0.05 ETH
// client.withdrawHistory(null, null, null, function(err, data)
// {
//     console.log(err, JSON.stringify(data));
// });