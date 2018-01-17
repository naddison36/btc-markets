//const BTCMarkets = require('btc-markets').default;  // if you are using JavaScript
// import BTCMarkets from 'btc-markets';   // if you are using TypeScript or Babel
import BTCMarkets from './index';  // used for testing inside the BTC Markets library

// Either pass your API key and secret as the first and second parameters to examples.js. eg
// node examples.js your-api-key your-api-secret
//
// Or enter them below.
// WARNING never commit your API keys into a public repository.
const key = process.argv[2] || 'your-api-key';
const secret = process.argv[3] || 'your-api-secret';

const client = new BTCMarkets(key, secret);

async function tests(): Promise<void>
{
    try
    {
        // get latest prices
        const tick = await client.getTick("BTC", "AUD");
        console.log(`Tick: ${JSON.stringify(tick)}`);

        // get order book
        const orderBook = await client.getOrderBook("BTC", "AUD");

        console.log('Order Book has ' + orderBook.asks.length + ' asks with best ask having price ' +
            orderBook.asks[0][0] + ' and amount ' + orderBook.asks[0][1]);
        console.log(`OrderBook: ${JSON.stringify(orderBook)}`);

        // get market trades since 728992317
        const trades = await client.getTrades("BTC", "AUD", 728992317);
        console.log(`Trades: ${JSON.stringify(trades)}`);

        // limit buy order for of 0.001 ETH at 1000 AUD
        const limitOrder = await client.createOrder("ETH", "AUD", 500 * BTCMarkets.numberConverter, 0.001 * BTCMarkets.numberConverter, 'Bid', 'Limit', "10001");
        console.log(`Limit order: ${JSON.stringify(limitOrder)}`);

        //market sell for 0.001 BTC
        const marketOrder = await client.createOrder("BTC", "AUD", null, 0.001 * BTCMarkets.numberConverter, 'Ask', 'Market', null);
        console.log(`Market order: ${JSON.stringify(marketOrder)}`);

        // cancel two limit orders with id's 1132477709 and 1133590603
        const cancelledOrders = await client.cancelOrders([1132477709, 1133590603]);
        console.log(`Cancelled order ${JSON.stringify(cancelledOrders)}`);

        const accountBalances = await client.getAccountBalances();
        console.log(`Account balances: ${JSON.stringify(accountBalances)}`);

        // get trading fee for a trading pair
        const tradingFee = await client.getTradingFee("BTC", "AUD");
        console.log(`Trading fee: ${JSON.stringify(tradingFee)}`);

        // get order details
        const orderDetails = await client.getOrderDetail([206855175, 23988196]);
        console.log(`Order details: ${JSON.stringify(orderDetails)}`);

        // get all trades since the start of time
        const tradeHistory = await client.getTradeHistory("BTC", "AUD", undefined, null);
        console.log(`Trade history ${JSON.stringify(tradeHistory)}`);

        // get 50 orders since the start of time
        const orderHistory = await client.getOrderHistory("BTC", "AUD", 50, null);
        console.log(`Order history: ${JSON.stringify(orderHistory)}`);

        // get my open orders
        const openOrders = await client.getOpenOrders('BTC', 'AUD', 10, null);
        console.log(`Open orders: ${JSON.stringify(openOrders)}`);

        // withdrawal 0.05 ETH
        const cryptoWithdrawal = await client.withdrawCrypto(0.05 * BTCMarkets.numberConverter, "0x775053A6125cB51e618Eb132f00E93d6033934AD", "ETH");
        console.log(`Crypto withdrawal: ${JSON.stringify(cryptoWithdrawal)}`);

        // withdrawal 0.05 ETH
        const withdrawHistory = await client.withdrawHistory(null, null, null);
        console.log(`Withdrawal history: ${JSON.stringify(withdrawHistory)}`);
    }
    catch (err)
    {
        console.log(`Something when wrong in the examples. Error: ${err.message}`);
    }
}

tests();