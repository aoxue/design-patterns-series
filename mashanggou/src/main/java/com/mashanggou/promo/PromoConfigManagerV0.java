package com.mashanggou.promo;

/**
 * 事故版促销配置管理器（对应脚本代码卡 C1）。
 * 构造器 public，任何地方都能 new——订单 / 支付 / 报表各自持有一份实例，
 * 缓存与刷新节奏互不相同，是「商品页减 80 vs 实付减 50」价格事故的根源。
 */
public class PromoConfigManagerV0 {

    private int threshold = 300;   // 满减门槛（元）
    private int discount = 50;     // 优惠金额（元），各实例刷新节奏不同导致规则不同步

    /** 模拟拉取最新促销规则；事故点在于三个实例各自缓存、各自刷新 */
    public void refresh() {
        // 真实场景：调运营后台接口或读库；演示中保持当前值
    }
}
