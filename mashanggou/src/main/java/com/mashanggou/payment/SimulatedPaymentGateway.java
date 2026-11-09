package com.mashanggou.payment;

import java.util.HashMap;
import java.util.Map;

/** 本地模拟渠道端的交易记录，供单进程演示使用。 */
abstract class SimulatedPaymentGateway implements PaymentGateway {
    private enum Status { PAID, REFUNDED }

    private record PaymentKey(String channel, String orderId) {}

    // 网关实例可以更换，渠道端的交易状态仍然按渠道和订单保留。
    private static final Map<PaymentKey, Status> payments = new HashMap<>();

    private final String channel;

    SimulatedPaymentGateway(String channel) {
        this.channel = channel;
    }

    @Override
    public final String pay(String orderId) {
        var key = new PaymentKey(channel, orderId);
        if (payments.putIfAbsent(key, Status.PAID) != null) {
            throw new IllegalStateException("订单已有支付记录：" + orderId);
        }
        return result(orderId, "扣款成功");
    }

    @Override
    public final String refund(String orderId) {
        var key = new PaymentKey(channel, orderId);
        if (!payments.replace(key, Status.PAID, Status.REFUNDED)) {
            throw new IllegalStateException("订单没有可退款的支付记录：" + orderId);
        }
        return result(orderId, "退款成功");
    }

    @Override
    public final String query(String orderId) {
        var status = payments.get(new PaymentKey(channel, orderId));
        if (status == null) {
            return result(orderId, "查询结果：无支付记录");
        }
        return result(orderId, status == Status.PAID ? "查询结果：已扣款" : "查询结果：已退款");
    }

    private String result(String orderId, String message) {
        return channel + " | " + orderId + " | " + message;
    }
}
