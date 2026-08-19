# Particle Rose

一个基于 **Three.js + WebGL + GLSL Shader** 实现的单朵 3D 粒子玫瑰网页。

项目目标不是简单使用大量随机粒子拼出类似玫瑰的轮廓，而是：

> **先构造具有明确花瓣层次和真实空间关系的程序化 3D 玫瑰，再在花瓣表面采样粒子，通过 Shader、Bloom 和交互效果将其表现为一朵由星尘组成的玫瑰。**

最终强调的不是“粒子数量很多”，而是：

> **玫瑰结构清晰、花瓣层次明确、粒子细腻、光效克制、整体具有高级感。**

---

# 1. 最终目标

最终网页只表现：

> **一朵悬浮在黑暗中的 3D 粒子玫瑰。**

计划实现：

- 单朵 3D 粒子玫瑰
- 多层程序化花瓣结构
- 花瓣表面粒子采样
- 花瓣边缘高密度粒子
- 柔和圆形发光粒子
- 深红、酒红、玫红渐变
- 少量暖白高光
- Bloom 柔和发光
- 粒子汇聚动画
- 玫瑰逐层绽放动画
- 极轻微呼吸和悬浮
- 鼠标视差
- 鼠标局部粒子扰动
- Touch 支持
- 桌面端与移动端适配
- 根据运行性能动态调整画质
- 最终打包为单个离线 HTML 文件

---

# 2. 最重要的发布要求

项目开发阶段允许：

- 多文件
- Three.js
- GLSL 文件
- Vite
- Node.js
- npm
- 开发依赖

但是这些内容：

> **只属于开发环境。**

最终交付给用户的文件必须只有：

```text
particle-rose.html
```

最终用户不需要安装：

```text
Node.js
npm
Three.js
Vite
Python
任何本地服务器
```

也不需要：

```text
npm install
npm run dev
```

最终效果必须满足：

```text
particle-rose.html
        ↓
复制到另一台电脑
        ↓
直接双击
        ↓
浏览器打开
        ↓
粒子玫瑰正常运行
```

---

# 3. 最终 HTML 的硬性要求

最终生成：

```text
dist/
└─ particle-rose.html
```

该文件必须是：

> **完全自包含、可离线运行的单 HTML 文件。**

必须满足：

- 单一 HTML 文件
- CSS 内嵌
- JavaScript 内嵌
- GLSL Shader 内嵌
- Three.js 打包进入 HTML
- Bloom 等必要模块打包进入 HTML
- 不依赖 CDN
- 不依赖网络
- 不依赖外部图片
- 不依赖外部纹理
- 不依赖在线字体
- 不依赖外部模型
- 不依赖外部 Shader
- 不依赖其他 JS
- 不依赖其他 CSS
- 不通过 `fetch()` 加载资源
- 不要求 localhost
- 不要求开发服务器

---

# 4. 最终发布版本禁止项

最终 `particle-rose.html` 中禁止依赖：

```text
CDN
网络字体
在线图片
在线纹理
外部模型
外部 JavaScript
外部 CSS
外部 GLSL
远程 API
运行时网络请求
```

例如最终版本中不能存在：

```javascript
import * as THREE from "https://cdn...";
```

也不能存在：

```html
<script src="https://..."></script>
```

因为这种方式虽然表面上只有一个 HTML，但断网后无法正常运行。

---

# 5. 开发环境与运行环境

## 5.1 开发阶段

开发阶段采用：

```text
Three.js
+
WebGL
+
GLSL Shader
+
Vite
```

开发者电脑可以使用：

- Node.js
- npm
- Three.js
- Vite

这些工具的作用是：

- 模块化开发
- 本地调试
- Shader 导入
- JavaScript 打包
- Three.js 打包
- 最终生成单 HTML

---

## 5.2 最终运行阶段

最终用户只获得：

```text
particle-rose.html
```

最终用户只需要：

