# EP01 分镜脚本 · 单例 Singleton「你的单例，可能被创建了两次」

> 骨架：`episodes-tier1.md` §EP01 ｜ 格式：`production-sop.md` 六段结构（10 分钟版）

| 项 | 值 |
|---|---|
| 期号 / 模式 | EP01 / 单例 Singleton（创建型 · 蓝） |
| 时长 | 10:00（本系列最长档之一，DCL 值得画图） |
| 业务线 | `promo` 促销规则配置（包：`com.mashanggou.promo`） |
| 视觉亮点 | DCL 指令重排时间轴动画（动画板 A2，本期最值得截图的一页） |
| 金句 | 「单例不是设计模式，是全局变量的西装版。」（片尾全屏定格） |
| 互链 | 前置无（系列首期）→ 片尾预告 EP02 工厂方法（支付渠道 switch 现场） |

**制作要点**

- 代码卡 C1–C9 有效代码合计 **51 行**（≤80 ✓，明细见附录 A）；diff 一律删红增绿，关键行高亮，禁止整屏滚动；
- 口播合计约 2,300 字，按 4 字/秒 ≈ 9.6 分钟纯语音，录制时靠代码停留镜头补足节奏；若超时优先压缩 2.1 饿汉与 4.2 Runtime 的过渡句；
- BGM：全片 lo-fi；第 2 段重构演示节奏稍快；第 4 段「框架影子」用固定 BGM 变奏；
- 动画板 A1/A2 是分镜动画参考稿，不占代码行数。

---

## 0. 时间轴总览

| # | 段落 | 时间码 | 镜号 | 口播 ≈字数 |
|---|---|---|---|---|
| 1 | 痛点现场 | 0:00–1:30 | 1.1–1.4 | 330 |
| 2 | 重构演示（五版演进） | 1:30–5:30 | 2.1–2.5 | 830 |
| 3 | 类图拆解 | 5:30–7:00 | 3.1–3.2 | 400 |
| 4 | 框架影子 | 7:00–8:30 | 4.1–4.3 | 350 |
| 5 | 什么时候别用 | 8:30–9:30 | 5.1 | 310 |
| 6 | 一句话总结 + 预告 | 9:30–10:00 | 6.1 | 170 |

---

## 1. 痛点现场（0:00–1:30）

BGM：低音垫底，事故感。

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 1.1 · 0:00–0:15 | 00:01，码上购两个价格同时在线：商品页满 300 减 80，用户实付只减了 50。价格事故，凶手在代码里。这期十分钟，我们把它揪出来。 | 黑屏起，红色 00:01 跳动；商品页「减 80」标签 vs 支付账单「-50」左右对撞，差值红圈炸开 | 无（钩子，15 秒内落地） |
| 1.2 · 0:15–0:50 | 事情从昨晚说起。运营把「满 300 减 50」上调成「满 300 减 80」，商品页秒级生效——但用户实付按 50 减。因为管折扣的类，PromoConfigManager，在系统里不止一个：订单服务 new 了一个，支付服务 new 了一个，凌晨的报表任务又 new 了一个。三个实例、三份配置缓存、三个刷新节奏。商品页读的是订单那个，5 秒刷到新规则；支付走的是自己那个，要等整点。同一个类，三个「自己」，各说各话。 | IDE 打开「码上购」工程，三个文件依次高亮 `new` 行；右侧拓扑图：一个类分裂成三个圆点，各挂缓存标签，刷新时钟不同步（5s / 整点） | **C1** 事故现场 |
| 1.3 · 0:50–1:15 | 最气人的是：没有一行代码写错。每个服务各自 new 依赖，教科书式的正确。真正缺的是一个机制——「这个类全系统只允许一个实例」，这条约束今天只存在于老员工的脑子里。谁能把它焊死在代码里？ | 三个实例头顶打问号；字幕浮出「约束：全局唯一 = ?」 | 无 |
| 1.4 · 1:15–1:30 | 答案你听过：单例模式。但这期不背八股——我们用五版代码把这个模式重新发明一遍：饿汉、懒汉、双检锁、静态内部类、枚举。每一版，都是被现实毒打出来的。 | 五个版本徽标 V1→V5 依次点亮，连成本期路线图 | 无 |

**C1 · 事故现场（镜 1.2，6 行）**

