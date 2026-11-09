package com.mashanggou.payment;

/** 各渠道共用支付流程，子类提供流程使用的网关。 */
abstract class PaymentWorkflow {
    final String pay(String orderId) {
        validateOrderId(orderId);
        return createGateway().pay(orderId);
    }

    final String refund(String orderId) {
        validateOrderId(orderId);
        return createGateway().refund(orderId);
    }

    final String query(String orderId) {
        validateOrderId(orderId);
        return createGateway().query(orderId);
    }

    protected abstract PaymentGateway createGateway();

    private void validateOrderId(String orderId) {
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("订单号不能为空");
        }
    }
}
