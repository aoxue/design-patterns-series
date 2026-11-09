package com.mashanggou.payment;

final class WeChatWorkflow extends PaymentWorkflow {
    @Override
    protected PaymentGateway createGateway() {
        return new WeChatGateway();
    }
}
