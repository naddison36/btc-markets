var BTCMarkets = require('./index');

// Either pass your API key and secret as the first and second parameters to examples.js. eg
// node examples.js your-api-key your-api-secret
//
// Or enter them below.
// WARNING never commit your API keys into a public repository.
var key = process.argv[2] || 'your-api-key';
var secret = process.argv[3] || 'your-api-secret';

var client = new BTCMarkets(key, secret);

var numberConverter = 100000000;    // one hundred million

//// get latest prices
//client.getTick("BTC", "AUD", function(err, data)
//{
//    console.log('bid ' + data.bestBid + ' ask ' + data.bestAsk + ' last price ' + data.lastPrice);
//});
//
//// get order book
//client.getOrderBook("BTC", "AUD", function(err, data)
//{
//    console.log(data.asks.length + ' asks with best ask having price ' + data.asks[0][0] +
//        ' and amount ' + data.asks[0][1]);
//});
// client.getTrades("BTC", "AUD", function(err, data)
// {
//     console.log(err, data);
// });
// // get trades since a trade id
// client.getTrades("BTC", "AUD", function(err, data)
// {
//     console.log(err, data);
// }, 728992317);
//
//// limit buy order for of 0.01 BTC at 230 AUD
//client.createOrder("BTC", "AUD", 230 * numberConverter, 0.01 * numberConverter, 'Bid', 'Limit', "10001", function(err, data)
//{
//    console.log(err, data);
//});
//
////market sell for 0.0001 BTC
//client.createOrder("BTC", "AUD", null, 0.0001 * numberConverter, 'Ask', 'Market', null, function(err, data)
//{
//    console.log(err, data);
//});
//
//// cancel two limit orders with id's 123456 and 987654
//client.cancelOrder([123456,987654], function(err, data)
//{
//    console.log('first order was cancelled ' + data.responses[0].success);
//});
//
// client.getAccountBalances(function(err, data)
// {
//    data.forEach(function(account)
//    {
//        console.log(account.currency + ' balance ' + account.balance / numberConverter + ' pending ' + account.pendingFunds / numberConverter);
//    });
// });
//
// client.getTradingFee("BTC", "AUD", function(err, data)
// {
//     console.log(err, data);
// });
//
//// get order details
//client.getOrderDetail([206855175, 23988196], function(err, data)
//{
//    console.log(err, data);
//});
//
////33434568724
////1404172800
// get 10 trades since the start of time
// client.getTradeHistory("BTC", "AUD", 10, 1, function(err, data)
// {
//    console.log(err, data);
// });
//// get 10 orders since the start of time
//client.getOrderHistory("BTC", "AUD", 10, 1, function(err, data)
//{
//    console.log(err, data);
//});
//
//client.getOpenOrders('BTC', 'AUD', 10, null, function(err, orders)
//{
//    console.log(err, orders);
//});