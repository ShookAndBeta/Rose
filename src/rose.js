import * as THREE from 'three';

import particleVertexShader
  from './shaders/particle.vert.glsl?raw';

import particleFragmentShader
  from './shaders/particle.frag.glsl?raw';


/*
 * =========================================================
 * 固定随机数
 *
 * 保证每次刷新生成同一朵玫瑰，
 * 方便我们持续调参数。
 * =========================================================
 */

function createRandom(seed = 20260817) {
  let value = seed >>> 0;

  return function random() {
    value += 0x6D2B79F5;

    let t = value;

    t = Math.imul(
      t ^ (t >>> 15),
      t | 1
    );

    t ^= t + Math.imul(
      t ^ (t >>> 7),
      t | 61
    );

    return (
      (t ^ (t >>> 14)) >>> 0
    ) / 4294967296;
  };
}


const random =
  createRandom();


function randomRange(min, max) {
  return (
    min
    + (max - min) * random()
  );
}


function degToRad(degree) {
  return degree * Math.PI / 180;
}


/*
 * 黄金角。
 *
 * 不再使用：
 *
 * 0°
 * 45°
 * 90°
 * 135°
 *
 * 这种规则圆环排列。
 *
 * 黄金角可以让花瓣天然形成螺旋错位。
 */

const GOLDEN_ANGLE =
  Math.PI * (3 - Math.sqrt(5));


/*
 * 类似 GLSL smoothstep。
 */

function smoothstep(
  edge0,
  edge1,
  x
) {
  const t =
    THREE.MathUtils.clamp(
      (x - edge0)
      / (edge1 - edge0),
      0,
      1
    );

  return (
    t * t * (3 - 2 * t)
  );
}


/*
 * =========================================================
 * 创建单片真正的 3D 花瓣
 * =========================================================
 */