> 一个支持 WebGL 的现代浏览器。

例如：

- Chrome
- Edge
- Firefox
- 其他现代 Chromium 浏览器

用户不需要知道项目使用了 Three.js。

Three.js 会作为 JavaScript 代码的一部分被直接包含在最终 HTML 中。

---

# 6. 项目结构

开发阶段目录：

```text
particle-rose/
│
├─ index.html
├─ package.json
├─ README.md
│
├─ src/
│  ├─ main.js
│  ├─ style.css
│  ├─ rose.js
│  ├─ interaction.js
│  │
│  └─ shaders/
│     ├─ particle.vert.glsl
│     └─ particle.frag.glsl
│
├─ scripts/
│  └─ build-singlefile.mjs
│
└─ dist/
   └─ particle-rose.html
```

整体关系：

```text
开发源码
   │
   ├── main.js
   ├── rose.js
   ├── interaction.js
   ├── style.css
   └── shaders/
          │
          ▼
       Three.js
          │
          ▼
        Build
          │
          ▼
build-singlefile.mjs
          │
          ▼
dist/particle-rose.html
```

---

# 7. 文件说明

## `index.html`

开发版本的 HTML 入口。

主要负责：

- 提供基础 HTML 结构
- 提供 WebGL Canvas 的挂载位置
- 加载 `src/main.js`
- 设置 viewport
- 设置页面 metadata

不负责：

- 生成玫瑰
- 计算花瓣
- 粒子动画
- Shader
- 交互逻辑

关系：

```text
index.html
    │
    ▼
src/main.js
```

---

# 8. `package.json`

项目开发依赖和构建脚本配置。

主要开发依赖：

```text
three
vite
```

注意：

> `package.json` 和其中的依赖只服务于开发和构建。

最终用户不需要：

```text
package.json
node_modules/
npm
Vite
```

---

# 9. Three.js

Three.js 主要负责：

- Scene
- PerspectiveCamera
- WebGLRenderer
- BufferGeometry
- BufferAttribute
- ShaderMaterial
- Points
- Matrix
- 后处理
- Bloom
- WebGL 状态管理

Three.js 不负责决定玫瑰长什么样。

真正决定玫瑰结构的是：

```text
rose.js
```

---

# 10. Vite

Vite 只用于开发阶段。

负责：

- 本地开发服务器
- ES Module
- GLSL 导入
- JavaScript 打包
- Three.js 打包
- 构建发布版本

最终用户不需要 Vite。

---

# 11. `src/main.js`

整个项目的主控制器。

负责连接所有模块。

主要流程：

```text
创建 Scene
    ↓
创建 Camera
    ↓
创建 Renderer
    ↓
创建 Rose
    ↓
配置后处理
    ↓
配置 Bloom
    ↓
初始化 Interaction
    ↓
启动 Animation Loop
```

主要职责：

- 创建 Three.js Scene
- 创建 PerspectiveCamera
- 创建 WebGLRenderer
- 设置 Canvas 尺寸
- 设置 Device Pixel Ratio
- 创建 Rose
- 将 Rose 加入 Scene
- 配置后处理
- 配置 Bloom
- 初始化交互模块
- 维护时间
- 更新 Shader Uniform
- 更新玫瑰姿态
- 处理 Resize
- 执行每帧渲染
- 收集 FPS
- 根据性能调整质量等级

`main.js` 不直接负责花瓣数学结构。

---

# 12. `src/style.css`

负责页面基础样式。

主要包括：

- 移除默认 margin
- 页面全屏
- Canvas 全屏
- 禁止滚动
- 隐藏 overflow
- 设置背景
- Touch 行为
- 移动端 viewport

建议背景：

```text
#020102
```

CSS 不负责：

- 粒子颜色
- 粒子 Glow
- 花瓣颜色
- 粒子透明度
- Bloom
- 粒子闪烁

这些主要由 WebGL 和 Shader 完成。

---

