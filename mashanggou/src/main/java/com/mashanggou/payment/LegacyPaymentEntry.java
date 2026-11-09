package com.mashanggou.payment;

/** 事故版。新增渠道时，只有扣款入口加了云闪付分支。 */
final class LegacyPaymentEntry {
    String pay(String channelType, String orderId) {
        PaymentGateway gateway = switch (channelType) {
            case "alipay" -> new AlipayGateway();
            case "wechat" -> new WeChatGateway();
            case "unionpay" -> new LegacyUnionPayGateway();
            default -> throw new IllegalArgumentException("渠道不支持：" + channelType);
        };
        return gateway.pay(orderId);
    }

    String refund(String channelType, String orderId) {
        PaymentGateway gateway = switch (channelType) {
            case "alipay" -> new AlipayGateway();
            case "wechat" -> new WeChatGateway();
            default -> throw new IllegalArgumentException("渠道不支持：" + channelType);
        };
        return gateway.refund(orderId);
    }

    String query(String channelType, String orderId) {
        PaymentGateway gateway = switch (channelType) {
            case "alipay" -> new AlipayGateway();
            case "wechat" -> new WeChatGateway();
            default -> throw new IllegalArgumentException("渠道不支持：" + channelType);
        };
        return gateway.query(orderId);
    }
}
