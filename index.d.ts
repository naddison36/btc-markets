// Type definitions for BTC Markets
// Project: btc-markets
// Definitions by: Nick Addison

import request = require('request');

export as namespace BTCMarkets;

export = BTCMarkets;

declare class BTCMarkets
{
    constructor(key: string,
                secret: string,
                server: string,
                timeout: number);

    static numberConverter: number;

    getTick(instrument: string, currency: string, callback: (err: Error, data: BTCMarkets.Tick)=>void): void;
}

declare namespace BTCMarkets
{
    export type currencies = "AUD" | "BTC" //| "USD"
    export type instruments = "BTC" | "BCH" | "ETH" | "ETC" | "LTC" | "XRP" //| "MAID" | "FCT" | "DAO"
    export type allCurrencies = currencies | instruments
    
    export type OrderSide = "Bid" | "Ask"
    export type OrderType = "Limit" | "Market"
    export type OrderStatus = "New" | "Placed" | "Filled" | "Error" | "Cancelled" | "Partially Cancelled" | "Fully Matched" | "Partially Matched"
    export type WithdrawalStatus = string

    export interface Tick
    {
        bestBid: number,
        bestAsk: number,
        lastPrice: number,
        currency: currencies,
        instrument: instruments,
        timestamp: number,
        volume24h: number
    }

    export interface OrderBook
    {
        currency: currencies,
        instrument: instruments,
        timestamp: number,
        asks: number[][],
        bids: number[][]
    }

    export interface Trade
    {
        tid: number,
        amount: number,
        price: number,
        date:number
    }
    
    export interface Balance
    {
        balance: number,
        pendingFunds: number,
        currency: allCurrencies
    }

    export interface BaseResponse
    {
        success: boolean,
        errorCode: number | null,
        errorMessage: string | null
    }
    
    export interface NewOrder extends BaseResponse
    {
        id: number,
        clientRequestId?: string
    }

    export interface CancelledOrder extends BaseResponse
    {
        id: number
    }
    
    export interface CancelledOrders extends BaseResponse
    {
        responses: CancelledOrder[]
    }

    export interface Trade
    {
        id: number,
        creationTime: number,
        description: string | null,
        price: number,
        volume: number,
        side: "Ask" | "Bid",
        fee: number,
        orderId: number
    }
    
    export interface Order
    {
        id: number,
        currency: currencies,
        instruments: instruments,
        orderSide: OrderSide,
        ordertype: OrderType,
        creationTime: number,
        status: OrderStatus
        errorMessage: string | null
        price: number,
        volume: number,
        openVolume: number,
        clientRequestId?: string,
        trades: Trade[]
    }

    export interface Orders extends BaseResponse
    {
        orders: Order[]
    }

    export interface Trades extends BaseResponse
    {
        trades: Trade[]
    }

    export interface TradingFee extends BaseResponse
    {
        tradingFeeRate: number,
        volume30Day: number
    }

    export interface Withdrawal extends BaseResponse
    {
        status: WithdrawalStatus
    }
    
    export interface CryptoWithdrawal extends Withdrawal
    {
        fundTransferId: number
        description: string
        creationTime: number
        currency: string
        amount: number,
        fee: number
    }
    
    export interface BankWithdrawal extends Withdrawal
    {
        // TODO find out what's returned from this call
    }

    export interface cryptoPaymentDetail
    {
        address: string,
        txId: string
    }

    export interface FundTransfers
    {
        status: string,
        fundTransferId: number,
        description: string,
        creationTime: number,
        currency: allCurrencies,
        amount: number,
        fee: number,
        transferType: string,
        errorMessage: string | null
        lastUpdate: number,
        cryptoPaymentDetail: cryptoPaymentDetail | null
    }

    export interface FundWithdrawals extends BaseResponse
    {
        fundTransfers: FundTransfers[]
    }
}
