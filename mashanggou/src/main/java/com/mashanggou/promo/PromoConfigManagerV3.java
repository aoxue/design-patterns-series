package com.mashanggou.promo;

/**
 * V3 双检锁 DCL 单例（对应脚本代码卡 C4，本期视觉亮点）。
 * 口诀：一查（无锁，挡掉绝大多数请求）→ 加锁 → 二查（拿到锁再确认）→ 创建。
 * volatile 是灵魂：new 在 JVM 里分三步（①分配内存 ②初始化 ③指向），
 * 编译器/CPU 可能把 ②③ 重排——别的线程会拿到「已指向、未初始化」的半成品；
 * volatile 禁止该重排，保证看到的要么是 null、要么是完整对象（动画板 A2）。
 */
public class PromoConfigManagerV3 {

    private static volatile PromoConfigManagerV3 instance;      // volatile：防指令重排

    private int threshold = 300;
    private int discount = 80;

    private PromoConfigManagerV3() { refresh(); }

    /** 模拟拉取最新促销规则 */
    private void refresh() { }

    public static PromoConfigManagerV3 getInstance() {
        if (instance == null) {                               // 一查：无锁，挡掉绝大多数
            synchronized (PromoConfigManagerV3.class) {
                if (instance == null) {                       // 二查：拿到锁再确认
                    instance = new PromoConfigManagerV3();
                }
            }
        }
        return instance;
    }
}
