"use strict";
/// <reference path="./index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const crypto_1 = require("crypto");
const request = require("request");
const cheerio_1 = require("cheerio");
const VError = require("verror");
class BTCMarkets {
    constructor(key, secret, server = 'https://api.btcmarkets.net', timeout = 20000) {
        this.key = key;
        this.secret = secret;
        this.server = server;
        this.timeout = timeout;
    }
    privateRequest(path, callback, params) {
        if (!this.key || !this.secret) {
            return callback(new VError('must provide key and secret to make this API request.'), null);
        }
        // milliseconds elapsed between 1 January 1970 00:00:00 UTC and the given date
        const timestamp = (new Date()).getTime();
        let message;
        if (params) {
            message = path + "\n" +
                timestamp + "\n" +
                JSON.stringify(params);
        }
        else {
            // used for /account/balance
            message = path + "\n" + timestamp + "\n";
        }
        const signer = crypto_1.createHmac('sha512', new buffer_1.Buffer(this.secret, 'base64'));
        const signature = signer.update(message).digest('base64');
        const headers = {
            "User-Agent": "BTC Markets Javascript API Client",
            "apikey": this.key,
            "timestamp": timestamp,
            "signature": signature
        };
        let method = 'POST'; // most API's use HTTP POST so setting as default
        // The exception is endpoints under /account/ which do a HTTP GET. eg /account/balance or /account/{instrument}/{currency}/tradingfee
        if (path.split('/')[1] === 'account') {
            method = 'GET';
            params = {};
        }
        const options = {
            url: this.server + path,
            method: method,
            headers: headers,
            timeout: this.timeout,
            json: params
        };
        const requestDesc = `${options.method} request to url ${options.url} with message ${message}`;
        this.executeRequest(options, requestDesc, callback);
    }
    publicRequest(instrument, currency, action, callback, params) {
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
        this.executeRequest(options, requestDesc, callback);
    }
    ;
    executeRequest(options, requestDesc, callback) {
        request(options, function (err, response, data) {
            let error = null; // default to no errors
            if (err) {
                error = new VError(err, `failed ${requestDesc} with error message ${err.message}`);
                error.name = err.code;
            }
            else if (response.statusCode < 200 || response.statusCode >= 300) {
                error = new VError(`HTTP status code ${response.statusCode} returned from ${requestDesc}. Status message: ${response.statusMessage}`);
                error.name = response.statusCode;
            }
            else if (!data) {
                error = new VError(`failed ${requestDesc}. No data returned.`);
            }
            else if (data !== Object(data)) {
                // try and parse HTML body form response
                const $ = cheerio_1.default.load(data);
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
            callback(error, data);
        });
    }
    //
    // Public API functions
    //
    getTick(instrument, currency, callback) {
        this.publicRequest(instrument, currency, 'tick', callback);
    }
    ;
    getOrderBook(instrument, currency, callback) {
        this.publicRequest(instrument, currency, 'orderbook', callback);
    }
    ;
    getTrades(instrument, currency, callback, since) {
        this.publicRequest(instrument, currency, 'trades', callback, {
            since: since
        });
    }
    ;
    //
    // Private API functions
    //
    createOrder(instrument, currency, price = 0, // price is not needed if a market order
        volume, orderSide, ordertype, clientRequestId = "", // if no client id then set to an empty string
        callback) {
        const params = {
            currency: currency,
            instrument: instrument,
            price: ordertype == 'Market' ? 0 : price,
            volume: volume,
            orderSide: orderSide,
            ordertype: ordertype,
            clientRequestId: clientRequestId
        };
        this.privateRequest('/order/create', callback, params);
    }
    ;
    cancelOrders(orderIds, callback) {
        this.privateRequest('/order/cancel', callback, {
            orderIds: orderIds
        });
    }
    ;
    getOrderDetail(orderIds, callback) {
        this.privateRequest('/order/detail', callback, {
            orderIds: orderIds
        });
    }
    ;
    getOpenOrders(instrument, currency, limit = 10, since = null, callback) {
        this.privateRequest('/order/open', callback, {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since
        });
    }
    ;
    getOrderHistory(instrument, currency, limit = 100, since = null, callback) {
        this.privateRequest('/order/history', callback, {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since
        });
    }
    ;
    getTradeHistory(instrument, currency, limit = 100, since = null, callback) {
        this.privateRequest('/order/trade/history', callback, {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since
        });
    }
    ;
    getAccountBalances(callback) {
        this.privateRequest('/account/balance', callback);
    }
    ;
    getTradingFee(instrument, currency, callback) {
        this.privateRequest('/account/' + instrument + "/" + currency + "/" + 'tradingfee', callback);
    }
    ;
    withdrawCrypto(amount, address, crypto, callback) {
        this.privateRequest('/fundtransfer/withdrawCrypto', callback, {
            amount: amount,
            address: address,
            currency: crypto
        });
    }
    ;
    withdrawEFT(accountName, accountNumber, bankName, bsbNumber, amount, callback) {
        this.privateRequest('/fundtransfer/withdrawEFT', callback, {
            accountName: accountName,
            accountNumber: accountNumber,
            bankName: bankName,
            bsbNumber: bsbNumber,
            amount: amount,
            currency: "AUD"
        });
    }
    ;
    withdrawHistory(limit, since, indexForward, callback) {
        this.privateRequest('/fundtransfer/history', callback, {
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