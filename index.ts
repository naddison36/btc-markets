/// <reference path="./index.d.ts" />

import {Buffer} from 'buffer';
import {createHmac} from 'crypto';
import * as request from 'request';
import cheerio from 'cheerio';
import * as VError from 'verror';

export default class BTCMarkets
{
    // used to convert decimal numbers to BTC Market integers. eg 0.001 BTC is 100000 when used in the BTC Markets API
    static numberConverter = 100000000;    // one hundred million

    constructor(public key: string,
                public secret: string,
                public server: string = 'https://api.btcmarkets.net',
                public timeout: number = 20000)
    {}

    protected privateRequest(
        path: string,
        callback: (err: Error, data: object)=>void,
        params?: object)
    {
        if(!this.key || !this.secret)
        {
            return callback(new VError('must provide key and secret to make this API request.'), null);
        }

        // milliseconds elapsed between 1 January 1970 00:00:00 UTC and the given date
        const timestamp = (new Date()).getTime();

        let message;
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

        const signer = createHmac('sha512', new Buffer(this.secret, 'base64'));
        const signature = signer.update(message).digest('base64');

        const headers = {
            "User-Agent": "BTC Markets Javascript API Client",
            "apikey": this.key,
            "timestamp": timestamp,
            "signature": signature};

        let method = 'POST';    // most API's use HTTP POST so setting as default

        // The exception is endpoints under /account/ which do a HTTP GET. eg /account/balance or /account/{instrument}/{currency}/tradingfee
        if (path.split('/')[1] === 'account')
        {
            method = 'GET';
            params = {};
        }

        const options = {
            url: this.server + path,
            method: method,
            headers: headers,
            timeout: this.timeout,
            json: params };

        const requestDesc = `${options.method} request to url ${options.url} with message ${message}`;

        this.executeRequest(options, requestDesc, callback);
    }

    protected publicRequest(
        instrument: BTCMarkets.instruments,
        currency: BTCMarkets.currencies,
        action: string,
        callback: (err: Error, data: object)=>void,
        params?: object)
    {
        const headers = {"User-Agent": "BTC Markets Javascript API Client"};

        const path = '/market/' + instrument + '/' + currency + '/' + action;

        const options = {
            url: this.server + path,
            method: 'GET',
            headers: headers,
            timeout: this.timeout,
            json: {},
            qs: params };

        const requestDesc = `${options.method} request to url ${options.url} with parameters ${JSON.stringify(params)}`;

        this.executeRequest(options, requestDesc, callback)
    };

    protected executeRequest(
        options: request.OptionsWithUrl,
        requestDesc: string,
        callback: (err: Error, data: object)=>void)
    {
        request(options, function(err: any, response: request.RequestResponse, data: object)
        {
            let error = null;   // default to no errors

            if(err)
            {
                error = new VError(err, `failed ${requestDesc} with error message ${err.message}`);
                error.name = err.code;
            }
            else if (response.statusCode < 200 || response.statusCode >= 300)
            {
                error = new VError(`HTTP status code ${response.statusCode} returned from ${requestDesc}. Status message: ${response.statusMessage}`);
                error.name = response.statusCode;
            }
            else if (!data)
            {
                error = new VError(`failed ${requestDesc}. No data returned.`);
            }
            // if request was not able to parse json response into an object
            else if (data !== Object(data))
            {
                // try and parse HTML body form response
                const $ = cheerio.load(data);

                const responseBody = $('body').text();

                if (responseBody)
                {
                    error = new VError(err, `Could not parse response body from ${requestDesc}\nResponse body: ${responseBody}`);
                    error.name = responseBody;
                }
                else
                {
                    error = new VError(err, `Could not parse json or HTML response from ${requestDesc}`);
                }
            }
            else if (data.hasOwnProperty('success') && !data.success)
            {
                error = new VError(`failed ${requestDesc}. Success: ${data.success}. Error message: ${data.errorMessage}`);
                error.name = data.errorMessage;
            }

            callback(error, data);
        });
    }

    //
    // Public API functions
    //

    getTick(instrument: BTCMarkets.instruments,
            currency: BTCMarkets.currencies,
            callback: (err: Error, data: BTCMarkets.Tick)=>void): void
    {
        this.publicRequest(instrument, currency, 'tick', callback);
    };

