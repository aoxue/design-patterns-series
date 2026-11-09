package com.mashanggou.payment;

import java.util.HashMap;

/** 组装本次运行启用的渠道流程。 */
final class PaymentWiring {
    private PaymentWiring() {}

    static PaymentEntry createEntry() {
        var workflows = new HashMap<String, PaymentWorkflow>();
        workflows.put("alipay", new AlipayWorkflow());
        workflows.put("wechat", new WeChatWorkflow());
        workflows.put("unionpay", new UnionPayWorkflow());
        return new PaymentEntry(workflows);
    }
}
