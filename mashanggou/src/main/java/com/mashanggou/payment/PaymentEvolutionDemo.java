package com.mashanggou.payment;

import java.util.Map;

/** EP02 三版演示。参数指定工厂方法版要验证的渠道，默认支付宝和微信支付。 */
public final class PaymentEvolutionDemo {
    private static final Map<String, String> EXPECTED_CHANNEL_NAMES = Map.of(
            "alipay", "支付宝",
            "wechat", "微信支付",
            "unionpay", "云闪付");

    private PaymentEvolutionDemo() {}

    public static void main(String[] args) {
        reproduceIncident();
        runSimpleFactory();

        System.out.println("=== V2 工厂方法 ===");
        var entry = PaymentWiring.createEntry();
        var channels = args.length == 0 ? new String[]{"alipay", "wechat"} : args;
        for (int index = 0; index < channels.length; index++) {
            var channelType = channels[index];
            var channel = EXPECTED_CHANNEL_NAMES.get(channelType);
            if (channel == null) {
                throw new IllegalArgumentException("未定义的演示渠道：" + channelType);
            }
            verifyWorkflow(entry, channelType, channel, "ORDER-V2-" + (index + 1));
        }
    }

    private static void reproduceIncident() {
        System.out.println("=== V0 分支漏改 ===");
        var entry = new LegacyPaymentEntry();
        var orderId = "ORDER-V0-1";
        printVerified("云闪付 | " + orderId + " | 扣款成功", entry.pay("unionpay", orderId));
        try {
            entry.refund("unionpay", orderId);
            throw new AssertionError("事故版应拒绝云闪付退款");
        } catch (IllegalArgumentException e) {
            verify("渠道不支持：unionpay", e.getMessage());
            System.out.println("退款失败 | " + e.getMessage());
        }
        System.out.println();
    }

    private static void runSimpleFactory() {
        System.out.println("=== V1 简单工厂 ===");
        var entry = new SimplePaymentEntry();
        var orderId = "ORDER-V1-1";
        var prefix = "云闪付 | " + orderId + " | ";
        printVerified(prefix + "扣款成功", entry.pay("unionpay", orderId));
        printVerified(prefix + "退款成功", entry.refund("unionpay", orderId));
        printVerified(prefix + "查询结果：已退款", entry.query("unionpay", orderId));
        System.out.println();
    }

    private static void verifyWorkflow(PaymentEntry entry, String channelType, String channel, String orderId) {
        var prefix = channel + " | " + orderId + " | ";
        printVerified(prefix + "扣款成功", entry.pay(channelType, orderId));
        verify(prefix + "查询结果：已扣款", entry.query(channelType, orderId));
        printVerified(prefix + "退款成功", entry.refund(channelType, orderId));
        printVerified(prefix + "查询结果：已退款", entry.query(channelType, orderId));
    }

    private static void printVerified(String expected, String actual) {
        verify(expected, actual);
        System.out.println(actual);
    }

    private static void verify(String expected, String actual) {
        if (!expected.equals(actual)) {
            throw new AssertionError("预期「" + expected + "」，实际「" + actual + "」");
        }
    }
}
