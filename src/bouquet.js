import * as THREE from 'three';

import {
  createRose
} from './rose.js';

import {
  createWrapper
} from './wrapper.js';

import {
  createRibbon
} from './ribbon.js';

import {
  createStemLeaves
} from './stem-leaves.js';


/*
 * =========================================================
 * 花茎粒子材质
 * =========================================================
 */

function createStemMaterial(
  growthOrigin
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGrowth: {
        value: 0
      },
      uGrowthOrigin: {
        value: growthOrigin.clone()
      }
    },

    transparent: true,

    depthTest: true,

    /*
     * 花茎属于辅助结构，
     * 不强烈参与深度遮挡。
     */
    depthWrite: false,

    blending: THREE.NormalBlending,

    vertexShader: `
      attribute float aSize;
      attribute float aProgress;

      uniform float uGrowth;
      uniform vec3 uGrowthOrigin;

      varying float vReveal;

      void main() {
        vReveal =
          smoothstep(
            aProgress,
            aProgress + 0.075,
            uGrowth
          );

        /*
         * 整根花柄连续拉伸生长。不能把尚未生长的所有粒子堆在
         * 生长端点，否则数千个粒子重叠后会产生异常亮点。
         */
        float growthAmount =
          max(
            smoothstep(
              0.0,
              1.0,
              uGrowth
            ),
            0.04
          );

        vec3 grownPosition =
          mix(
            uGrowthOrigin,
            position,
            growthAmount
          );

        vec4 modelPosition =
          modelMatrix
          * vec4(grownPosition, 1.0);

        vec4 viewPosition =
          viewMatrix
          * modelPosition;

        gl_Position =
          projectionMatrix
          * viewPosition;

        float perspective =
          18.0
          / max(
            1.0,
            -viewPosition.z
          );

        gl_PointSize =
          aSize
          * perspective;
      }
    `,

    fragmentShader: `
      precision highp float;

      varying float vReveal;

      void main() {
        vec2 uv =
          gl_PointCoord
          - vec2(0.5);

        float dist =
          length(uv);

        if (dist > 0.5) {
          discard;
        }

        float alpha =
          exp(
            -dist
            * dist
            * 18.0
          );

        if (alpha < 0.05) {
          discard;
        }

        /*
         * 深绿色花茎。保持低饱和、低亮度，既符合真实花材，
         * 又不会抢走红色花头的视觉中心。
         */
        vec3 baseColor =
          vec3(
            0.055,
            0.24,
            0.105
          );

        float core =
          exp(
            -dist
            * dist
            * 55.0
          );

        vec3 finalColor =
          baseColor
          + vec3(
            0.075,
            0.16,
            0.060
          )
          * core;

        gl_FragColor =
          vec4(
            finalColor,
            alpha * 0.90
          );
      }
    `
  });
}


/*
 * =========================================================
 * 创建全部花茎
 *
 * 每一根花茎：
 *
 * Rose
 *   ↓
 * Curve
 *   ↓
 * Tie Point
 * =========================================================
 */

function createStems(
  roseConfigs,
  tiePoint
) {
  const positions = [];
  const sizes = [];
  const progresses = [];


  for (
    let roseIndex = 0;
    roseIndex < roseConfigs.length;
    roseIndex++
  ) {
    const config =
      roseConfigs[roseIndex];


    /*
     * 花茎起点位于花头后下方。
     */
    const start =
      new THREE.Vector3(
        config.x,
        config.y - 0.18,
        config.z - 0.10
      );


    /*
     * 中间控制点向花束中心收束。
     */
    const control =
      new THREE.Vector3(
        config.x * 0.42,

        (
          config.y
          + tiePoint.y
        ) * 0.48,

        config.z * 0.35
      );


    const curve =
      new THREE.QuadraticBezierCurve3(
        start,
        control,
        tiePoint
      );


    /*
     * 每根花茎用约 80 个粒子表示。
     */
    const stemPoints =
      curve.getPoints(80);


    for (
      let i = 0;
      i < stemPoints.length;
      i++
    ) {
      const point =
        stemPoints[i];

      const progress =
        i
        / (
          stemPoints.length
          - 1
        );

      /*
       * 每根花茎不再只画一条几乎看不见的粒子线，而是采样一个
       * 很细的截面。这样旋转到侧面时仍然有真实的圆柱厚度。
       */
      const tubeRadius =
        0.008
        + progress * 0.008;

      for (
        let strand = 0;
        strand < 4;
        strand++
      ) {
        const strandAngle =
          strand / 4
          * Math.PI * 2
          + roseIndex * 0.73;

        positions.push(
          point.x
            + Math.cos(strandAngle) * tubeRadius
            + (Math.random() - 0.5) * 0.003,

          point.y
            + (Math.random() - 0.5) * 0.003,

          point.z
            + Math.sin(strandAngle) * tubeRadius
            + (Math.random() - 0.5) * 0.003
        );

        sizes.push(
          1.55
          + progress * 0.55
        );

        /* 数组顺序为花头到扎口，因此生长进度需要反转。 */
        progresses.push(
          1.0 - progress
        );
      }
    }
  }


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
    'aSize',

    new THREE.Float32BufferAttribute(
      sizes,
      1
    )
  );


  geometry.setAttribute(
    'aProgress',

    new THREE.Float32BufferAttribute(
      progresses,
      1
    )
  );


  return new THREE.Points(
    geometry,
    createStemMaterial(
      tiePoint
    )
  );
}


