# 第一梯队详案 · EP01–EP06（高频实用）

> 逐期包含：钩子、痛点场景、内容主线、关键代码点、框架影子、别用场景、互链。
> 写脚本时以本文件为骨架，按 production-sop.md 的六段结构展开。

---

## EP01 单例 Singleton ·「你的单例，可能被创建了两次」

- **梯队**：创建型（蓝）
- **业务线**：`promo` 优惠规则配置
- **痛点场景**：`PromoConfigManager` 被多处 `new`，各自缓存各自刷新——A 服务看到的折扣还是昨天的，引发价格事故复盘。
- **内容主线（演进式，不直接甩答案）**：
  1. 饿汉式 → 简单但可能浪费；
  2. 懒汉式 → 暴露线程安全问题（多线程同时判空）；
  3. 双检锁 DCL → 为什么要 `volatile`（指令重排，画图讲，本期视觉亮点）；
  4. 静态内部类 → 利用类加载机制既懒又安全；
  5. 枚举单例 → 防反射防序列化（Effective Java 推荐）。
- **关键代码点**：`PromoConfigManager` 五个版本演进；演示反射破坏 `private` 构造器的攻击现场。
- **框架影子**：`Runtime.getRuntime()`；Spring Bean 默认 singleton——容器就是个全自动单例工厂，业务代码里手写单例基本可以退休。
- **别用场景**：单例 = 全局变量，有状态单例并发下是隐形炸弹；难 mock 难测试，正解是依赖注入。
- **金句（候选）**：「单例不是设计模式，是全局变量的西装版。」
- **互链**：前置无（系列首期，片尾预告 EP02 支付渠道 if-else 现场）。
- **时长**：10 分钟（本系列最长的一期之一，DCL 值得画图）。

---

## EP02 工厂方法 Factory Method ·「新增支付渠道，一行老代码不改」

- **梯队**：创建型（蓝）
- **业务线**：`payment` 支付
- **痛点场景**：`PaymentService` 里 `switch (channelType)` case 支付宝/微信/银联，每加渠道要改创建、退款、查询三处，漏一处就是线上事故。
- **内容主线**：
  1. 简单工厂（先给，能解决眼前问题）；
  2. 指出每加产品要改工厂类 → 违反开闭原则；
  3. 升级工厂方法：一渠道一工厂（`PaymentChannelFactory` 体系）。
  4. 讲清三者边界：简单工厂 / 工厂方法 / 抽象工厂（为 EP19 埋线）。
- **关键代码点**：`switch` 事故版 → 工厂方法版 diff；新增「云闪付」渠道时两种代码的改动对比（本期戏剧冲突点）。
- **框架影子**：`LoggerFactory.getLogger()`、`Calendar.getInstance()`、Spring `BeanFactory`（名字都没藏着）、JDBC `DriverManager`。
- **别用场景**：实现只有一个且预见不到扩展，直接 `new`，别为设计感加层。
- **金句（候选）**：「开闭原则：改代码是风险，加代码是安全。」
- **互链**：预告 EP03——「工厂造出策略，if-else 的丧钟」（工厂负责造，策略负责换）。

---

## EP03 策略 Strategy ·「不是所有 if-else 都该被消灭」

- **梯队**：行为型（橙）
- **业务线**：`promo` 促销计算
- **痛点场景**：促销计算 300 行 if-else——满减/折扣/满件/新人价；产品说加「前 100 名半价」，全组进入回归测试地狱。
- **内容主线**：
  1. if-else 版本的问题演示（改一处，全量回归）；
  2. `DiscountStrategy` 接口 + 各促销一个实现类；
  3. **Spring 注入 `Map<String, DiscountStrategy>` 自动路由**（Java 独有优雅，本期高光）；
  4. 与 EP02 互链：策略怎么选？用工厂/Map 路由——系列互链第一次示范。
- **关键代码点**：`PromoService.calculate()` 重构 diff；`Map` 注入版路由代码；新增促销类型 = 新增一个类 + 一行注册。
- **框架影子**：`Comparator`、线程池 `RejectedExecutionHandler` 四个预置策略、Spring `Resource`。
- **别用场景**：两三个稳定分支 if-else 更直白；策略超过二十个该考虑规则引擎，不是继续加类。
- **金句（候选）**：「if-else 不是敌人，变化才是。」
- **互链**：回顾 EP02 工厂；预告 EP04——「你每天都在用下一个模式，只是不知道名字」。

