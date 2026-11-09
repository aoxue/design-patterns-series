package com.mashanggou.payment;

final class UnionPayWorkflow extends PaymentWorkflow {
    @Override
    protected PaymentGateway createGateway() {
        return new UnionPayGateway();
    }
}