function createPetalParticles(
  angle,
  config,
  positions,
  colors,
  sizes
) {
  const {
    particleCount,

    baseRadius,
    length,
    width,
    baseZ,

    tilt,
    roll,

    twist,

    arch,
    sideCup,
    tipCurl,
    edgeWave,

    sideEdgeRatio,
    tipEdgeRatio,

    baseColor,
    edgeColor,

    sizeMin,
    sizeMax
  } = config;


  const base =
    new THREE.Color(
      baseColor
    );

  const edge =
    new THREE.Color(
      edgeColor
    );


  /*
   * 每片花瓣自己的轻微波纹相位。
   */

  const wavePhase =
    randomRange(
      0,
      Math.PI * 2
    );


  for (
    let i = 0;
    i < particleCount;
    i++
  ) {

    /*
     * =====================================================
     * 1. 花瓣参数坐标
     *
     * u:
     * -1 → 左边缘
     *  0 → 中线
     * +1 → 右边缘
     *
     * v:
     *  0 → 花瓣根部
     *  1 → 花瓣顶部
     * =====================================================
     */

    let u;
    let v;


    const edgeChoice =
      random();


    /*
     * 一部分粒子专门描绘左右边缘。
     */

    if (
      edgeChoice
      < sideEdgeRatio
    ) {
      u =
        (
          random() < 0.5
            ? -1
            : 1
        )
        * randomRange(
          0.90,
          1.0
        );

      v =
        Math.pow(
          random(),
          0.80
        );
    }

    /*
     * 一部分专门描绘花瓣顶部边缘。
     */

    else if (
      edgeChoice
      <
      sideEdgeRatio
      + tipEdgeRatio
    ) {
      u =
        randomRange(
          -1,
          1
        );

      v =
        randomRange(
          0.90,
          1.0
        );
    }

    /*
     * 剩余粒子填充花瓣表面。
     */

    else {
      u =
        randomRange(
          -1,
          1
        );

      v =
        Math.pow(
          random(),
          0.82
        );
    }


    /*
     * =====================================================
     * 2. 花瓣宽度
     *
     * 与上一版最大的区别之一：
     *
     * 不再使用：
     *
     * sin(PI * v)
     *
     * 因为那个函数会让花瓣顶部再次收缩到一个点，
     * 很容易形成你截图里的“大椭圆圈”。
     *
     * 现在：
     *
     * 根部窄
     * ↓
     * 中部展开
     * ↓
     * 顶部保持较宽
     * =====================================================
     */

    const widthProfile =
      Math.pow(
        Math.sin(
          Math.PI
          * 0.5
          * v
        ),
        0.68
      )
      *
      (
        1.0
        - 0.10 * v
      );


    const localWidth =
      width
      * widthProfile;


    /*
     * =====================================================
     * 3. 花瓣螺旋
     *
     * 花瓣不是一条直线向外。
     *
     * 从根部 → 顶部，
     * 自身会产生少量角度变化。
     *
     * 内层 twist 最大。
     * =====================================================
     */

    const currentAngle =
      angle
      + twist
      * (
        v - 0.30
      );


    const radialX =
      Math.cos(
        currentAngle
      );

    const radialY =
      Math.sin(
        currentAngle
      );


    const tangentX =
      -radialY;

    const tangentY =
      radialX;


    /*
     * =====================================================
     * 4. 关键：真正的 3D 花瓣中心线
     *
     * tilt 表示：
     *
     * 花瓣相对于 +Z 花轴张开的角度。
     *
     *
     * tilt 小：
     *
     *       |
     *       |
     *       |
     *
     * 内层花瓣竖起来。
     *
     *
     * tilt 大：
     *
     *       ____
     *
     * 外层花瓣展开。
     * =====================================================
     */


    const lengthProgress =
      Math.pow(
        v,
        1.05
      );


    /*
     * XY 径向扩张。
     */

    const radialDistance =
      baseRadius
      +
      length
      * Math.sin(tilt)
      * lengthProgress;


    /*
     * Z 方向高度。
     */

    let z =
      baseZ
      +
      length
      * Math.cos(tilt)
      * lengthProgress;


    /*
     * =====================================================
     * 5. 花瓣纵向弧度
     * =====================================================
     */

    /*
     * 中部轻微向前鼓起。
     */

    z +=
      arch
      * Math.sin(
        Math.PI * v
      );


    /*
     * 顶部卷曲。
     *
     * 外层花瓣 tipCurl 更大，
     * 因此顶部会向后翻。
     */

    const tipProgress =
      smoothstep(
        0.66,
        1.0,
        v
      );

    const tipSoftness =
        0.84
        + 0.16 * (1.0 - Math.abs(u));

    z -=
      tipCurl
      * tipProgress
      * tipProgress
      * tipSoftness;


    /*
     * =====================================================
     * 6. 左右横向位置
     * =====================================================
     */

    const lateral =
      u
      * localWidth;


    /*
     * roll：
     *
     * 每一片花瓣左右略有倾斜。
     *
     * 不再所有花瓣完全水平。
     */

    const lateralXY =
      lateral
      * Math.cos(
        roll
      );


    let x =
      radialDistance
      * radialX
      +
      lateralXY
      * tangentX;


    let y =
      radialDistance
      * radialY
      +
      lateralXY
      * tangentY;


    /*
     * roll 同时产生 Z 差异。
     *
     * 一边略高，
     * 一边略低。
     */

    z +=
      lateral
      * Math.sin(
        roll
      );


    /*
     * =====================================================
     * 7. 花瓣横向杯状曲率
     *
     * 花瓣中心略向前，
     * 两侧略向后。
     *
     * 这样花瓣本身不是一张平面纸。
     * =====================================================
     */

    const centerCup =
      (
        1.0
        - u * u
      )
      *
      Math.sin(
        Math.PI * v
      );


    z +=
      sideCup
      * centerCup;


    /*
     * =====================================================
     * 8. 花瓣顶部轻微自然波浪
     * =====================================================
     */

    const waveFade =
        0.62
        + 0.38 * (1.0 - tipProgress);

    z +=
        edgeWave
        *
        Math.sin(
            u
            * Math.PI
            * 1.6
            + wavePhase
        )
        *
        tipProgress
        *
        Math.abs(u)
        *
        waveFade;


    /*
     * =====================================================
     * 9. 微小随机扰动
     *
     * 只消除数学模型感。
     *
     * 不能大。
     * =====================================================
     */

    x +=
      randomRange(
        -0.004,
        0.004
      );

    y +=
      randomRange(
        -0.004,
        0.004
      );

    z +=
      randomRange(
        -0.0035,
        0.0035
      );


    positions.push(
      x,
      y,
      z
    );


    /*
     * =====================================================
     * 10. 颜色
     * =====================================================
     */

    const sideEdge =
      Math.pow(
        Math.abs(u),
        3.5
      );


    const tipEdge =
      Math.pow(
        v,
        7.0
      );


    const highlight =
      THREE.MathUtils.clamp(
        sideEdge * 0.58
        +
        tipEdge * 0.20
        +
        random() * 0.08,
        0,
        1
      );


    colors.push(
      THREE.MathUtils.lerp(
        base.r,
        edge.r,
        highlight
      ),

      THREE.MathUtils.lerp(
        base.g,
        edge.g,
        highlight
      ),

      THREE.MathUtils.lerp(
        base.b,
        edge.b,
        highlight
      )
    );


    /*
     * =====================================================
     * 11. 粒子大小
     * =====================================================
     */

    const edgeFactor =
      Math.max(
        sideEdge,
        tipEdge
      );


    sizes.push(
      randomRange(
        sizeMin,
        sizeMax
      )
      *
      (
        1.0
        + edgeFactor * 0.20
      )
    );
  }
}