```java
// order/OrderService.java
private final PromoConfigManager config = new PromoConfigManager();

// payment/PaymentService.java
private final PromoConfigManager config = new PromoConfigManager();

// report/ReportJob.java
private final PromoConfigManager config = new PromoConfigManager();
```

---

## 2. 重构演示（1:30–5:30）

BGM：节奏稍快。每版结构固定：新代码 → 缺点暴露 → 引出下一版。

### 2.1 V1 饿汉式（1:30–2:10）

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 2.1 | 第一版，饿汉式。类一加载，实例就建好了——饿到等不及。三行看门：INSTANCE 用 static final 拿着唯一实例；构造器 private，从根上掐灭外面 new 的可能——事故里那三个 new，现在直接编译报错；getInstance 是唯一正门。一句话职责：类自己负责自己的唯一性。它有缺点吗？有——太急。哪怕这次启动全程没人查促销，实例也照建。对配置管理器这种开机必用的角色，无伤大雅；但假如初始化要连库、要拉远程配置，冷启动就会被拖慢，团队就会提需求：能不能第一次用到再建？这个需求，把我们推向第二版。 | 代码逐行出现；`private PromoConfigManager()` 行打红锁图标；回切 C1 的三处 new 变编译错误（红波浪线）特写；「太急」进度条动画：类加载条 100% 时实例即弹出 | **C2** 全新出现 |

**C2 · V1 饿汉式（4 行）**

```java
public class PromoConfigManager {
    private static final PromoConfigManager INSTANCE = new PromoConfigManager();
    private PromoConfigManager() { refresh(); }               // 私有构造：掐断外部 new
    public static PromoConfigManager getInstance() { return INSTANCE; }
}
```

### 2.2 V2 懒汉式（2:10–2:50）

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 2.2 | 第二版，懒汉式：instance 先留空，第一次有人来拿再建。判空、创建、返回，单线程下无懈可击。但码上购的接口是多线程的。线程 A 执行到判空，通过，还没来得及 new；线程 B 也判空，也通过——两个线程在 new 之前擦肩而过，各自创建一个实例。单例？只剩个名字。我们一夜回到事故现场：两个「自己」，两份缓存。最粗暴的修法：方法上加 synchronized，一次放行一个线程。能用，但 getInstance 是高频热路径，每次调用都要抢锁——为了一个只在第一次有意义的判空，付出一辈子的锁开销，不值。这个「既要懒、又要快、还要安全」的死结，就是第三版的舞台。 | diff 呈现（删红增绿）；切动画板 A1：两线程时序翻车，两个实例分叉画面配故障音；`synchronized` 方法版一闪而过，打「⚠ 每次抢锁」标签划掉 | **C3** diff（对 C2）＋ **A1** 动画板 |

**C3 · V2 懒汉式 diff（8 行）**

```diff
 public class PromoConfigManager {
-    private static final PromoConfigManager INSTANCE = new PromoConfigManager();
+    private static PromoConfigManager instance;              // 先不创建
     private PromoConfigManager() { refresh(); }
-    public static PromoConfigManager getInstance() { return INSTANCE; }
+    public static PromoConfigManager getInstance() {
+        if (instance == null) {                              // ① 判空
+            instance = new PromoConfigManager();             // ② 创建：①②之间没有锁
+        }
+        return instance;
+    }
 }
```

**A1 · 懒汉翻车时序（动画板）**

```
线程 A              线程 B
──────              ──────
判空 → null ✓
                    判空 → null ✓   ← 两人都通过了检查
new 实例①
                    new 实例②       ← 单例破裂，回到事故现场
```

### 2.3 V3 双检锁 DCL（2:50–3:50）★ 本期视觉亮点

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 2.3 | 第三版，双检锁 DCL。结构记口诀：一查、加锁、二查、创建。进门先做一次无锁判空——99% 的请求到这里就被打发走了；只有发现实例还没建，才进 synchronized；进去之后必须再判一次空——等你拿到锁的时候，可能前一个线程刚建完。但这段代码真正的灵魂，是 instance 前面那个 volatile。这不是面试官为难你，是 JVM 真的会动手脚。new PromoConfigManager() 在 JVM 眼里是三步：一，分配内存；二，执行构造器初始化；三，把 instance 指向这块内存。编译器和 CPU 可能把后两步调换顺序——先指、后建。单线程无所谓，多线程下致命：线程 A 刚执行完「指向」还没「初始化」，线程 B 在外面一查——非空！高高兴兴拿走，一调方法，里面全是 null。这个 bug 复现概率极低，低到你复盘时怀疑人生。volatile 的作用一句话：禁止这个重排，保证别的线程要么看到 null，要么看到完整的对象。把这张时间轴图截下来，这是本期最值钱的一页。 | C4 四步依次标号浮现（一查→锁→二查→创建）；切全屏动画：三块积木 ① 分配内存 ② 初始化 ③ 指向；②③积木交换位次 → 线程 B 拿到半成品爆炸特效；volatile 出现时积木焊死（铆钉音效） | **C4** 全新出现 ＋ **A2** 动画板 |