# 13. `src/rose.js`

整个项目最重要的模块。

负责：

> **生成单朵程序化 3D 粒子玫瑰。**

玫瑰质量首先取决于：

```text
花瓣结构
```

其次才是：

```text
粒子
Bloom
动画
```

因此开发优先级必须满足：

```text
花瓣结构
   >
粒子特效
   >
Bloom
```

---

# 14. 花瓣层级

玫瑰采用多层结构：

```text
Rose
│
├─ Inner Petals
├─ Middle Petals
└─ Outer Petals
```

初步计划：

```text
Inner Petals
3～4 片

Middle Petals
5～7 片

Outer Petals
8～12 片
```

总花瓣数量不是固定值。

最终根据：

- 正面轮廓
- 侧面轮廓
- 花心结构
- 花瓣遮挡关系
- 粒子化后的清晰度

进行调整。

---

# 15. 程序化花瓣

不导入外部：

```text
OBJ
FBX
GLTF
GLB
```

每片花瓣通过数学曲面生成。

形式：

```text
P(u, v)
```

其中：

```text
u → 花瓣横向位置
v → 花瓣纵向位置
```

得到：

```text
x(u, v)
y(u, v)
z(u, v)
```

每片花瓣可以控制：

- 宽度
- 高度
- 曲率
- 中央凹陷
- 外翻
- 卷曲
- 倾斜
- 旋转
- 高度位置
- 层级
- 随机微扰

---

# 16. 粒子采样

生成花瓣曲面之后：

```text
Petal Surface
      ↓
Particle Sampling
      ↓
Particle Position
```

目标不是将整个花瓣均匀填满。

采用：

```text
花瓣内部
· · · · ·

花瓣边缘
••••••••••••
```

即：

> **边缘粒子密度高于内部。**

这样可以更加清晰地表现：

- 花瓣边界
- 花瓣曲率
- 花瓣重叠
- 花瓣层次

避免最终出现：

> 一团红色粒子云。

---

# 17. 粒子属性

每颗粒子预计包含：

```text
position
targetPosition
startPosition
color
size
random
petalIndex
layerIndex
animationOffset
edgeFactor
brightness
noiseSeed
```

不同属性分别用于：

- 粒子汇聚
- 开花顺序
- 颜色变化
- 大小变化
- 花瓣边缘高光
- 呼吸
- 鼠标扰动
- 随机闪烁

---

# 18. BufferGeometry

所有粒子最终写入：

```text
THREE.BufferGeometry
```

预计属性：

```text
position
aTargetPosition
aStartPosition
aColor
aSize
aRandom
aLayer
aEdgeFactor
aAnimationOffset
```

最终使用：

```text
THREE.Points
```

统一进行 GPU 渲染。

---

# 19. `src/interaction.js`

负责用户交互。

主要功能：

- Pointer 位置
- 鼠标视差
- Touch
- 轻微旋转
- 局部粒子扰动
- 平滑回弹

---

# 20. 鼠标视差

玫瑰不是模型查看器。

用户不能通过鼠标让玫瑰无限旋转。

鼠标移动只产生：

> **极轻微的空间视差。**

例如：

```text
鼠标向左
    ↓
玫瑰轻微向左偏转
```

目标偏转：

```text
约 ±5° ～ ±8°
```

运动需要：

- 缓慢
- 平滑
- 有惯性
- 无突然跳变

---

# 21. 鼠标粒子扰动

鼠标接近玫瑰时：

```text
Pointer
   ↓
附近粒子轻微偏离花瓣
```

鼠标离开：

```text
Particle
   ↓
缓慢回到 Target Position
```

扰动必须克制。

禁止：

- 粒子爆炸
- 大范围排斥
- 强烈震动
- 打散整朵玫瑰
- 严重破坏花瓣结构

交互应该让用户感觉：

> 玫瑰是一种能够轻微响应外界的粒子生命体。

---

