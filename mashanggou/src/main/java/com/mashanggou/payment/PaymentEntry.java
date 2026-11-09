package com.mashanggou.payment;

import java.util.Map;

/** 按渠道路由到已注册的支付流程。 */
final class PaymentEntry {
    private final Map<String, PaymentWorkflow> workflows;

    PaymentEntry(Map<String, PaymentWorkflow> workflows) {
        this.workflows = Map.copyOf(workflows);
    }

    String pay(String channelType, String orderId) {
        return workflowFor(channelType).pay(orderId);
    }

    String refund(String channelType, String orderId) {
        return workflowFor(channelType).refund(orderId);
    }

    String query(String channelType, String orderId) {
        return workflowFor(channelType).query(orderId);
    }

    private PaymentWorkflow workflowFor(String channelType) {
        var workflow = workflows.get(channelType);
        if (workflow == null) {
            throw new IllegalArgumentException("渠道不支持：" + channelType);
        }
        return workflow;
    }
}
