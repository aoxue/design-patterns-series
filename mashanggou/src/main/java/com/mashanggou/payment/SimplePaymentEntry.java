package com.mashanggou.payment;

/** 三个业务入口复用同一个简单工厂。 */
final class SimplePaymentEntry {
    String pay(String channelType, String orderId) {
        return SimpleGatewayFactory.createGateway(channelType).pay(orderId);
    }

    String refund(String channelType, String orderId) {
        return SimpleGatewayFactory.createGateway(channelType).refund(orderId);
    }

    String query(String channelType, String orderId) {
        return SimpleGatewayFactory.createGateway(channelType).query(orderId);
    }
}
