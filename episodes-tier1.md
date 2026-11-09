# 第一梯队详案 · EP01–EP06（高频实用）

> 逐期包含：钩子、痛点场景、内容主线、关键代码点、框架影子、别用场景、互链。
> 写脚本时以本文件为骨架，按 production-sop.md 的六段结构展开。

---

## EP01 单例 Singleton ·「你的单例，可能被创建了两次」

- **梯队**：创建型（蓝）
- **业务线**：`promo` 优惠规则配置
- **痛点场景**：`PromoConfigManager` 被多处 `new`，各自缓存各自刷新：A 服务看到的折扣还是昨天的，引发价格事故复盘。
- **内容主线（演进式，不直接甩答案）**：
  1. 饿汉式 → 简单但可能浪费；
  2. 懒汉式 → 暴露线程安全问题（多线程同时判空）；
  3. 双检锁 DCL → 为什么要 `volatile`（指令重排，画图讲，本期视觉亮点）；
  4. 静态内部类 → 利用类加载机制既懒又安全；
  5. 枚举单例 → 防反射防序列化（Effective Java 推荐）。
- **关键代码点**：`PromoConfigManager` 五个版本演进；演示反射破坏 `private` 构造器的攻击现场。
- **框架影子**：`Runtime.getRuntime()`；Spring Bean 默认 singleton，容器就是个全自动单例工厂，业务代码里手写单例基本可以退休。
- **别用场景**：单例 = 全局变量，有状态单例并发下是隐形炸弹；难 mock 难测试，正解是依赖注入。
- **金句（候选）**：「单例不是设计模式，是全局变量的西装版。」
- **互链**：前置无（系列首期，片尾预告 EP02 支付渠道 if-else 现场）。
- **时长**：10 分钟（本系列最长的一期之一，DCL 值得画图）。

---

## EP02 工厂方法 Factory Method ·「新增支付渠道，一行老代码不改」

- **梯队**：创建型（蓝）
- **业务线**：`payment` 支付
- **冷开场**：「云闪付能扣款，却退不了款。支付上线的时候，我们漏改了退款里的那个 `switch`。」
- **痛点场景**：支付宝和微信已上线。支付、退款、查询各自按渠道选择并创建网关。接云闪付只改到了支付入口，退款重现「渠道不支持」。
- **内容主线**：
  1. 复现扣款成功、退款失败。简单工厂先收拢重复的创建分支，点明扩渠道时仍需修改这处集中分支。
  2. 抽象 `PaymentWorkflow` 持有共同的支付、退款、查询流程，通过 `createGateway()` 获取网关。各渠道子类覆写创建方法。
  3. 用入口已有的注册或注入边界接入云闪付。先交代创建由谁决定，再交代入口怎样找到该渠道，两处职责分开画。
