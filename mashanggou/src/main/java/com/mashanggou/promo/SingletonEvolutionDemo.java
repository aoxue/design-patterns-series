package com.mashanggou.promo;

/**
 * EP01 演示入口（对应脚本代码卡 C1 事故现场 + C7 反射攻击，须真实运行录屏）。
 * 运行输出三幕：① 事故版谁都能 new → 多实例；② 五版演进各自全局唯一；
 * ③ 反射攻击对比，普通类失守（false），枚举被 JVM 拒绝。
 */
public class SingletonEvolutionDemo {

    public static void main(String[] args) throws Exception {
        System.out.println("=== 第一幕 · 事故现场（C1）：谁都能 new ===");
        var orderConfig = new PromoConfigManagerV0();      // order/OrderService 持有
        var paymentConfig = new PromoConfigManagerV0();    // payment/PaymentService 持有
        var reportConfig = new PromoConfigManagerV0();     // report/ReportJob 持有
        System.out.println("订单服务实例: " + orderConfig);
        System.out.println("支付服务实例: " + paymentConfig);
        System.out.println("报表任务实例: " + reportConfig);
        System.out.println("互不相等 → 三个「自己」，这就是价格事故的根源\n");

        System.out.println("=== 第二幕 · 五版演进：全局唯一验证 ===");
        System.out.println("V1 饿汉式     : " + (PromoConfigManagerV1.getInstance() == PromoConfigManagerV1.getInstance()));
        System.out.println("V2 懒汉式     : " + (PromoConfigManagerV2.getInstance() == PromoConfigManagerV2.getInstance()) + "（单线程下成立；多线程翻车见动画板 A1）");
        System.out.println("V3 双检锁 DCL : " + (PromoConfigManagerV3.getInstance() == PromoConfigManagerV3.getInstance()));
        System.out.println("V4 静态内部类 : " + (PromoConfigManagerV4.getInstance() == PromoConfigManagerV4.getInstance()));
        System.out.println("V5 枚举       : INSTANCE 唯一（语言保证），getDiscount(300) = " + PromoConfigManagerV5.INSTANCE.getDiscount(300) + "\n");

        System.out.println("=== 第三幕 · 反射攻击（C7） ===");
        var ctor = PromoConfigManagerV1.class.getDeclaredConstructor();
        ctor.setAccessible(true);                                    // 撬开 private
        var ghost = ctor.newInstance();
        System.out.println("攻击 V1 饿汉式（普通类）: ghost == getInstance() → "
                + (ghost == PromoConfigManagerV1.getInstance()) + "   ← 失守！第二个实例诞生");

        // 枚举在字节码里的构造器签名是 (String name, int ordinal)，须按此获取
        var enumCtor = PromoConfigManagerV5.class.getDeclaredConstructor(String.class, int.class);
        enumCtor.setAccessible(true);
        try {
            enumCtor.newInstance("GHOST", 0);
            System.out.println("攻击 V5 枚举: 失守（不会发生）");
        } catch (IllegalArgumentException e) {
            System.out.println("攻击 V5 枚举: " + e);
            System.out.println("← JVM 在语言层面焊死了这扇门");
        }
    }
}