/*
 * =========================================================
 * 扎口下方的手持花柄
 *
 * 上方花茎以前全部终止在蝴蝶结处，因此视觉上像花束被截断。
 * 这里让每根茎继续向下延伸，并在末端略微散开。
 * =========================================================
 */

function createHandleStems(
  roseConfigs,
  tiePoint
) {
  const positions = [];
  const sizes = [];
  const progresses = [];
  const count = roseConfigs.length;

  for (
    let stemIndex = 0;
    stemIndex < count;
    stemIndex++
  ) {
    const centered =
      count <= 1
        ? 0
        : stemIndex / (count - 1) - 0.5;

    const start =
      new THREE.Vector3(
        tiePoint.x + centered * 0.055,
        tiePoint.y - 0.01,
        Math.sin(stemIndex * 2.1) * 0.025
      );

    const control =
      new THREE.Vector3(
        tiePoint.x + centered * 0.10,
        tiePoint.y - 0.38,
        Math.sin(stemIndex * 1.7) * 0.045
      );

    const end =
      new THREE.Vector3(
        tiePoint.x + centered * 0.30,
        tiePoint.y - 0.82 - (stemIndex % 2) * 0.045,
        Math.sin(stemIndex * 1.35) * 0.085
      );

    const curve =
      new THREE.QuadraticBezierCurve3(
        start,
        control,
        end
      );

    const points =
      curve.getPoints(76);

    for (
      let i = 0;
      i < points.length;
      i++
    ) {
      const point = points[i];
      const progress = i / (points.length - 1);
      const radius = 0.010 - progress * 0.002;

      for (
        let strand = 0;
        strand < 5;
        strand++
      ) {
        const angle =
          strand / 5 * Math.PI * 2
          + stemIndex * 0.61;

        positions.push(
          point.x
            + Math.cos(angle) * radius
            + (Math.random() - 0.5) * 0.0025,
          point.y
            + (Math.random() - 0.5) * 0.0025,
          point.z
            + Math.sin(angle) * radius
            + (Math.random() - 0.5) * 0.0025
        );

        sizes.push(
          1.75
          - progress * 0.22
        );

        /* 手持部分从最下端向扎口生长。 */
        progresses.push(
          1.0 - progress
        );
      }
    }
  }

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
    'aSize',
    new THREE.Float32BufferAttribute(
      sizes,
      1
    )
  );

  geometry.setAttribute(
    'aProgress',
    new THREE.Float32BufferAttribute(
      progresses,
      1
    )
  );

  const bottomOrigin =
    new THREE.Vector3(
      tiePoint.x,
      tiePoint.y - 0.88,
      tiePoint.z
    );

  return new THREE.Points(
    geometry,
    createStemMaterial(
      bottomOrigin
    )
  );
}


/*
 * =========================================================
 * 扎口粒子
 *
 * 后续 Ribbon 会围绕这个位置生成。
 * =========================================================
 */

