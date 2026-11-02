package com.mashanggou.promo;

/**
 * V2 懒汉式单例（对应脚本代码卡 C3）。
 * 第一次 getInstance 才创建，但「判空 → 创建」之间没有锁：
 * 多线程下两个线程可能同时通过判空、各自 new——单例破裂（动画板 A1 的翻车时序）。
 * 方法级 synchronized 可修但每次调用都抢锁，热路径不划算，由此引出 V3 双检锁。
 */
public class PromoConfigManagerV2 {

    private static PromoConfigManagerV2 instance;              // 先不创建

    private int threshold = 300;
    private int discount = 80;

    private PromoConfigManagerV2() { refresh(); }

    /** 模拟拉取最新促销规则 */
    private void refresh() { }

    public static PromoConfigManagerV2 getInstance() {
        if (instance == null) {                              // ① 判空
            instance = new PromoConfigManagerV2();             // ② 创建：①②之间没有锁
        }
        return instance;
    }
}