**C4 · V3 双检锁（10 行）**

```java
public class PromoConfigManager {
    private static volatile PromoConfigManager instance;      // volatile：防指令重排
    private PromoConfigManager() { refresh(); }
    public static PromoConfigManager getInstance() {
        if (instance == null) {                               // 一查：无锁，挡掉绝大多数
            synchronized (PromoConfigManager.class) {
                if (instance == null) {                       // 二查：拿到锁再确认
                    instance = new PromoConfigManager();
                }
            }
        }
        return instance;
    }
}
```

**A2 · 指令重排时间轴（动画板，本期截图页）**

```
正常顺序                          重排顺序（无 volatile 时可能发生）
──────────────────────           ──────────────────────
T1  ① 分配内存                   T1  ① 分配内存
    ② 初始化对象                     ③ instance 指向内存   ← 提前！
    ③ instance 指向内存             ② 初始化对象
──────────────────────           ──────────────────────
T2  看到 null → 等待              T2  看到"非空" → 直接拿走
                                    → 半成品对象 → NPE
```

### 2.4 V4 静态内部类（3:50–4:20）

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 2.4 | 第四版，静态内部类——手写单例里我最推荐的写法。getInstance 什么都不判，直接返回 Holder.INSTANCE；而 Holder 这个内部类，JVM 保证它第一次被用到才加载——这不就是懒加载吗；类的初始化过程 JVM 又天然加锁——这不就是线程安全吗。我们一行并发代码没写，懒和安全白送，连 volatile 都省了。不是我们聪明，是 JVM 的类加载机制早就替你把路修好了。 | C5 出现；JVM 图标在 Holder 类上挂两块牌子「用时才加载」「初始化自带锁」；底部对比条：DCL 10 行 vs 内部类 6 行 | **C5** 全新出现 |

**C5 · V4 静态内部类（6 行）**

```java
public class PromoConfigManager {
    private PromoConfigManager() { refresh(); }
    private static class Holder {                             // 首次访问才加载
        static final PromoConfigManager INSTANCE = new PromoConfigManager();
    }
    public static PromoConfigManager getInstance() { return Holder.INSTANCE; }
}
```

### 2.5 V5 枚举 + 反射攻击现场（4:20–5:30）

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 2.5 | 第五版，压轴——单元素枚举，Effective Java 钦定的最佳单例。INSTANCE 一个词加个分号，单例就成了，字段方法照常写。这也是现代 Java 的态度：让模式隐身，一个词解决的事，不写十行。它凭什么压轴？光说不动手不行，我们演一场攻击。反射攻击，专拆 private：getDeclaredConstructor 拿到构造器，setAccessible(true) 强行撬开，newInstance——前面四版全线失守：ghost == getInstance() 印出来是 false，第二个实例诞生，唯一性卒。你可能会说：我们项目谁会闲得写这种代码？攻击不一定来自同事——反序列化、某些框架按 class 反建对象，走的都是同一条暗道。同样的炮弹打向枚举：Constructor.newInstance 直接抛 IllegalArgumentException——Cannot reflectively create enum objects。JVM 在语言层面焊死了这扇门；序列化也一样，枚举反序列化不会产生新实例。防反射、防序列化、代码最短，三项全包，这就是它压轴的理由。 | C7 攻击代码**真实运行实录**：控制台输出 false（红字）→ 打向枚举版时 Exception 轨迹（红）；攻击箭头射向五版本徽标墙，V1–V4 碎裂、V5 盾牌弹开；字幕定格「Cannot reflectively create enum objects」 | **C6** 枚举 ＋ **C7** 反射攻击 |

**C6 · V5 枚举（3 行）**

```java
public enum PromoConfigManager {
    INSTANCE;                                                 // 这一行，就是单例
    public int getDiscount(int amount) { /* 查规则，同前 */ }
}
```