    getOrderBook(instrument: BTCMarkets.instruments,
                 currency: BTCMarkets.currencies,
                 callback: (err: Error, data: BTCMarkets.OrderBook)=>void)
    {
        this.publicRequest(instrument, currency, 'orderbook', callback);
    };

    getTrades(instrument: BTCMarkets.instruments,
              currency: BTCMarkets.currencies,
              callback: (err: Error, data: BTCMarkets.Trade[])=>void,
              since: number)
    {
        this.publicRequest(instrument, currency, 'trades', callback, {
            since: since}
        );
    };

    //
    // Private API functions
    //

    createOrder(instrument: BTCMarkets.instruments,
                currency: BTCMarkets.currencies,
                price: number | void = 0,  // price is not needed if a market order
                volume: number,
                orderSide: BTCMarkets.OrderSide,
                ordertype: BTCMarkets.OrderType,
                clientRequestId: string | void = "",    // if no client id then set to an empty string
                callback: (err: Error, order: BTCMarkets.NewOrder)=>void)
    {
        const params = {
            currency: currency,
            instrument: instrument,
            price: ordertype == 'Market'? 0 : price,    // market orders don't have a price but a value must be passed
            volume: volume,
            orderSide: orderSide,
            ordertype: ordertype,
            clientRequestId: clientRequestId
        };

        this.privateRequest('/order/create', callback, params);
    };

    cancelOrders(orderIds: number[],
                 callback: (err: Error, orders: BTCMarkets.CancelledOrders)=>void)
    {
        this.privateRequest('/order/cancel', callback, {
            orderIds: orderIds}
        );
    };

    getOrderDetail(orderIds: number[],
                   callback: (err: Error, orders: BTCMarkets.Orders)=>void)
    {
        this.privateRequest('/order/detail', callback, {
            orderIds: orderIds}
        );
    };

    getOpenOrders(instrument: BTCMarkets.instruments,
                  currency: BTCMarkets.currencies,
                  limit: number | void = 10,
                  since: number | null = null,
                  callback: (err: Error, orders: BTCMarkets.Orders)=>void)
    {
        this.privateRequest('/order/open', callback, {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since}
        );
    };

    getOrderHistory(instrument: BTCMarkets.instruments,
                    currency: BTCMarkets.currencies,
                    limit: number | void = 100,
                    since: number | null = null,
                    callback: (err: Error, orders: BTCMarkets.Orders)=>void)
    {
        this.privateRequest('/order/history', callback, {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since}
        );
    };

    getTradeHistory(instrument: BTCMarkets.instruments,
                    currency: BTCMarkets.currencies,
                    limit: number | void = 100,
                    since: number | null = null,
                    callback: (err: Error, trades: BTCMarkets.Trades)=>void)
    {
        this.privateRequest('/order/trade/history', callback, {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since}
        );
    };

    getAccountBalances(callback: (err: Error, balances: BTCMarkets.Balance[])=>void)
    {
        this.privateRequest('/account/balance', callback);
    };

    getTradingFee(instrument: BTCMarkets.instruments,
                  currency: BTCMarkets.currencies,
                  callback: (err: Error, trades: BTCMarkets.TradingFee)=>void)
    {
        this.privateRequest('/account/' + instrument + "/" + currency + "/" + 'tradingfee', callback);
    };

    withdrawCrypto(amount: number,
                   address: string,
                   crypto: string,
                   callback: (err: Error, result: BTCMarkets.CryptoWithdrawal)=>void)
    {
        this.privateRequest('/fundtransfer/withdrawCrypto', callback, {
            amount: amount,
            address: address,
            currency: crypto
        });
    };

    withdrawEFT(accountName: string,
                accountNumber: string,
                bankName: string,
                bsbNumber: string,
                amount: number,
                callback: (err: Error, result: BTCMarkets.BankWithdrawal)=>void)
    {
        this.privateRequest('/fundtransfer/withdrawEFT', callback, {
            accountName: accountName,
            accountNumber: accountNumber,
            bankName: bankName,
            bsbNumber: bsbNumber,
            amount: amount,
            currency: "AUD"
        });
    };

    withdrawHistory(limit: number | void,
                    since: number | void,
                    indexForward: boolean | void,
                    callback: (err: Error, result: BTCMarkets.FundWithdrawals)=>void)
    {
        this.privateRequest('/fundtransfer/history', callback, {
            limit: limit,
            since: since,
            indexForward: indexForward
        });
    };
}
