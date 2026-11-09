package com.mashanggou.payment;

/** 演示网关的统一接口，返回适合在终端展示的交易结果。 */
interface PaymentGateway {
    String pay(String orderId);

    String refund(String orderId);

    String query(String orderId);
}