# 22. `src/shaders/particle.vert.glsl`

Vertex Shader 主要负责：

> **粒子在哪里。**

预计负责：

- 初始位置
- 目标位置
- 粒子汇聚
- 花瓣展开
- 呼吸
- 悬浮
- 鼠标扰动
- 粒子尺寸
- 透视缩放

---

# 23. 粒子汇聚

粒子具有：

```text
startPosition
targetPosition
```

通过：

```text
progress
```

进行插值：

```text
startPosition
      ↓
      ↓
targetPosition
```

最终组成玫瑰。

---

# 24. 花瓣逐层开放

所有粒子不能同时出现。

基本顺序：

```text
Inner Petals
     ↓
Middle Petals
     ↓
Outer Petals
```

每个粒子通过：

```text
layerIndex
animationOffset
```

获得不同动画时间。

最终表现为：

> 从花心向外逐层绽放。

---

# 25. 呼吸与悬浮

玫瑰形成后不会完全静止。

允许：

```text
Small Sine Offset
```

产生：

- 微弱呼吸
- 极轻微悬浮
- 微弱生命感

禁止：

- 高频抖动
- 明显波浪
- 大幅变形

---

# 26. `src/shaders/particle.frag.glsl`

Fragment Shader 主要负责：

> **每颗粒子看起来是什么样子。**

主要控制：

- 形状
- Alpha
- Glow
- 颜色
- 中心亮度
- 边缘透明度
- Highlight

---

# 27. 圆形粒子

禁止：

```text
■
```

目标：

```text
    ·
  · ● ·
    ·
```

通过：

```glsl
gl_PointCoord
```

计算距离中心的位置。

超出圆形范围：

```glsl
discard;
```

---

# 28. 柔和粒子

粒子中心较亮。

边缘逐渐透明：

```text
中心
█████
▓▓▓▓▓
▒▒▒▒▒
░░░░░
边缘
```

可以使用近似高斯衰减：

```text
alpha = exp(-k * r²)
```

最终粒子应该更接近：

> 星尘 / 微光

而不是：

> 像素块。

---

# 29. 配色

整体使用深红色体系。

主要颜色方向：

```text
Deep Burgundy
Dark Red
Crimson
Rose Red
Rose Pink
```

可参考：

```text
深暗区域      #4A0713
暗红          #791124
主体红        #B51E3D
玫红高光      #E34868
边缘高光      #FF8295
```

颜色后续根据实际 HDR / Bloom 表现调整。

---

# 30. 高光比例

高亮粒子必须控制数量。

初步比例：

```text
普通粒子
约 95%

高亮粒子
约 3%～4%

极亮粒子
约 1%
```

暖白粒子只作为极少量视觉焦点。

禁止大量纯白粒子覆盖花瓣。

---

# 31. Bloom

后处理主要使用：

```text
EffectComposer
RenderPass
UnrealBloomPass
```

Bloom 主要影响：

- 花瓣边缘高亮
- 极少量高亮粒子
- 花心局部亮点

目标：

> **柔和发光。**

禁止：

> **整朵玫瑰像霓虹灯一样全部过曝。**

暗部必须保留。

---

# 32. 视觉设计原则

## 32.1 只有一朵玫瑰

不制作：

- 花束
- 包装纸
- 蝴蝶结
- 花瓶
- 立方体
- 线框边界
- 大量满天星

所有视觉注意力集中到：

> **一朵玫瑰。**

---

## 32.2 保留大量黑色空间

背景：

```text
#020102
```

大部分屏幕保持为空。

允许存在少量：

- 暗红浮尘
- 极弱背景粒子
- 少量星光

但不能发展成满屏星空。

---

## 32.3 花瓣优先

必须遵循：

```text
花瓣结构
   >
粒子结构
   >
发光效果
   >
背景特效
```

如果 Bloom 或粒子效果导致看不清花瓣：

> 删除特效，而不是继续增加特效。

---