function createTiePointParticles(
  tiePoint
) {
  const particleCount =
    100;


  const positions =
    new Float32Array(
      particleCount * 3
    );


  const sizes =
    new Float32Array(
      particleCount
    );


  for (
    let i = 0;
    i < particleCount;
    i++
  ) {
    const i3 =
      i * 3;


    const radius =
      Math.random()
      * 0.055;


    const theta =
      Math.random()
      * Math.PI
      * 2.0;


    const phi =
      Math.acos(
        Math.random()
        * 2.0
        - 1.0
      );


    positions[i3] =
      tiePoint.x
      +
      radius
      * Math.sin(phi)
      * Math.cos(theta);


    positions[i3 + 1] =
      tiePoint.y
      +
      radius
      * Math.cos(phi);


    positions[i3 + 2] =
      tiePoint.z
      +
      radius
      * Math.sin(phi)
      * Math.sin(theta);


    sizes[i] =
      1.6
      + Math.random()
      * 0.5;
  }


  const geometry =
    new THREE.BufferGeometry();


  geometry.setAttribute(
    'position',

    new THREE.BufferAttribute(
      positions,
      3
    )
  );


  geometry.setAttribute(
    'aSize',

    new THREE.BufferAttribute(
      sizes,
      1
    )
  );


  geometry.setAttribute(
    'aProgress',

    new THREE.BufferAttribute(
      new Float32Array(particleCount),
      1
    )
  );


  return new THREE.Points(
    geometry,
    createStemMaterial(
      tiePoint
    )
  );
}


/*
 * =========================================================
 * 创建完整花束
 * =========================================================
 */