---

## EP04 模板方法 Template Method ·「Spring 里最被低估的模式」

- **梯队**：行为型（橙）
- **业务线**：`report` 报表导出
- **痛点场景**：导出报表 Excel/PDF/CSV 三段代码 90% 相同，都是 copy 的——有人修了 Excel 的分页 bug，PDF 还带着。
- **内容主线**：
  1. copy-paste 分叉的演化过程（三段代码逐渐长歪）；
  2. 抽象类定骨架：查数据 → 写表头 → 写行 → 写尾 → 上传；
  3. 子类只填空 + hook 钩子留扩展点（`beforeExport()` 空方法）；
  4. 「父类持流程、子类填细节」的控制反转。
- **关键代码点**：`AbstractReportExporter` 骨架 + 三个子类 diff；hook 方法的默认实现与覆写。
- **框架影子**（本期最豪华）：`JdbcTemplate`、AQS 的 `tryAcquire()` 就是钩子、`HttpServlet.service()` 分发 doGet/doPost、`AbstractList`。
- **别用场景**：流程只有一种实现别抽父类；顺带提「组合优于继承」——父类控制权太强会变继承地狱。
- **金句（候选）**：「你每天都在用模板方法，只是没人告诉你它的名字。」
- **互链**：预告 EP05——「订单下成功了，然后呢？」
- **时长**：10 分钟（框架影子素材多）。

---

## EP05 观察者 Observer ·「下单之后，发生了什么」

- **梯队**：行为型（橙）
- **业务线**：`order` + `notify`
- **痛点场景**：下单成功后 `OrderService` 依次调用库存、短信、积分、风控、日志五个依赖——加一个「通知直播间」要改订单核心代码；短信服务一挂，订单也下不了。
- **内容主线**：
  1. 强耦合版的脆弱性演示（短信超时 → 下单失败）；
  2. 手写 `EventListener` 版（懂原理）；
  3. Spring `ApplicationEventPublisher` + `@EventListener` + `@Async` + `@TransactionalEventListener`（会实战）；
  4. 点破 MQ 就是观察者的分布式形态（为 EP21 中介者埋线：观察者解耦「广播」，中介者解耦「互聊」）。
- **关键代码点**：`OrderCreatedEvent`；手写版监听器注册表；Spring 注解版 diff；`@Async` 前后对比（短信挂了订单照样成）。
- **框架影子**：Spring 事件体系、Guava EventBus、MQ 发布订阅。
- **别用场景**：强一致、顺序敏感、要拿返回值的逻辑别发事件；事件链路是 debug 地狱，必须打 trace。
- **金句（候选）**：「订单服务不该知道短信服务的存在。」
- **互链**：回顾 EP03（事件里带策略）；预告 EP06——「12 个参数的构造函数见过吗」。

---

## EP06 建造者 Builder ·「12 个参数的构造函数是事故现场」

- **梯队**：创建型（蓝）
- **业务线**：`order` 订单对象构造
- **痛点场景**：`new Order(1L, null, null, false, true, null, ...)`——8 个 null 里哪个是发票类型？新人猜错一个就是资损。
- **内容主线**：
  1. telescoping constructor（重载地狱）的病；
  2. setter 模式的病（造出「改了一半的对象」，线程不安全）；
  3. 手写链式 Builder + `build()` 里做参数校验（Effective Java Item 2 完整脉络）；
  4. Lombok `@Builder` 实战 + 何时不想用它（校验逻辑没处放）。
- **关键代码点**：`Order.OrderBuilder`；`build()` 抛 `IllegalStateException` 的校验现场；Lombok 版 diff。
- **框架影子**：`StringBuilder`、OkHttp `Request.Builder`、`Stream.Collector`。
- **别用场景**：2–4 个字段直接构造函数或 record；Builder 是给复杂对象的重武器。
- **金句（候选）**：「null 传到第几个参数，事故就埋在第几行。」
- **互链**：收官预告 EP07——「你的订单为什么改不动？下期，AOP 的心脏：代理模式」（衔接第二梯队）。

---

## 第一梯队共性备忘

- EP01–06 是系列门面，**质量优先于速度**，六期全部按 10 分钟满配制作；
- 每期发布后 48 小时记录数据（完播/互动/涨粉）到 operations.md 的复盘表，W6 做 go/no-go；
- 「码上购」代码库从 EP01 开始建（建议真建一个可编译的 Maven 项目，脚本演示 + 存档两用）。
