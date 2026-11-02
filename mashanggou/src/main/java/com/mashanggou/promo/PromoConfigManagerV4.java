package com.mashanggou.promo;

/**
 * V4 静态内部类单例（对应脚本代码卡 C5，手写单例首选）。
 * Holder 首次被用到才加载（懒加载），类初始化过程 JVM 天然加锁（线程安全），
 * 一行并发代码没写，懒和安全白送，连 volatile 都省了。
 */
public class PromoConfigManagerV4 {

    private int threshold = 300;
    private int discount = 80;

    private PromoConfigManagerV4() { refresh(); }

    /** 模拟拉取最新促销规则 */
    private void refresh() { }

    private static class Holder {                             // 首次访问才加载
        static final PromoConfigManagerV4 INSTANCE = new PromoConfigManagerV4();
    }

    public static PromoConfigManagerV4 getInstance() { return Holder.INSTANCE; }
}