export function createBouquet() {

  /*
   * 最外层花束容器。
   *
   * main.js 只需要旋转这个对象。
   */
  const bouquet =
    new THREE.Group();


  /*
   * contentGroup：
   *
   * 玫瑰、花茎、包装纸、扎口，
   * 后续蝴蝶结和装饰物都放在这里。
   */
  const contentGroup =
    new THREE.Group();


  bouquet.add(
    contentGroup
  );


  /*
   * 花头分组。
   */
  const flowerGroup =
    new THREE.Group();


  /*
   * 花茎分组。
   */
  const stemGroup =
    new THREE.Group();


  contentGroup.add(
    flowerGroup
  );


  contentGroup.add(
    stemGroup
  );


  /*
   * =====================================================
   * 7 朵玫瑰的紧凑手捧花布局
   *
   * 参考传统小型礼物花束：上方一朵、上层两朵、中层两朵、
   * 下层两朵。花头尺寸接近，不再使用一朵过大的中央主花。
   * =====================================================
   */

  const roseConfigs = [
    {
      x: 0.00,
      y: 0.82,
      z: -0.24,
      scale: 0.29,
      rotX: -0.74,
      rotY: -0.03,
      rotZ: 0.02
    },
    {
      x: -0.48,
      y: 0.52,
      z: -0.12,
      scale: 0.30,
      rotX: -0.61,
      rotY: -0.28,
      rotZ: 0.10
    },
    {
      x: 0.49,
      y: 0.51,
      z: -0.10,
      scale: 0.30,
      rotX: -0.59,
      rotY: 0.27,
      rotZ: -0.09
    },
    {
      x: -0.40,
      y: 0.13,
      z: 0.18,
      scale: 0.31,
      rotX: -0.22,
      rotY: -0.46,
      rotZ: 0.10
    },
    {
      x: 0.40,
      y: 0.13,
      z: 0.20,
      scale: 0.31,
      rotX: -0.20,
      rotY: 0.46,
      rotZ: -0.10
    },
    {
      /* 五朵上层花之间的中心花。 */
      x: 0.00,
      y: 0.47,
      z: 0.16,
      scale: 0.28,
      rotX: -0.24,
      rotY: -0.04,
      rotZ: 0.04
    },
    {
      /* 第二层两朵花下方的中心收束花。 */
      x: 0.00,
      y: -0.11,
      z: 0.34,
      scale: 0.27,
      rotX: -0.10,
      rotY: 0.05,
      rotZ: -0.05
    }
  ];


  /*
   * =====================================================
   * 创建所有玫瑰
   * =====================================================
   */

  const roseObjects = [];


  for (
    const config
    of roseConfigs
  ) {
    const rose =
      createRose();


    rose.position.set(
      config.x,
      config.y,
      config.z
    );


    rose.scale.setScalar(
      config.scale
    );


    rose.rotation.set(
      config.rotX,
      config.rotY,
      config.rotZ
    );


    flowerGroup.add(
      rose
    );


    roseObjects.push(
      rose
    );
  }


  /*
   * =====================================================
   * 扎口位置
   *
   * Stems
   * Wrapper
   * Ribbon
   *
   * 都以这个位置作为结构中心。
   * =====================================================
   */

  const tiePoint =
    new THREE.Vector3(
      0.02,
      -1.48,
      0.00
    );


  /*
   * =====================================================
   * 花茎
   * =====================================================
   */

  const stems =
    createStems(
      roseConfigs,
      tiePoint
    );


  stemGroup.add(
    stems
  );


  /*
   * 花柄接近花头的位置只保留左右两片叶子。
   */
  const stemLeaves =
    createStemLeaves(
      roseConfigs,
      tiePoint
    );


  stemGroup.add(
    stemLeaves
  );


  /*
   * 蝴蝶结下方可见的手持花柄。
   */
  const handleStems =
    createHandleStems(
      roseConfigs,
      tiePoint
    );


  stemGroup.add(
    handleStems
  );


  /*
   * =====================================================
   * 扎口粒子
   * =====================================================
   */

  const tieParticles =
    createTiePointParticles(
      tiePoint
    );


  stemGroup.add(
    tieParticles
  );


  /*
   * =====================================================
   * 包装纸
   *
   * 注意：
   *
   * 必须先 createWrapper()
   * 再 contentGroup.add()
   *
   * 不能在初始化 wrapperGroup 之前使用它。
   * =====================================================
   */

  const wrapperGroup =
    createWrapper(
      tiePoint
    );


  contentGroup.add(
    wrapperGroup
  );

  /*
 * =====================================================
 * Ribbon
 * =====================================================
 */

const ribbonGroup =
  createRibbon(
    tiePoint
  );


contentGroup.add(
  ribbonGroup
);


  /*
   * =====================================================
   * 整束花基础姿态
   * =====================================================
   */

  contentGroup.rotation.x =
    -0.02;


  /*
   * 整体略微向上移动，
   * 为后续 Ribbon 留出下方空间。
   */
  contentGroup.position.y =
    0.35;


  /*
   * =====================================================
   * 保存内部引用
   *
   * 后续 wrapper / ribbon / fillers / animation
   * 都可以直接使用这些对象。
   * =====================================================
   */

bouquet.userData.flowerGroup =
  flowerGroup;


bouquet.userData.stemGroup =
  stemGroup;


bouquet.userData.stemLeaves =
  stemLeaves;


bouquet.userData.wrapper =
  wrapperGroup;


bouquet.userData.ribbon =
  ribbonGroup;


bouquet.userData.tiePoint =
  tiePoint.clone();


bouquet.userData.roseConfigs =
  roseConfigs;


  /*
   * =====================================================
   * Phase 6：花束形成时间轴
   * =====================================================
   */
  const roseStartTimes = [
    1.55,
    1.78,
    1.78,
    2.08,
    2.08,
    1.30,
    2.38
  ];


  const timelineProgress =
    (
      time,
      start,
      end
    ) => THREE.MathUtils.smoothstep(
      time,
      start,
      end
    );


  bouquet.userData.animationDuration =
    6.80;


  bouquet.userData.updateAnimation =
    (elapsed) => {
      /* 花柄保持完整静态形态，不再参与形成动画。 */
      handleStems.material.uniforms.uGrowth.value =
        1.0;

      tieParticles.material.uniforms.uGrowth.value =
        1.0;

      stems.material.uniforms.uGrowth.value =
        1.0;

      for (
        let i = 0;
        i < roseObjects.length;
        i++
      ) {
        const flowerProgress =
          timelineProgress(
            elapsed,
            roseStartTimes[i],
            roseStartTimes[i] + 1.28
          );

        roseObjects[i].userData.setFormation(
          flowerProgress
        );
      }

      stemLeaves.userData.setFormation(
        timelineProgress(
          elapsed,
          3.25,
          4.10
        )
      );

      wrapperGroup.userData.setFormation(
        timelineProgress(
          elapsed,
          3.62,
          4.72
        )
      );

      ribbonGroup.userData.setFormation(
        timelineProgress(
          elapsed,
          4.00,
          6.80
        )
      );
    };


  /*
   * =====================================================
   * 返回完整花束
   * =====================================================
   */

  return bouquet;
}