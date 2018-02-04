/// <reference path="./index.d.ts" />

import {Buffer} from 'buffer';
import * as querystring from 'querystring';
import {createHmac} from 'crypto';
import * as request from 'request';
import * as cheerio from 'cheerio';
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
        params: object = {} ): Promise<object>
    {
        if(!this.key || !this.secret)
        {
            throw new VError('must provide key and secret to make this API request.');
        }

        let method = 'POST';
        // HTTP GET is used instead of POST for endpoints
        // under /account/ eg /account/balance or /account/{instrument}/{currency}/tradingfee
        // or /fundtransfer/history
        if (path.split('/')[1] === 'account' ||
            path === '/fundtransfer/history')
        {
            method = 'GET';
        }

        // milliseconds elapsed between 1 January 1970 00:00:00 UTC and the given date
        const timestamp = (new Date()).getTime();

        let message;
        if (method === 'POST')
        {
            message = path + "\n" +
                timestamp + "\n" +
                JSON.stringify(params);
        }
        else if (Object.keys(params).length > 0)
        {
            message = path + "\n" +
                querystring.stringify(params) + "\n" +
                timestamp + "\n";
        }
        else
        {
            message = path + "\n" +
                timestamp + "\n";
        }

        const signer = createHmac('sha512', new Buffer(this.secret, 'base64'));
        const signature = signer.update(message).digest('base64');

        const headers = {
            "User-Agent": "BTC Markets Javascript API Client",
            "apikey": this.key,
            "timestamp": timestamp,
            "signature": signature};

        const options: request.Options = {
            url: this.server + path,
            method: method,
            headers: headers,
            timeout: this.timeout,
            json: params
        };

        if (method === 'GET')
        {
            options.qs = params;
        }

        const requestDesc = `${options.method} request to url ${options.url} with message ${message}`;

        return this.executeRequest(options, requestDesc);
    }

    protected publicRequest(
        instrument: BTCMarkets.instruments,
        currency: BTCMarkets.currencies,
        action: string,
        params?: object): Promise<object>
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

        return this.executeRequest(options, requestDesc);
    };

    protected executeRequest(
        options: request.OptionsWithUrl,
        requestDesc: string): Promise<object>
    {
        return new Promise((resolve, reject) =>
        {
            request(options, function(err: any,
                                      response: request.RequestResponse,
                                      data: BTCMarkets.BaseResponse)
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
                    error.name = response.statusCode.toString();
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

                if (error) reject(error);

                resolve(data);
            });
        });
    }

    //
    // Public API functions
    //

    getTick(instrument: BTCMarkets.instruments,
            currency: BTCMarkets.currencies): Promise<BTCMarkets.Tick>
    {
        // @ts-ignore
        return this.publicRequest(instrument, currency, 'tick');
    };

    getOrderBook(instrument: BTCMarkets.instruments,
                 currency: BTCMarkets.currencies): Promise<BTCMarkets.OrderBook>
    {
        // @ts-ignore
        return this.publicRequest(instrument, currency, 'orderbook');
    };

    getTrades(instrument: BTCMarkets.instruments,
              currency: BTCMarkets.currencies,
              since?: number): Promise<BTCMarkets.Trade[]>
    {
        // @ts-ignore
        return this.publicRequest(instrument, currency, 'trades', {
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
                clientRequestId: string | void = ""    // if no client id then set to an empty string
    ): Promise<BTCMarkets.NewOrder>
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

        // @ts-ignore
        return this.privateRequest('/order/create', params);
    };

    cancelOrders(orderIds: number[]): Promise<BTCMarkets.CancelledOrders>
    {
        // @ts-ignore
        return this.privateRequest('/order/cancel', {
            orderIds: orderIds}
        );
    };

    getOrderDetail(orderIds: number[]): Promise<BTCMarkets.Orders>
    {
        // @ts-ignore
        return this.privateRequest('/order/detail', {
            orderIds: orderIds}
        );
    };

    getOpenOrders(instrument: BTCMarkets.instruments,
                  currency: BTCMarkets.currencies,
                  limit: number | void = 10,
                  since: number | null = null): Promise<BTCMarkets.Orders>
    {
        // @ts-ignore
        return this.privateRequest('/order/open', {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since}
        );
    };

    getOrderHistory(instrument: BTCMarkets.instruments,
                    currency: BTCMarkets.currencies,
                    limit: number | void = 100,
                    since: number | null = null): Promise<BTCMarkets.Orders>
    {
        // @ts-ignore
        return this.privateRequest('/order/history', {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since}
        );
    };

    getTradeHistory(instrument: BTCMarkets.instruments,
                    currency: BTCMarkets.currencies,
                    limit: number | void = 100,
                    since: number | null = null): Promise<BTCMarkets.Trades>
    {
        // @ts-ignore
        return this.privateRequest('/order/trade/history', {
            currency: currency,
            instrument: instrument,
            limit: limit,
            since: since}
        );
    };

    getAccountBalances(): Promise<BTCMarkets.Balance[]>
    {
        // @ts-ignore
        return this.privateRequest('/account/balance');
    };

    getTradingFee(instrument: BTCMarkets.instruments,
                  currency: BTCMarkets.currencies): Promise<BTCMarkets.TradingFee>
    {
        // @ts-ignore
        return this.privateRequest('/account/' + instrument + "/" + currency + "/" + 'tradingfee');
    };

    withdrawCrypto(amount: number,
                   address: string,
                   crypto: string): Promise<BTCMarkets.CryptoWithdrawal>
    {
        // @ts-ignore
        return this.privateRequest('/fundtransfer/withdrawCrypto', {
            amount: amount,
            address: address,
            currency: crypto
        });
    };

    withdrawEFT(accountName: string,
                accountNumber: string,
                bankName: string,
                bsbNumber: string,
                amount: number): Promise<BTCMarkets.BankWithdrawal>
    {
        // @ts-ignore
        return this.privateRequest('/fundtransfer/withdrawEFT', {
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
                    indexForward: boolean | void): Promise<BTCMarkets.FundWithdrawals>
    {
        // @ts-ignore
        return this.privateRequest('/fundtransfer/history', {
            limit: limit,
            since: since,
            indexForward: indexForward
        });
    };
}