**C7 · 反射攻击演示（6 行，须实际编译运行）**

```java
// 攻击方：反射拆 private 构造器
var ctor = PromoConfigManager.class.getDeclaredConstructor();
ctor.setAccessible(true);                                    // 撬开 private
PromoConfigManager ghost = ctor.newInstance();
System.out.println(ghost == PromoConfigManager.getInstance()); // false —— 失守

// 同样的攻击打向枚举版：IllegalArgumentException
// Cannot reflectively create enum objects —— JVM 拒绝
```

---

## 3. 类图拆解（5:30–7:00）

UML 动效（蓝色系 · 创建型）；源文件：`EP01-singleton.puml`（同目录）。角色逐个浮现，职责一句话标注，不一次甩全图。

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 3.1 · 5:30–6:10 | 五版代码收进一张类图。单例是 23 个模式里类图最寒酸的：一个类，三个记号——private 构造器，锁死出生通道；static 实例，自己持有自己；getInstance，全系统唯一正门。右边站着它的用户：订单、支付、报表——谁都不许 new，全部走虚线箭头指向的 getInstance。这就是单例的全部角色：没有第二个类，因为它全部的工作，就是管好自己这一个实例。 | 类图动画：PromoConfigManager 卡片浮现 → 三个成员逐个点亮，各打一句话标签；OrderService / PaymentService / ReportJob 依次浮现，虚线箭头汇聚到 getInstance() | 无（UML 动效） |
| 3.2 · 6:10–7:00 | 再把五版压成一张对比卡，这是本期的知识地图，建议截图。饿汉式：一行到位，简单可靠，缺点是急——类加载即创建。懒汉式：第一次用才建，但裸奔多线程，一翻车就是两个实例。双检锁：一查加锁二查创建，性能安全双全，代价是必须懂 volatile、懂指令重排。静态内部类：借 JVM 类加载机制，懒和安全白送，手写首选。枚举：再加防反射、防序列化，Effective Java 的答案。一个问题帮你记住五个：要不要懒？不要——饿汉收工；要懒——内部类起步；还要防反射——枚举封顶。 | 五格卡片依次翻出：版本名 + 一句话优缺点 + 推荐指数星级；最后一题决策树动画（要不要懒 → 要不要防反射） | 无（对比卡） |

---

## 4. 框架影子（7:00–8:30）

**固定小片头开场** ＋ BGM 变奏（系列记忆点）。

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 4.1 · 7:00–7:08 | （片头旁白）框架影子——它藏在 JDK 和 Spring 里，早就认识你。 | 固定片头动画（系列 logo + 环节徽标） | 无 |
| 4.2 · 7:08–7:45 | 影子一号，你天天在用：Runtime.getRuntime()。拿 CPU 核数、算堆内存上限、exec 起个进程，入口都是它。点开 JDK 源码：private static final Runtime currentRuntime = new Runtime()——标准的饿汉式，和我们第一版一个模子刻出来的。JDK 1.0 时代写好的单例，今天还在每一台 JVM 里跑。 | JDK 源码实录（Runtime.java 节选，关键行高亮）；旁边并排放 C2，两段连线盖章「同款」 | **C8** Runtime 源码 |
| 4.3 · 7:45–8:30 | 影子二号规模大得多：Spring 容器，一个全自动的单例工厂。@Service 标上，容器登记这个类；别处构造器注入拿到的，永远是同一个实例——Bean 的默认 scope 就是 singleton。注意这个格局：持有实例的不是类自己，是容器。你要单例，容器给；哪天想换个假实现做测试，容器换。写死在类里的 getInstance 做不到这一点。所以结论很直接：Spring 项目里，手写单例基本可以退休——注解加注入，就是 2026 年的单例模式。手写五版的意义，是让你看懂别人的轮子、应付没有容器的场景：工具类库、纯 JDBC 小项目。 | Spring 容器动效：大仓库格子，@Service 类飞进一格；三个服务伸机械臂从同一格取件；「scope=singleton」标签特写 | **C9** Spring 注入 |

**C8 · Runtime 源码节选（2 行）**

```java
// java.lang.Runtime（JDK 源码节选）
private static final Runtime currentRuntime = new Runtime();
public static Runtime getRuntime() { return currentRuntime; }
```

**C9 · Spring 版（6 行）**

