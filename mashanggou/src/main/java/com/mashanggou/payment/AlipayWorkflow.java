package com.mashanggou.payment;

final class AlipayWorkflow extends PaymentWorkflow {
    @Override
    protected PaymentGateway createGateway() {
        return new AlipayGateway();
    }
}