/*
 * =========================================================
 * 创建一层花瓣
 * =========================================================
 */

function createPetalLayer(
  config,
  positions,
  colors,
  sizes
) {
  const {
    petalCount,
    angleOffset,

    angleJitter,

    tiltDeg,
    tiltJitterDeg,

    rollJitterDeg,

    lengthVariation,
    widthVariation,

    radiusVariation,
    zVariation
  } = config;


  for (
    let i = 0;
    i < petalCount;
    i++
  ) {

    /*
     * =====================================================
     * 黄金角螺旋排列
     *
     * 不再使用：
     *
     * i / petalCount * 2PI
     *
     * 这是去掉“太阳花 / 同心圆感”的核心。
     * =====================================================
     */

    const angle =
      angleOffset
      +
      i * GOLDEN_ANGLE
      +
      randomRange(
        -angleJitter,
        angleJitter
      );


    /*
     * 每片花瓣拥有自己的真正 3D 倾角。
     */

    const tilt =
      degToRad(
        tiltDeg
        +
        randomRange(
          -tiltJitterDeg,
          tiltJitterDeg
        )
      );


    /*
     * 每片花瓣左右倾斜不同。
     */

    const roll =
      degToRad(
        randomRange(
          -rollJitterDeg,
          rollJitterDeg
        )
      );


    const petalConfig = {
      ...config,

      tilt,

      roll,

      length:
        config.length
        *
        randomRange(
          1.0 - lengthVariation,
          1.0 + lengthVariation
        ),

      width:
        config.width
        *
        randomRange(
          1.0 - widthVariation,
          1.0 + widthVariation
        ),

      baseRadius:
        config.baseRadius
        +
        randomRange(
          -radiusVariation,
          radiusVariation
        ),

      baseZ:
        config.baseZ
        +
        randomRange(
          -zVariation,
          zVariation
        )
    };


    createPetalParticles(
      angle,
      petalConfig,
      positions,
      colors,
      sizes
    );
  }
}


/*
 * =========================================================
 * 花萼
 *
 * 花朵背面不能只是花瓣底部的圆形轮廓。五片向外伸展的
 * 花萼会在侧面提供厚度，也会让花束转到背面时仍有结构。
 * =========================================================
 */