# 33. 初始动画设计

## Stage 1

```text
0.0s
```

页面接近黑暗。

只有极少量漂浮粒子。

---

## Stage 2

```text
约 0.5s
```

粒子开始缓慢靠近玫瑰区域。

---

## Stage 3

```text
约 1.2s
```

Inner Petals 形成。

花心首先出现。

---

## Stage 4

```text
约 2.0s
```

Middle Petals 开始展开。

---

## Stage 5

```text
约 2.8s
```

Outer Petals 出现。

---

## Stage 6

```text
约 3.5s ～ 4.0s
```

完整玫瑰形成。

之后进入持续状态。

---

# 34. 持续状态

完整形成后：

```text
轻微悬浮
+
极轻微呼吸
+
少量粒子闪烁
+
鼠标视差
+
鼠标局部扰动
```

禁止：

- 持续快速旋转
- 定期爆炸
- 不断重新组合
- 强烈闪烁
- 高频运动

---

# 35. 性能目标

最终 HTML 需要在不同性能设备上运行。

影响性能的主要因素：

```text
Particle Count
Device Pixel Ratio
Bloom Resolution
Shader Complexity
Background Particle Count
Post Processing
```

---

# 36. 初始质量等级

暂定三个级别。

## High

适用于性能较好的桌面设备：

```text
30,000 ～ 50,000 粒子
较高 Bloom 分辨率
较高 DPR
完整效果
```

---

## Medium

普通设备：

```text
15,000 ～ 30,000 粒子
中等 Bloom
受限 DPR
```

---

## Low

低性能设备或移动端：

```text
8,000 ～ 15,000 粒子
低 Bloom
低 DPR
减少背景粒子
```

以上数量只是初步范围。

最终以实际性能测试为准。

---

# 37. 自适应性能

第一版不依赖 GPU 型号判断。

主要依据：

```text
Viewport Size
Device Pixel Ratio
Mobile / Desktop
实际 FPS
```

例如：

```text
初始使用 Medium
        ↓
运行数秒
        ↓
计算 FPS
        ↓
FPS 长期较高
→ 提升部分画质

FPS 长期较低
→ 降低粒子数量或后处理质量
```

性能调整必须：

- 缓慢
- 不频繁跳级
- 用户不易察觉
- 不破坏玫瑰结构

---

# 38. `scripts/build-singlefile.mjs`

用于生成最终发布版本。

负责将：

```text
Three.js
CSS
JavaScript
Vertex Shader
Fragment Shader
Bloom
Rose Geometry
Interaction
```

整合到：

```text
dist/particle-rose.html
```

最终：

```text
开发文件
      ↓
Vite Build
      ↓
Single File Build
      ↓
particle-rose.html
```

---

# 39. `dist/particle-rose.html`

最终交付文件。

它才是真正提供给其他用户运行的版本。

必须能够：

```text
复制
 ↓
离线
 ↓
双击
 ↓
浏览器打开
 ↓
正常显示玫瑰
```

---

# 40. 开发阶段

项目严格按照以下阶段实现。

---

## Phase 1：基础 Three.js 场景

目标：

- Scene 正常
- Camera 正常
- Renderer 正常
- Canvas 全屏
- 黑色背景
- Resize 正常
- Shader 可以正常编译
- 基础测试粒子正常显示

暂时：

> 不生成真正的玫瑰。

---

## Phase 2：程序化静态玫瑰

目标：

- 实现花瓣数学曲面
- 构造 Inner / Middle / Outer Petals
- 调整花瓣旋转
- 调整遮挡关系
- 正面像玫瑰
- 侧面具有合理深度

这一阶段：

> 不追求复杂粒子动画。

---

## Phase 3：玫瑰粒子化

目标：

- 花瓣表面采样
- 花瓣边缘提高粒子密度
- 保持清晰花瓣轮廓
- 确定合理 Particle Count
- 验证不同视角

---