- **上屏验收**：Java 17 演示用同一组入口验证支付宝、微信与云闪付的扣款、退款和查询。用实际 diff 核对新增实现与注册的改动，说明「一行老代码不改」指接入时已有支付流程和渠道实现无需修改，新增注册或配置应如实上屏。
- **框架影子**
  - JDK 的 `AbstractExecutorService.submit()` 使用可由子类覆写的 `newTaskFor()`。[JDK 17 API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/AbstractExecutorService.html)
  - Spring 的 `AbstractFactoryBean` 在创建对象时调用子类实现的 `createInstance()`。[Spring 源码](https://github.com/spring-projects/spring-framework/blob/main/spring-beans/src/main/java/org/springframework/beans/factory/config/AbstractFactoryBean.java)
- **别用场景**：渠道固定、网关构造简单时，用直接构造或简单工厂即可。若各渠道只共享创建接口，先评估组合和注册表的成本。
- **金句（候选）**：「支付流程写一遍，网关交给各渠道来造。」
- **互链**：EP01 已预告云闪付接入。EP03 转到同一促销流程内切换算价算法。EP19 回来讲同一渠道下成组创建的扣款、退款和对账组件。

---

## EP03 策略 Strategy ·「前 100 名半价，为什么要重测所有优惠？」

- **梯队**：行为型（橙）
- **业务线**：`promo` 促销计算
- **痛点场景**：促销计算 300 行 if-else：满减/折扣/满件/新人价；产品说加「前 100 名半价」，全组进入回归测试地狱。
- **内容主线**：
  1. if-else 版本的问题演示（改一处，全量回归）；
  2. `DiscountStrategy` 接口 + 各促销一个实现类；
  3. **Spring 注入 `Map<String, DiscountStrategy>` 自动路由**（Java 独有优雅，本期高光）；
  4. 回看 EP02 的网关创建，再展示统一算价入口如何替换算法。名额以已给出的资格结果入参，库存与并发扣减留在算价演示之外。
- **关键代码点**：`PromoService.calculate()` 重构 diff；`Map` 注入版路由代码；新增促销类型 = 新增一个类 + 一行注册。
- **框架影子**：`Comparator` 比较规则、线程池 `RejectedExecutionHandler` 拒绝策略。
- **别用场景**：两三个稳定分支 if-else 更直白；策略超过二十个该考虑规则引擎，不是继续加类。
- **金句（候选）**：「if-else 不是敌人，变化才是。」
- **互链**：回顾 EP02 的创建决策。预告 EP04 的报表分页 bug，引出固定流程和可变步骤。

---

## EP04 模板方法 Template Method ·「Excel 分页修好了，PDF 怎么还在漏数据？」

- **梯队**：行为型（橙）
- **业务线**：`report` 报表导出
- **痛点场景**：导出报表 Excel/PDF/CSV 三段代码 90% 相同，都是 copy 的：有人修了 Excel 的分页 bug，PDF 还带着。
- **内容主线**：
  1. copy-paste 分叉的演化过程（三段代码逐渐长歪）；
  2. 抽象类固定查数分页和上传步骤，子类实现各自的表头、行和文件收尾格式；
  3. 子类只填空 + hook 钩子留扩展点（`beforeExport()` 空方法）；
  4. 「父类持流程、子类填细节」的控制反转。
- **关键代码点**：`AbstractReportExporter` 骨架 + 三个子类 diff；hook 方法的默认实现与覆写。
- **框架影子**
  - `InputStream.read(byte[], int, int)` 的默认流程调用子类提供的单字节 `read()`。[JDK 17 API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/InputStream.html#read(byte%5B%5D,int,int))
  - `AbstractQueuedSynchronizer.acquire()` 管理尝试与排队流程，子类定义 `tryAcquire()` 的获取条件。[JDK 17 API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html#acquire(int))
- **别用场景**：流程只有一种实现别抽父类；顺带提「组合优于继承」，父类控制权太强会变继承地狱。
- **金句（候选）**：「你每天都在用模板方法，只是没人告诉你它的名字。」
- **互链**：预告 EP05 的短信超时事故。EP08 回到报表导出，在输出边界叠加压缩和校验能力。
- **时长**：10 分钟（框架影子素材多）。

---

## EP05 观察者 Observer ·「短信服务挂了，订单为什么也下不了？」

- **梯队**：行为型（橙）
- **业务线**：`order` + `notify`
- **痛点场景**：下单成功后 `OrderService` 依次调用库存、短信、积分、风控、日志五个依赖，加一个「通知直播间」要改订单核心代码；短信服务一挂，订单也下不了。
- **内容主线**：
  1. 强耦合版的脆弱性演示（短信超时 → 下单失败）；
  2. 手写 `EventListener` 版（懂原理）；
  3. 用 Spring 事件说明发布与订阅。对比同步监听和提交后异步通知，解释通知超时为何需要单独的执行边界。
  4. EP21 再讲具有先后约束的售后动作，由谁决定何时退款、何时补库存。
- **关键代码点**：`OrderCreatedEvent`、手写监听器、Spring 事件对照。分别验证有无通知订阅时的下单结果，以及短信超时是否影响订单提交。
- **框架影子**
  - Spring 的 `ApplicationEventPublisher` 与 `ApplicationListener`。用默认同步行为说明监听机制与执行边界的区别。[Spring 事件文档](https://docs.spring.io/spring/reference/6.2/core/beans/context-introduction.html)
  - JDK 的 `PropertyChangeSupport` 注册属性变化监听者，并在变更时通知订阅方。[JDK 17 API](https://docs.oracle.com/en/java/javase/17/docs/api/java.desktop/java/beans/PropertyChangeSupport.html)
- **别用场景**：强一致、顺序敏感、要拿返回值的逻辑别发事件；事件链路是 debug 地狱，必须打 trace。
- **金句（候选）**：「订单服务不该知道短信服务的存在。」
- **互链**：预告 EP06 两个订单字段填反的事故。EP21 回看订阅者自主响应与集中协调的边界。

---

## EP06 建造者 Builder ·「发票抬头填进了备注，订单居然还能建」

- **梯队**：创建型（蓝）
- **业务线**：`order` 订单对象构造
- **痛点场景**：构造器有多个相邻的可选字段。调用方把备注与发票抬头传反，两项都是字符串，编译通过，最终生成错误的发票信息。
- **内容主线**：
  1. telescoping constructor（重载地狱）的病；
  2. setter 模式的病（造出「改了一半的对象」，线程不安全）；
  3. 手写链式 Builder + `build()` 里做参数校验（Effective Java Item 2 完整脉络）；
  4. Lombok `@Builder` 实战 + 何时不想用它（校验逻辑没处放）。
- **关键代码点**：`Order.OrderBuilder`；`build()` 抛 `IllegalStateException` 的校验现场；Lombok 版 diff。
- **框架影子**：`StringBuilder`、OkHttp `Request.Builder`、`Stream.Collector`。
- **别用场景**：2–4 个字段直接构造函数或 record；Builder 是给复杂对象的重武器。
- **金句（候选）**：「null 传到第几个参数，事故就埋在第几行。」
- **互链**：收官预告 EP07 的事务回滚事故，衔接第二梯队。EP07 演示按 Spring 代理模式复现同类调用绕开代理。[Spring 代理文档](https://docs.spring.io/spring-framework/reference/6.2/core/aop/proxying.html)

---

## 第一梯队共性备忘

- EP01–EP06 每期集中讲清一个主要变化点。样片片长与定制动效按 SOP 评估；
- 每期发布后 48 小时记录数据（完播/互动/涨粉）到 operations.md 的复盘表，W6 做 go/no-go；
- 「码上购」代码库从 EP01 开始建（建议真建一个可编译的 Maven 项目，脚本演示 + 存档两用）。
