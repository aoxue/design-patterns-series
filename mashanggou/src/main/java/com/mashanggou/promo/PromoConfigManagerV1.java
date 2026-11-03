package com.mashanggou.promo;

/**
 * V1 饿汉式单例（对应脚本代码卡 C2）。
 * 类一加载实例就建好；private 构造器从根上掐灭外部 new。
 * 缺点：太急。无论本次运行是否用到促销配置，实例都随类加载必然创建。
 */
public class PromoConfigManagerV1 {

    private static final PromoConfigManagerV1 INSTANCE = new PromoConfigManagerV1();

    private int threshold = 300;
    private int discount = 80;

    private PromoConfigManagerV1() { refresh(); }               // 私有构造：掐断外部 new

    /** 模拟拉取最新促销规则 */
    private void refresh() { }

    public static PromoConfigManagerV1 getInstance() { return INSTANCE; }
}
