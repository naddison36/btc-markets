"use strict";
/// <reference path="./index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const querystring = require("querystring");
const crypto_1 = require("crypto");
const request = require("request");
const cheerio = require("cheerio");
const VError = require("verror");
class BTCMarkets {
    constructor(key, secret, server = 'https://api.btcmarkets.net', timeout = 20000) {
        this.key = key;
        this.secret = secret;
        this.server = server;
        this.timeout = timeout;
    }
    privateRequest(path, params = {}) {
        if (!this.key || !this.secret) {
            throw new VError('must provide key and secret to make this API request.');
        }
        let method = 'POST';
        // HTTP GET is used instead of POST for endpoints
        // under /account/ eg /account/balance or /account/{instrument}/{currency}/tradingfee
        // or /fundtransfer/history
        if (path.split('/')[1] === 'account' ||
            path === '/fundtransfer/history') {
            method = 'GET';
        }
        // milliseconds elapsed between 1 January 1970 00:00:00 UTC and the given date
        const timestamp = (new Date()).getTime();
        let message;
        if (method === 'POST') {
            message = path + "\n" +
                timestamp + "\n" +
                JSON.stringify(params);
        }
        else if (Object.keys(params).length > 0) {
            message = path + "\n" +
                querystring.stringify(params) + "\n" +
                timestamp + "\n";
        }
        else {
            message = path + "\n" +
                timestamp + "\n";
        }
        const signer = crypto_1.createHmac('sha512', new buffer_1.Buffer(this.secret, 'base64'));
        const signature = signer.update(message).digest('base64');
        const headers = {
            "User-Agent": "BTC Markets Javascript API Client",
            "apikey": this.key,
            "timestamp": timestamp,
            "signature": signature
        };
        const options = {
            url: this.server + path,
            method: method,
            headers: headers,
            timeout: this.timeout,
            json: params
        };
        if (method === 'GET') {
            options.qs = params;
        }
        const requestDesc = `${options.method} request to url ${options.url} with message ${message}`;
        return this.executeRequest(options, requestDesc);
    }
    publicRequest(instrument, currency, action, params) {
        const headers = { "User-Agent": "BTC Markets Javascript API Client" };
        const path = '/market/' + instrument + '/' + currency + '/' + action;
        const options = {
            url: this.server + path,
            method: 'GET',
            headers: headers,
            timeout: this.timeout,
            json: {},
            qs: params
        };
        const requestDesc = `${options.method} request to url ${options.url} with parameters ${JSON.stringify(params)}`;
        return this.executeRequest(options, requestDesc);
    }
    ;
    executeRequest(options, requestDesc) {
        return new Promise((resolve, reject) => {
            request(options, function (err, response, data) {
                let error = null; // default to no errors
                if (err) {
                    error = new VError(err, `failed ${requestDesc} with error message ${err.message}`);
                    error.name = err.code;
                }
                else if (response.statusCode < 200 || response.statusCode >= 300) {
                    error = new VError(`HTTP status code ${response.statusCode} returned from ${requestDesc}. Status message: ${response.statusMessage}`);
                    error.name = response.statusCode.toString();
                }
                else if (!data) {
                    error = new VError(`failed ${requestDesc}. No data returned.`);
                }
                else if (data !== Object(data)) {
                    // try and parse HTML body form response
                    const $ = cheerio.load(data);
                    const responseBody = $('body').text();
                    if (responseBody) {
                        error = new VError(err, `Could not parse response body from ${requestDesc}\nResponse body: ${responseBody}`);
                        error.name = responseBody;
                    }
                    else {
                        error = new VError(err, `Could not parse json or HTML response from ${requestDesc}`);
                    }
                }
                else if (data.hasOwnProperty('success') && !data.success) {
                    error = new VError(`failed ${requestDesc}. Success: ${data.success}. Error message: ${data.errorMessage}`);
                    error.name = data.errorMessage;
                }
                if (error)
                    reject(error);
                resolve(data);
            });
        });
    }
    //
    // Public API functions
    //
    getTick(instrument, currency) {
        // @ts-ignore
        return this.publicRequest(instrument, currency, 'tick');
    }
    ;
    getOrderBook(instrument, currency) {
        // @ts-ignore
        return this.publicRequest(instrument, currency, 'orderbook');
    }
    ;
    getTrades(instrument, currency, since) {
        // @ts-ignore
        return this.publicRequest(instrument, currency, 'trades', {
            since: since
        });
    }
    ;
    //
    // Private API functions
    //
    createOrder(instrument, currency, price = 0, // price is not needed if a market order
        volume, orderSide, ordertype, clientRequestId = "" // if no client id then set to an empty string
    ) {
        const params = {
            currency: currency,
            instrument: instrument,
            price: ordertype == 'Market' ? 0 : price,
            volume: volume,
            orderSide: orderSide,
            ordertype: ordertype,
            clientRequestId: clientRequestId
        };
        // @ts-ignore
        return this.privateRequest('/order/create', params);
    }
    ;
    cancelOrders(orderIds) {
        // @ts-ignore
        return this.privateRequest('/order/cancel', {
            orderIds: orderIds
        });
    }
    ;
    getOrderDetail(orderIds) {
        // @ts-ignore
        return this.privateRequest('/order/detail', {
            orderIds: orderIds
        });
    }
    ;
    getOpenOrders(instrument, currency, limit = 10, since = null) {
        // @ts-ignore
        return this.privateRequest('/order/open', {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since
        });
    }
    ;
    getOrderHistory(instrument, currency, limit = 100, since = null) {
        // @ts-ignore
        return this.privateRequest('/order/history', {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since
        });
    }
    ;
    getTradeHistory(instrument, currency, limit = 100, since = null) {
        // @ts-ignore
        return this.privateRequest('/order/trade/history', {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since
        });
    }
    ;
    getAccountBalances() {
        // @ts-ignore
        return this.privateRequest('/account/balance');
    }
    ;
    getTradingFee(instrument, currency) {
        // @ts-ignore
        return this.privateRequest('/account/' + instrument + "/" + currency + "/" + 'tradingfee');
    }
    ;
    withdrawCrypto(amount, address, crypto) {
        // @ts-ignore
        return this.privateRequest('/fundtransfer/withdrawCrypto', {
            amount: amount,
            address: address,
            currency: crypto
        });
    }
    ;
    withdrawEFT(accountName, accountNumber, bankName, bsbNumber, amount) {
        // @ts-ignore
        return this.privateRequest('/fundtransfer/withdrawEFT', {
            accountName: accountName,
            accountNumber: accountNumber,
            bankName: bankName,
            bsbNumber: bsbNumber,
            amount: amount,
            currency: "AUD"
        });
    }
    ;
    withdrawHistory(limit, since, indexForward) {
        // @ts-ignore
        return this.privateRequest('/fundtransfer/history', {
            limit: limit,
            since: since,
            indexForward: indexForward
        });
    }
    ;
}
// used to convert decimal numbers to BTC Market integers. eg 0.001 BTC is 100000 when used in the BTC Markets API
BTCMarkets.numberConverter = 100000000; // one hundred million
exports.default = BTCMarkets;
//# sourceMappingURL=index.js.map