function createCalyx() {
  const positions = [];
  const colors = [];

  const dark =
    new THREE.Color('#360912');

  const edge =
    new THREE.Color('#8D1B37');

  const sepalCount = 5;
  const particlesPerSepal = 125;

  for (
    let sepalIndex = 0;
    sepalIndex < sepalCount;
    sepalIndex++
  ) {
    const angle =
      sepalIndex / sepalCount
      * Math.PI * 2
      + 0.34;

    const radialX = Math.cos(angle);
    const radialY = Math.sin(angle);
    const tangentX = -radialY;
    const tangentY = radialX;

    for (
      let i = 0;
      i < particlesPerSepal;
      i++
    ) {
      const t = Math.pow(random(), 0.86);
      const u = randomRange(-1, 1);

      /* 根部窄、中段稍宽、末端收尖。 */
      const halfWidth =
        0.105
        * Math.pow(Math.sin(Math.PI * t), 0.72);

      const radius =
        0.12
        + 0.43 * t;

      const lateral =
        u * halfWidth;

      const edgeLift =
        0.035 * u * u * Math.sin(Math.PI * t);

      positions.push(
        radius * radialX + lateral * tangentX
          + randomRange(-0.003, 0.003),

        radius * radialY + lateral * tangentY
          + randomRange(-0.003, 0.003),

        -0.365
          - 0.10 * Math.sin(Math.PI * t)
          + 0.035 * t
          + edgeLift
          + randomRange(-0.003, 0.003)
      );

      const mix =
        THREE.MathUtils.clamp(
          Math.pow(Math.abs(u), 3.0) * 0.58
            + Math.pow(t, 5.0) * 0.28
            + random() * 0.07,
          0,
          1
        );

      colors.push(
        THREE.MathUtils.lerp(dark.r, edge.r, mix),
        THREE.MathUtils.lerp(dark.g, edge.g, mix),
        THREE.MathUtils.lerp(dark.b, edge.b, mix)
      );
    }
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );

  const material =
    new THREE.PointsMaterial({
      size: 0.021,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthTest: true,
      depthWrite: true,
      blending: THREE.NormalBlending
    });

  return new THREE.Points(
    geometry,
    material
  );
}


/*
 * =========================================================
 * 花瓣局部 Bloom
 *
 * 不再对整个画面执行后处理。这个叠加层只读取花瓣顶点颜色，
 * 仅让高亮边缘粒子产生柔和扩散，因此不会提亮包装纸和花柄。
 * =========================================================
 */

function createPetalBloomMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFormation: {
        value: 0
      }
    },

    vertexColors: true,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,

    vertexShader: `
      attribute float aSize;
      attribute vec3 aStartPosition;
      attribute float aDelay;

      uniform float uFormation;

      varying vec3 vColor;
      varying float vReveal;

      void main() {
        vColor = color;

        float progress =
          smoothstep(
            aDelay,
            aDelay + 0.34,
            uFormation
          );

        float easedProgress =
          1.0
          - pow(1.0 - progress, 3.0);

        vReveal = progress;

        vec3 formedPosition =
          mix(
            aStartPosition,
            position,
            easedProgress
          );

        vec4 viewPosition =
          viewMatrix
          * modelMatrix
          * vec4(formedPosition, 1.0);

        gl_Position =
          projectionMatrix
          * viewPosition;

        /* 比主体粒子略大，只用于形成局部柔光。 */
        gl_PointSize =
          aSize
          * 18.0
          / max(1.0, -viewPosition.z)
          * 0.92;
      }
    `,

    fragmentShader: `
      precision highp float;
      varying vec3 vColor;
      varying float vReveal;

      void main() {
        float brightness =
          max(
            vColor.r,
            max(vColor.g, vColor.b)
          );

        /* 深红主体不发光，只有玫红边缘进入 Bloom。 */
        float bloomMask =
          smoothstep(
            0.48,
            0.92,
            brightness
          );

        if (bloomMask < 0.015) {
          discard;
        }

        vec2 uv =
          gl_PointCoord
          - vec2(0.5);

        float distanceToCenter =
          length(uv);

        if (distanceToCenter > 0.5) {
          discard;
        }

        float halo =
          exp(
            -distanceToCenter
            * distanceToCenter
            * 8.0
          );

        float core =
          exp(
            -distanceToCenter
            * distanceToCenter
            * 34.0
          );

        float alpha =
          (
            halo * 0.075
            + core * 0.075
          )
          * bloomMask;

        vec3 glowColor =
          mix(
            vColor,
            vec3(1.0, 0.20, 0.34),
            0.28
          );

        gl_FragColor =
          vec4(
            glowColor,
            alpha
          );
      }
    `
  });
}


/*
 * =========================================================
 * 创建完整玫瑰
 * =========================================================
 */

