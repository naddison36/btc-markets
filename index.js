var util = require('util'),
    _ = require('underscore'),
    request	= require('request'),
    crypto = require('crypto'),
    cheerio = require('cheerio'),
    VError = require('verror');

var BTCMarkets = function BTCMarkets(key, secret, server, timeout)
{
    this.key = key;
    this.secret = secret;

    this.server = server || 'https://api.btcmarkets.net';

    this.timeout = timeout || 20000;
};

BTCMarkets.prototype.privateRequest = function(path, callback, params)
{
    var functionName = 'BTCMarkets.privateRequest()',
        self = this;

    if(!this.key || !this.secret)
    {
        var error = new VError('%s must provide key and secret to make this API request.', functionName);
        return callback(error);
    }

    var timestamp = (new Date()).getTime();

    var message;
    if (params)
    {
        message = path + "\n" +
            timestamp + "\n" +
            JSON.stringify(params);
    }
    else
    {
        // used for /account/balance
        message = path + "\n" + timestamp + "\n";
    }

    var signer = crypto.createHmac('sha512', new Buffer(this.secret, 'base64'));
    var signature = signer.update(message).digest('base64');

    var headers = {
        "User-Agent": "BTC Markets Javascript API Client",
        "apikey": this.key,
        "timestamp": timestamp,
        "signature": signature};

    var method = 'POST';    // most API's use HTTP POST so setting as default

    // The exception is endpoints under /account/ which do a HTTP GET. eg /account/balance or /account/{instrument}/{currency}/tradingfee
    if (path.split('/')[1] === 'account')
    {
        method = 'GET';
        params = {};
    }

    var options = {
        url: this.server + path,
        method: method,
        headers: headers,
        timeout: this.timeout,
        json: params };

    var requestDesc = util.format('%s request to url %s with message %s',
        options.method, options.url, message);

    executeRequest(options, requestDesc, callback);
};

BTCMarkets.prototype.publicRequest = function(instrument, currency, action, callback, params)
{
    var headers = {"User-Agent": "BTC Markets Javascript API Client"};

    var path = '/market/' + instrument + '/' + currency + '/' + action;

    var options = {
        url: this.server + path,
        method: 'GET',
        headers: headers,
        timeout: this.timeout,
        json: {},
        qs: params };

    var requestDesc = util.format('%s request to url %s',
        options.method, options.url);

    executeRequest(options, requestDesc, callback)
};

function executeRequest(options, requestDesc, callback)
{
    var functionName = 'BTCMarkets.executeRequest()';

    request(options, function(err, response, data)
    {
        var error = null;   // default to no errors

        if(err)
        {
            error = new VError(err, '%s failed %s', functionName, requestDesc);
            error.name = err.code;
        }
        else if (response.statusCode < 200 || response.statusCode >= 300)
        {
            error = new VError('%s HTTP status code %s returned from %s. Status message: %s', functionName,
                response.statusCode, requestDesc, response.statusMessage);
            error.name = response.statusCode;
        }
        else if (!data)
        {
            error = new VError('%s failed %s. No data returned.', functionName, requestDesc );
        }
        // if request was not able to parse json response into an object
        else if (!_.isObject(data) )
        {
            // try and parse HTML body form response
            $ = cheerio.load(data);

            var responseBody = $('body').text();

            if (responseBody)
            {
                error = new VError(err, '%s could not parse response body from %s\nResponse body: %s', functionName, requestDesc, responseBody);
                error.name = responseBody;
            }
            else
            {
                error = new VError(err, '%s could not parse json or HTML response from %s', functionName, requestDesc);
            }
        }
        else if (_.has(data, 'success') && !data.success)
        {
            error = new VError('%s failed %s. Error message: %s', functionName,
                requestDesc, data.errorMessage);

            error.name = data.errorMessage;
        }

        callback(error, data);
    });
}

//
// Public Functions
//

BTCMarkets.prototype.getTick = function getMarketSummary(instrument, currency, callback)
{
    this.publicRequest(instrument, currency, 'tick', callback);
};

BTCMarkets.prototype.getOrderBook = function getOrderBook(instrument, currency, callback)
{
    this.publicRequest(instrument, currency, 'orderbook', callback);
};

BTCMarkets.prototype.getTrades = function(instrument, currency, callback, since)
{
    this.publicRequest(instrument, currency, 'trades', callback, {
        since: since}
    );
};

//
// Private Functions
//

BTCMarkets.prototype.createOrder = function createOrder(instrument, currency, price, volume, orderSide, ordertype, clientRequestId, callback)
{
    var params = {
        currency: currency,
        instrument: instrument,
        price: price,
        volume: volume,
        orderSide: orderSide,
        ordertype: ordertype,
        clientRequestId: clientRequestId};

    this.privateRequest('/order/create', callback, params);
};

BTCMarkets.prototype.cancelOrders = function cancelOrders(orderIds, callback)
{
    this.privateRequest('/order/cancel', callback, {
        orderIds: orderIds}
    );
};

BTCMarkets.prototype.getOrderDetail = function getOrderDetail(orderIds, callback)
{
    this.privateRequest('/order/detail', callback, {
            orderIds: orderIds}
    );
};

BTCMarkets.prototype.getOpenOrders = function getOpenOrders(instrument, currency, limit, since, callback)
{
    this.privateRequest('/order/open', callback, {
        currency: currency,
        instrument: instrument,
        limit: limit,
        since: since}
    );
};

BTCMarkets.prototype.getOrderHistory = function getOrderHistory(instrument, currency, limit, since, callback)
{
    this.privateRequest('/order/history', callback, {
        currency: currency,
        instrument: instrument,
        limit: limit,
        since: since}
    );
};

BTCMarkets.prototype.getTradeHistory = function getTradeHistory(instrument, currency, limit, since, callback)
{
    this.privateRequest('/order/trade/history', callback, {
        currency: currency,
        instrument: instrument,
        limit: limit,
        since: since}
    );
};

BTCMarkets.prototype.getAccountBalances = function getAccounts(callback)
{
    this.privateRequest('/account/balance', callback);
};

BTCMarkets.prototype.getTradingFee = function getTradingFee(instrument, currency, callback)
{
    this.privateRequest('/account/' + instrument + "/" + currency + "/" + 'tradingfee', callback);
};

BTCMarkets.prototype.withdrawCrypto = function withdrawCrypto(amount, address, crypto, callback)
{
    this.privateRequest('/fundtransfer/withdrawCrypto', callback, {
        amount:amount,
        address:address,
        currency:crypto
    });
};

BTCMarkets.prototype.withdrawEFT = function withdrawEFT(accountName, accountNumber, bankName, bsbNumber, amount, callback)
{
    this.privateRequest('/fundtransfer/withdrawEFT', callback, {
        accountName:accountName,
        accountNumber:accountNumber,
        bankName:bankName,
        bsbNumber:bsbNumber,
        amount:amount,
        currency:"AUD"
    });
};

module.exports = BTCMarkets;