package com.mashanggou.promo;

/**
 * V5 枚举单例（对应脚本代码卡 C6，Effective Java 钦定的最佳单例）。
 * INSTANCE 一个词加个分号，单例就成了；JVM 在语言层面防反射（见演示第三幕）、
 * 防反序列化产生新实例，代码还最短——三项全包，故压轴。
 */
public enum PromoConfigManagerV5 {
    INSTANCE;                                                 // 这一行，就是单例

    /** 查询优惠金额：满 threshold 减 discount，规则同前各版本 */
    public int getDiscount(int amount) {
        return amount >= 300 ? 80 : 0;
    }
}