## Phase 4：Shader 粒子

目标：

- 圆形粒子
- 柔和 Alpha
- 大小变化
- 深度变化
- 深红渐变
- Edge Highlight

---

## Phase 5：Bloom

目标：

- 添加柔和 Glow
- 控制曝光
- 保留暗部
- 限制极亮粒子
- 避免霓虹感

---

## Phase 6：玫瑰绽放

实现：

```text
散落粒子
    ↓
Inner Petals
    ↓
Middle Petals
    ↓
Outer Petals
    ↓
完整玫瑰
```

---

## Phase 7：交互

实现：

- Pointer
- 鼠标视差
- 平滑旋转
- 局部粒子扰动
- 粒子回弹

---

## Phase 8：移动端和性能适配

实现：

- 手机尺寸适配
- Touch
- DPR 限制
- Mobile 粒子数量
- FPS 统计
- 动态画质等级

可选：

- DeviceOrientation
- 陀螺仪视差

不属于第一版必要功能。

---

## Phase 9：单文件离线构建

最后完成：

```text
Source
   ↓
Build
   ↓
dist/particle-rose.html
```

检查：

- [ ] 单个 HTML
- [ ] 无外部 JS
- [ ] 无外部 CSS
- [ ] 无外部 Shader
- [ ] 无 CDN
- [ ] 无图片资源
- [ ] 无字体资源
- [ ] 无模型资源
- [ ] 无网络请求
- [ ] 无 localhost 依赖
- [ ] Windows 双击可以运行
- [ ] Chrome 可以运行
- [ ] Edge 可以运行
- [ ] Firefox 尽量保持兼容
- [ ] 断网可以运行
- [ ] 普通设备具有可接受帧率
- [ ] 移动端可以正常显示

---

# 41. 第一版暂时不创建

暂时不创建：

```text
models/
textures/
images/
assets/
components/
materials/
```

如果后续没有明确需求，也不创建。

原则：

> **能通过程序化几何和 Shader 实现的效果，不增加外部资源。**

---

# 42. 开发原则

整个项目遵循以下原则：

### 原则 1

先保证：

```text
玫瑰像玫瑰
```

再考虑：

```text
玫瑰是否足够炫。
```

---

### 原则 2

如果静态状态不好看：

> 不允许通过 Bloom、动画和大量粒子掩盖结构问题。

---

### 原则 3

粒子必须服务于花瓣。

不能让花瓣服务于粒子特效。

---

### 原则 4

减少不必要元素。

最终画面只有：

```text
黑暗
+
玫瑰
+
极少量环境粒子
```

---

### 原则 5

优先保证：

```text
结构
→ 层次
→ 色彩
→ 粒子
→ 光效
→ 动画
→ 交互
```

严格按照这个顺序迭代。

---

# 43. 第一阶段完成标准

Phase 1 至少满足：

- [ ] 项目能够正常启动
- [ ] Three.js 正常渲染
- [ ] WebGLRenderer 正常
- [ ] Canvas 全屏
- [ ] 背景为近黑色
- [ ] Resize 正常
- [ ] Shader 编译正常
- [ ] 测试粒子正确显示
- [ ] 粒子为圆形而不是方块
- [ ] 粒子边缘具有柔和透明度
- [ ] 项目模块引用清晰

完成后进入：

> **Phase 2：程序化静态 3D 玫瑰。**

---

# 44. 最终验收标准

整个项目最终只有两个核心判断标准。

## 视觉标准

即使：

```text
关闭复杂动画
关闭鼠标交互
降低 Bloom
```

玫瑰本身仍然必须：

> **清晰、精致、具有明确的花瓣层次。**

---

## 发布标准

最终：

```text
particle-rose.html
```

必须能够：

> **复制到其他电脑，在没有项目环境、没有 Node.js、没有 npm、没有网络的情况下，直接通过浏览器打开并正常运行。**

这两个标准都满足后，项目才视为完成。