package com.mashanggou.payment;

/** 事故版和简单工厂版使用的模拟网关。 */
final class LegacyUnionPayGateway extends SimulatedPaymentGateway {
    LegacyUnionPayGateway() {
        super("云闪付");
    }
}
