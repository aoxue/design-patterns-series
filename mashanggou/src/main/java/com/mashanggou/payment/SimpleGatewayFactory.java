package com.mashanggou.payment;

/** 简单工厂集中维护渠道和网关之间的映射。 */
final class SimpleGatewayFactory {
    private SimpleGatewayFactory() {}

    static PaymentGateway createGateway(String channelType) {
        return switch (channelType) {
            case "alipay" -> new AlipayGateway();
            case "wechat" -> new WeChatGateway();
            case "unionpay" -> new LegacyUnionPayGateway();
            default -> throw new IllegalArgumentException("渠道不支持：" + channelType);
        };
    }
}