export function createRose() {

  const positions = [];
  const colors = [];
  const sizes = [];


  /*
   * =====================================================
   * Layer 1：花心
   *
   * 几乎竖直。
   *
   * 形成紧密的中央螺旋。
   * =====================================================
   */

  createPetalLayer(
  {
    petalCount: 5,
    particleCount: 180,

    angleOffset: 0.10,
    angleJitter: 0.08,

    baseRadius: 0.018,
    radiusVariation: 0.010,

    length: 0.56,
    lengthVariation: 0.07,

    width: 0.18,
    widthVariation: 0.08,

    baseZ: -0.19,
    zVariation: 0.020,

    tiltDeg: 14,
    tiltJitterDeg: 4,

    rollJitterDeg: 6,

    twist: 1.10,

    arch: 0.070,

    tipCurl: -0.020,

    sideCup: 0.12,

    edgeWave: 0.008,

    sideEdgeRatio: 0.30,
    tipEdgeRatio: 0.20,

    baseColor: '#94142F',
    edgeColor: '#FF5575',

    sizeMin: 1.8,
    sizeMax: 2.8
  },

  positions,
  colors,
  sizes
);


  /*
   * =====================================================
   * Layer 2：内层
   *
   * 开始向外打开，
   * 但整体仍然比较竖。
   * =====================================================
   */

    createPetalLayer(
  {
    petalCount: 7,
    particleCount: 220,

    angleOffset: 0.66,
    angleJitter: 0.12,

    baseRadius: 0.08,
    radiusVariation: 0.020,

    length: 0.62,
    lengthVariation: 0.08,

    width: 0.26,
    widthVariation: 0.09,

    baseZ: -0.23,
    zVariation: 0.028,

    tiltDeg: 24,
    tiltJitterDeg: 5,

    rollJitterDeg: 8,

    twist: 0.68,

    arch: 0.085,
    tipCurl: 0.010,

    sideCup: 0.11,

    edgeWave: 0.010,

    sideEdgeRatio: 0.28,
    tipEdgeRatio: 0.18,

    baseColor: '#A11938',
    edgeColor: '#FF5E7D',

    sizeMin: 1.8,
    sizeMax: 3.0
  },

  positions,
  colors,
  sizes
);


  /*
   * =====================================================
   * Layer 3：中层
   *
   * 明显向外展开。
   * =====================================================
   */

  createPetalLayer(
  {
    petalCount: 10,
    particleCount: 260,

    angleOffset: 0.25,
    angleJitter: 0.15,

    baseRadius: 0.15,
    radiusVariation: 0.030,

    length: 0.72,
    lengthVariation: 0.09,

    width: 0.33,
    widthVariation: 0.13,

    baseZ: -0.29,
    zVariation: 0.040,

    tiltDeg: 35,
    tiltJitterDeg: 5,

    rollJitterDeg: 10,

    twist: 0.24,

    arch: 0.080,
    tipCurl: 0.060,

    sideCup: 0.090,

    edgeWave: 0.016,

    sideEdgeRatio: 0.24,
    tipEdgeRatio: 0.20,

    baseColor: '#87152E',
    edgeColor: '#FF6885',

    sizeMin: 1.8,
    sizeMax: 3.2
  },

  positions,
  colors,
  sizes
);


  /*
   * =====================================================
   * Layer 4：外层
   *
   * 大幅展开。
   *
   * 这是决定侧面是否像真正玫瑰的关键层。
   * =====================================================
   */

  createPetalLayer(
  {
    petalCount: 12,
    particleCount: 280,

    angleOffset: 0.92,
    angleJitter: 0.16,

    baseRadius: 0.24,
    radiusVariation: 0.035,

    length: 0.76,
    lengthVariation: 0.09,

    width: 0.39,
    widthVariation: 0.14,

    baseZ: -0.35,
    zVariation: 0.045,

    tiltDeg: 43,
    tiltJitterDeg: 5,

    rollJitterDeg: 11,

    twist: 0.10,

    arch: 0.060,

    tipCurl: 0.065,

    sideCup: 0.072,

    edgeWave: 0.018,

    sideEdgeRatio: 0.22,
    tipEdgeRatio: 0.20,

    baseColor: '#7D1228',
    edgeColor: '#FF718C',

    sizeMin: 1.9,
    sizeMax: 3.3
  },

  positions,
  colors,
  sizes
);


  /*
   * =====================================================
   * Phase 6：花瓣汇聚属性
   *
   * 四层花瓣拥有不同延迟。初始粒子集中在花柄顶部附近，随后
   * 按花心、内层、中层、外层的顺序移动到目标位置。
   * =====================================================
   */
  const startPositions = [];
  const formationDelays = [];

  const layerParticleCounts = [
    5 * 180,
    7 * 220,
    10 * 260,
    12 * 280
  ];

  const layerStartDelays = [
    0.00,
    0.18,
    0.38,
    0.58
  ];

  let particleCursor =
    0;

  for (
    let layerIndex = 0;
    layerIndex < layerParticleCounts.length;
    layerIndex++
  ) {
    const count =
      layerParticleCounts[layerIndex];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const i3 =
        particleCursor * 3;

      const targetX =
        positions[i3];

      const targetY =
        positions[i3 + 1];

      startPositions.push(
        targetX * 0.08
          + randomRange(-0.030, 0.030),
        targetY * 0.08
          + randomRange(-0.030, 0.030),
        -0.27
          + randomRange(-0.045, 0.045)
      );

      formationDelays.push(
        layerStartDelays[layerIndex]
          + randomRange(0, 0.055)
      );

      particleCursor++;
    }
  }


  /*
   * =====================================================
   * BufferGeometry
   * =====================================================
   */

  const geometry =
    new THREE.BufferGeometry();


  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );


  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(
      colors,
      3
    )
  );


  geometry.setAttribute(
    'aSize',
    new THREE.Float32BufferAttribute(
      sizes,
      1
    )
  );


  geometry.setAttribute(
    'aStartPosition',
    new THREE.Float32BufferAttribute(
      startPositions,
      3
    )
  );


  geometry.setAttribute(
    'aDelay',
    new THREE.Float32BufferAttribute(
      formationDelays,
      1
    )
  );


  geometry.computeBoundingSphere();


  /*
   * =====================================================
   * Material
   *
   * Phase 2B 新的重要修改：
   *
   * depthWrite = true
   *
   * 让前面的花瓣真正遮挡后面的花瓣。
   *
   * 否则 360° 旋转时，
   * 所有背后的粒子都会透出来，
   * 看起来像钢丝网。
   * =====================================================
   */

  const material =
    new THREE.ShaderMaterial({
      uniforms: {
        uFormation: {
          value: 0
        }
      },

      vertexShader:
        particleVertexShader,

      fragmentShader:
        particleFragmentShader,

      vertexColors: true,

      transparent: true,

      depthTest: true,

      depthWrite: true,

      blending:
        THREE.NormalBlending
    });


  const rose =
    new THREE.Points(
      geometry,
      material
    );


  /*
   * 花萼位于花瓣之后。它既补足侧面的纵深，也让背面拥有
   * 清楚的放射状剪影，而不是一块没有细节的花瓣底面。
   */
  const calyx =
    createCalyx();


  calyx.material.opacity =
    0.78;


  /* 花萼也从花心附近展开，不能在花瓣形成前保持完整大小。 */
  calyx.scale.setScalar(
    0.12
  );


  rose.add(
    calyx
  );


  const bloomMaterial =
    createPetalBloomMaterial();


  const petalBloom =
    new THREE.Points(
      geometry,
      bloomMaterial
    );


  petalBloom.renderOrder =
    2;


  rose.add(
    petalBloom
  );


  rose.userData.setFormation =
    (progress) => {
      const clamped =
        THREE.MathUtils.clamp(
          progress,
          0,
          1
        );

      material.uniforms.uFormation.value =
        clamped;

      bloomMaterial.uniforms.uFormation.value =
        clamped;

      calyx.material.opacity =
        0.78;

      const calyxProgress =
        THREE.MathUtils.smoothstep(
          clamped,
          0.42,
          0.88
        );

      const calyxScale =
        0.12
        + (
          1.0
          - Math.pow(
            1.0 - calyxProgress,
            3.0
          )
        )
          * 0.88;

      calyx.scale.setScalar(
        calyxScale
      );
    };


  /*
   * 当前相机距离下的初始大小。
   */

  rose.scale.setScalar(
    0.92
  );


  return rose;
}