```java
@Service
public class PromoConfigManager { /* 容器登记：默认 singleton */ }

public class OrderService {
    private final PromoConfigManager config;
    public OrderService(PromoConfigManager config) {         // 注入的永远是同一个
        this.config = config;
    }
}
```

---

## 5. 什么时候别用（8:30–9:30）

差异化核心段落，不许省略。

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 5.1 | 照例进入本期最重要的段落：什么时候别用。三条警告。第一，单例的本质是全局变量。类名一点，哪里都能 getInstance；依赖关系不体现在方法签名里，而是藏进代码暗处——今天爽，三个月后重构时，它从暗处给你一刀。第二，有状态单例是并发炸弹。今天五版代码防的是「只创建一次」；但实例里的可变字段——缓存的 Map、随手 set 的成员变量——并发读写照样出事。创建安全，不等于使用安全。第三，难测试。getInstance 写死在调用处，单测想塞个假实现进去？插不进。正解是依赖注入：实例从「自己全局去拿」变成「外面递进来」——这正是刚才 Spring 影子的深意。最后一个常见过度设计：无状态的工具类，一堆 static 方法就够，别硬套单例的壳。 | 三张警告卡逐张压屏（⚠ 全局变量 / ⚠ 状态炸弹 / ⚠ 难测试）；第四张小卡「工具类 ≠ 单例」；画面渐暗只留中间待机位，为片尾金句蓄力 | 无 |

---

## 6. 一句话总结 + 预告（9:30–10:00）

| 镜号 | 台词 | 画面 | 代码切分 |
|---|---|---|---|
| 6.1 | 一句话带走这期——单例不是设计模式，是全局变量的西装版。穿之前想清楚：全局，真的是你要的吗？真到了要写的那天，决策树三秒走完：Spring 项目，注解加注入；裸 Java，静态内部类起步；要防反射防序列化，枚举封顶。下期，码上购要接云闪付，一段 switch-case 的地狱即将展开——「新增支付渠道，一行老代码不改」。工厂方法，EP02，等你。 | 金句大字全屏定格（此帧兼作封面备选）；决策树小卡（Spring→注解注入 / 裸 Java→内部类→枚举）；EP02 teaser：`switch (channelType)` 代码一闪 ＋「EP02 工厂方法」徽标 | 无 |

---

## 附录 A · 代码行数预算（对照 SOP §2：有效代码 ≤ 80 行）

| 卡 | 内容 | 有效行 |
|---|---|---|
| C1 | 事故现场三处 new | 6 |
| C2 | V1 饿汉式 | 4 |
| C3 | V2 懒汉式 diff | 8 |
| C4 | V3 双检锁 DCL | 10 |
| C5 | V4 静态内部类 | 6 |
| C6 | V5 枚举 | 3 |
| C7 | 反射攻击演示 | 6 |
| C8 | Runtime 源码节选 | 2 |
| C9 | Spring 版 | 6 |
| **合计** | | **51** ✓ |

## 附录 B · 发布前检查清单（SOP §7）

- [x] 开头 15 秒内钩子成立（镜 1.1：双价格事故）
- [x] 有效代码 ≤ 80 行，diff 清晰（51 行，C3 为 diff，关键行均有高亮标注）
- [x] 「框架影子」≥ 2 个例子（Runtime.getRuntime + Spring singleton Bean）
- [x] 「什么时候别用」存在且有干货（三条警告 + 工具类反例）
- [x] 结尾有下期预告互链（EP02 工厂方法 teaser）
- [x] 封面色系匹配创建型 · 蓝（封面未做，色系已定）
- [ ] 代码实际编译运行过（待建 Maven 工程，见 AGENTS.md「代码工程」）

## 附录 C · 60 秒切片（抖音/小红书）

- 取镜 1.1 + 1.2（双价格事故）→ 直接跳金句「单例不是设计模式，是全局变量的西装版」→ 结尾打「完整版见 B 站」；
- 主视频发布后 2 天内发出。

## 附录 D · 产出物状态

- [x] 分镜脚本（本文件）
- [x] `.puml` 类图源文件（`EP01-singleton.puml`）
- [ ] 可运行示例代码（`com.mashanggou.promo`：五个版本 + 反射攻击 main）
- [ ] 封面图（蓝色系：模式名大字 + 钩子副标题 + EP01 徽标）
- [ ] 60 秒切片版
- [ ] 简介文案（三支柱要点 + 前后互链：合集 / 下一期 EP02）
