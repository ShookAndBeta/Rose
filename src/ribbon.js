import * as THREE from 'three';


/*
 * =========================================================
 * Ribbon Strip
 *
 * 根据 3D 曲线生成真正有宽度的丝带。
 * =========================================================
 */

function createRibbonStrip({
  points,

  widthStart = 0.14,
  widthEnd = 0.10,

  color = '#851D3A',
  opacity = 0.09,

  edgeColor = '#FF5276',

  edgeSize = 0.015,

  dustCount = 70,

  segments = 70,

  /*
   * 丝带自身扭转程度。
   *
   * loop 小一点，
   * tail 可以大一点。
   */
  twistAmount = 0.014
}) {

  const group =
    new THREE.Group();


  const curve =
    new THREE.CatmullRomCurve3(
      points,
      false,
      'centripetal'
    );


  const frames =
    curve.computeFrenetFrames(
      segments,
      false
    );


  const positions = [];
  const indices = [];

  const leftEdge = [];
  const rightEdge = [];

  const centers = [];


  /*
   * =====================================================
   * Ribbon Geometry
   * =====================================================
   */

  for (
    let i = 0;
    i <= segments;
    i++
  ) {

    const t =
      i / segments;


    const center =
      curve.getPointAt(t);


    centers.push(
      center.clone()
    );


    /*
     * 丝带宽度并非严格线性，
     * 加一点轻微起伏，
     * 避免过于机械。
     */
    const width =
      THREE.MathUtils.lerp(
        widthStart,
        widthEnd,
        t
      )
      *
      (
        1.0
        +
        Math.sin(
          t
          * Math.PI
          * 2.4
        )
        * 0.045
      );


    const side =
      frames.normals[i]
        .clone()
        .normalize();


    const left =
      center.clone()
        .addScaledVector(
          side,
          width * 0.5
        );


    const right =
      center.clone()
        .addScaledVector(
          side,
          -width * 0.5
        );


    /*
     * 轻微扭转。
     *
     * 解决侧面看起来像一根线的问题。
     */
    const twist =
      Math.sin(
        t
        * Math.PI
        * 2.0
      )
      * twistAmount;


    left.z +=
      twist;


    right.z -=
      twist;


    const baseIndex =
      positions.length / 3;


    positions.push(
      left.x,
      left.y,
      left.z,

      right.x,
      right.y,
      right.z
    );


    leftEdge.push(
      left.clone()
    );


    rightEdge.push(
      right.clone()
    );


    if (
      i < segments
    ) {

      const a =
        baseIndex;

      const b =
        baseIndex + 1;

      const c =
        baseIndex + 2;

      const d =
        baseIndex + 3;


      indices.push(
        a,
        c,
        b
      );


      indices.push(
        b,
        c,
        d
      );
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


  geometry.setIndex(
    indices
  );


  geometry.computeVertexNormals();


  /*
   * =====================================================
   * 半透明丝带主体
   * =====================================================
   */

  const material =
    new THREE.MeshBasicMaterial({
      color,

      transparent:
        true,

      /* 丝带主体需要可见，而不应只剩两圈粒子边线。 */
      opacity:
        Math.min(
          opacity * 1.65,
          0.34
        ),

      side:
        THREE.DoubleSide,

      depthTest:
        true,

      depthWrite:
        false,

      blending:
        THREE.NormalBlending
    });


  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );


  mesh.renderOrder =
    4;


  group.add(
    mesh
  );


  /*
   * =====================================================
   * 边缘粒子
   * =====================================================
   */

  const edgePositions = [];


  for (
    let i = 0;
    i <= segments;
    i++
  ) {

    const left =
      leftEdge[i];


    const right =
      rightEdge[i];


    edgePositions.push(
      left.x,
      left.y,
      left.z
    );


    edgePositions.push(
      right.x,
      right.y,
      right.z
    );
  }


  const edgeGeometry =
    new THREE.BufferGeometry();


  edgeGeometry.setAttribute(
    'position',

    new THREE.Float32BufferAttribute(
      edgePositions,
      3
    )
  );


  const edgeMaterial =
    new THREE.PointsMaterial({
      color:
        edgeColor,

      size:
        edgeSize * 0.82,

      sizeAttenuation:
        true,

      transparent:
        true,

      /*
       * 不再像之前那么亮。
       */
      opacity:
        0.44,

      depthTest:
        true,

      depthWrite:
        false,

      blending:
        THREE.AdditiveBlending
    });


  const edgePoints =
    new THREE.Points(
      edgeGeometry,
      edgeMaterial
    );


  edgePoints.renderOrder =
    6;


  group.add(
    edgePoints
  );


  /*
   * =====================================================
   * Ribbon Dust
   * =====================================================
   */

  const dustPositions = [];


  for (
    let i = 0;
    i < dustCount;
    i++
  ) {

    const t =
      Math.random();


    const index =
      Math.min(
        segments,
        Math.floor(
          t * segments
        )
      );


    const center =
      centers[index];


    const side =
      frames.normals[index]
        .clone()
        .normalize();


    const width =
      THREE.MathUtils.lerp(
        widthStart,
        widthEnd,
        t
      );


    const offset =
      (
        Math.random()
        - 0.5
      )
      * width
      * 0.72;


    const p =
      center.clone()
        .addScaledVector(
          side,
          offset
        );


    p.z +=
      (
        Math.random()
        - 0.5
      )
      * 0.012;


    dustPositions.push(
      p.x,
      p.y,
      p.z
    );
  }


  const dustGeometry =
    new THREE.BufferGeometry();


  dustGeometry.setAttribute(
    'position',

    new THREE.Float32BufferAttribute(
      dustPositions,
      3
    )
  );


  const dustMaterial =
    new THREE.PointsMaterial({
      color:
        '#EF3659',

      size:
        0.010,

      sizeAttenuation:
        true,

      transparent:
        true,

      opacity:
        0.25,

      depthTest:
        true,

      depthWrite:
        false,

      blending:
        THREE.AdditiveBlending
    });


  group.add(
    new THREE.Points(
      dustGeometry,
      dustMaterial
    )
  );


  return group;
}


/*
 * =========================================================
 * 花柄缠带
 *
 * 蝴蝶结下方增加一小段包扎层，把结点和裸露花茎连接起来，
 * 避免装饰结像悬浮在空中。
 * =========================================================
 */

function createBindingWrap() {
  const group =
    new THREE.Group();

  const geometry =
    new THREE.CylinderGeometry(
      0.085,
      0.105,
      0.34,
      18,
      1,
      true
    );

  const material =
    new THREE.MeshBasicMaterial({
      color: '#64152C',
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false
    });

  const sleeve =
    new THREE.Mesh(
      geometry,
      material
    );

  sleeve.position.y =
    -0.17;

  group.add(
    sleeve
  );

  /* 沿包扎层盘绕的细粒子边线。 */
  const positions = [];
  const turns = 4.6;
  const count = 150;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const t = i / (count - 1);
    const angle = t * Math.PI * 2 * turns;
    const radius = 0.109 - t * 0.018;

    positions.push(
      Math.cos(angle) * radius,
      -0.01 - t * 0.32,
      Math.sin(angle) * radius
    );
  }

  const lineGeometry =
    new THREE.BufferGeometry();

  lineGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  group.add(
    new THREE.Points(
      lineGeometry,
      new THREE.PointsMaterial({
        color: '#D83D5E',
        size: 0.009,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
  );

  return group;
}


/*
 * =========================================================
 * Knot
 *
 * 中央扎结。
 * =========================================================
 */

function createKnot() {

  const group =
    new THREE.Group();


  /*
   * 原来太多，会变成白色灯泡。
   */
  const particleCount =
    170;


  const positions =
    new Float32Array(
      particleCount * 3
    );


  for (
    let i = 0;
    i < particleCount;
    i++
  ) {

    const i3 =
      i * 3;


    const radius =
      Math.pow(
        Math.random(),
        0.60
      );


    const theta =
      Math.random()
      * Math.PI
      * 2.0;


    const phi =
      Math.acos(
        2.0
        * Math.random()
        - 1.0
      );


    /*
     * 中心结进一步压扁。
     */
    positions[i3] =
      Math.sin(phi)
      * Math.cos(theta)
      * radius
      * 0.105;


    positions[i3 + 1] =
      Math.cos(phi)
      * radius
      * 0.070;


    positions[i3 + 2] =
      Math.sin(phi)
      * Math.sin(theta)
      * radius
      * 0.060;
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


  const material =
    new THREE.PointsMaterial({
      color:
        '#F14A69',

      size:
        0.016,

      sizeAttenuation:
        true,

      transparent:
        true,

      opacity:
        0.70,

      depthTest:
        true,

      depthWrite:
        false,

      blending:
        THREE.AdditiveBlending
    });


  const points =
    new THREE.Points(
      geometry,
      material
    );


  points.renderOrder =
    8;


  group.add(
    points
  );


  /*
   * =====================================================
   * Knot Core
   *
   * 原来：
   * 40 个高亮粒子
   *
   * 现在：
   * 只留下很少的亮点。
   * =====================================================
   */

  const coreCount =
    8;


  const corePositions =
    new Float32Array(
      coreCount * 3
    );


  for (
    let i = 0;
    i < coreCount;
    i++
  ) {

    const i3 =
      i * 3;


    corePositions[i3] =
      (
        Math.random()
        - 0.5
      )
      * 0.045;


    corePositions[i3 + 1] =
      (
        Math.random()
        - 0.5
      )
      * 0.032;


    corePositions[i3 + 2] =
      (
        Math.random()
        - 0.5
      )
      * 0.032;
  }


  const coreGeometry =
    new THREE.BufferGeometry();


  coreGeometry.setAttribute(
    'position',

    new THREE.BufferAttribute(
      corePositions,
      3
    )
  );


  const coreMaterial =
    new THREE.PointsMaterial({
      color:
        '#FF9CAE',

      size:
        0.018,

      sizeAttenuation:
        true,

      transparent:
        true,

      opacity:
        0.36,

      depthWrite:
        false,

      blending:
        THREE.AdditiveBlending
    });


  group.add(
    new THREE.Points(
      coreGeometry,
      coreMaterial
    )
  );


  return group;
}


/*
 * =========================================================
 * Complete Ribbon
 * =========================================================
 */

export function createRibbon(
  tiePoint
) {

  const ribbon =
    new THREE.Group();


  /*
   * 整个蝴蝶结建立在 tiePoint 上。
   */
  ribbon.position.copy(
    tiePoint
  );


  /*
   * 飞入阶段使用真正的一整条长丝带，而不是把成品蝴蝶结整体
   * 搬进画面。抵达扎口后，这条丝带收紧，左右环和尾带展开。
   */
  const flyingStrip =
    createRibbonStrip({
      points: [
        new THREE.Vector3(-1.95, -0.02, 0.02),
        new THREE.Vector3(-1.48, 0.13, 0.08),
        new THREE.Vector3(-0.98, -0.10, 0.14),
        new THREE.Vector3(-0.48, 0.11, 0.07),
        new THREE.Vector3(0.02, -0.07, 0.13),
        new THREE.Vector3(0.52, 0.10, 0.06),
        new THREE.Vector3(1.02, -0.11, 0.12),
        new THREE.Vector3(1.50, 0.09, 0.07),
        new THREE.Vector3(1.95, -0.01, 0.03)
      ],
      widthStart: 0.13,
      widthEnd: 0.13,
      color: '#861D3A',
      opacity: 0.16,
      edgeColor: '#F95473',
      edgeSize: 0.015,
      dustCount: 150,
      twistAmount: 0.055
    });

  ribbon.add(
    flyingStrip
  );

  /* 保存长丝带粒子的原始位置，用于飞行中的连续波浪形变。 */
  const flyingStripPointSets = [];

  flyingStrip.traverse(
    (child) => {
      if (
        child.isPoints
        && child.geometry?.attributes?.position
      ) {
        const attribute =
          child.geometry.attributes.position;

        flyingStripPointSets.push({
          attribute,
          basePositions: new Float32Array(
            attribute.array
          )
        });
      }
    }
  );


  /*
   * =====================================================
   * 左环
   *
   * 相比上一版：
   *
   * 更宽
   * 更扁
   * 更像柔软丝带
   * =====================================================
   */

  const leftLoop =
    createRibbonStrip({
      points: [

        new THREE.Vector3(
          -0.02,
          0.01,
          0.08
        ),

        new THREE.Vector3(
          -0.20,
          0.10,
          0.12
        ),

        new THREE.Vector3(
          -0.46,
          0.13,
          0.16
        ),

        new THREE.Vector3(
          -0.67,
          0.06,
          0.11
        ),

        new THREE.Vector3(
          -0.70,
          -0.035,
          0.07
        ),

        new THREE.Vector3(
          -0.53,
          -0.10,
          0.09
        ),

        new THREE.Vector3(
          -0.27,
          -0.085,
          0.14
        ),

        new THREE.Vector3(
          -0.07,
          -0.025,
          0.09
        ),

        new THREE.Vector3(
          0.00,
          0.00,
          0.07
        )
      ],

      /*
       * 明显加宽。
       */
      widthStart:
        0.16,

      widthEnd:
        0.14,

      color:
        '#861D3A',

      opacity:
        0.16,

      edgeColor:
        '#F95473',

      edgeSize:
        0.015,

      dustCount:
        80,

      twistAmount:
        0.018
    });


  /*
   * 环部略微上扬并增加纵向饱满度，避免像一副扁平眼镜。
   */
  leftLoop.rotation.z =
    0.08;

  leftLoop.scale.set(
    0.92,
    1.28,
    1.0
  );

  ribbon.add(
    leftLoop
  );


  /*
   * =====================================================
   * 右环
   *
   * 不做完全镜像，
   * 保留一点自然不对称。
   * =====================================================
   */

  const rightLoop =
    createRibbonStrip({
      points: [

        new THREE.Vector3(
          0.02,
          0.01,
          0.08
        ),

        new THREE.Vector3(
          0.22,
          0.11,
          0.13
        ),

        new THREE.Vector3(
          0.48,
          0.12,
          0.17
        ),

        new THREE.Vector3(
          0.68,
          0.045,
          0.10
        ),

        new THREE.Vector3(
          0.66,
          -0.045,
          0.07
        ),

        new THREE.Vector3(
          0.49,
          -0.105,
          0.10
        ),

        new THREE.Vector3(
          0.25,
          -0.08,
          0.14
        ),

        new THREE.Vector3(
          0.07,
          -0.025,
          0.09
        ),

        new THREE.Vector3(
          0.00,
          0.00,
          0.07
        )
      ],

      widthStart:
        0.16,

      widthEnd:
        0.14,

      color:
        '#861D3A',

      opacity:
        0.16,

      edgeColor:
        '#F95473',

      edgeSize:
        0.015,

      dustCount:
        80,

      twistAmount:
        0.018
    });


  rightLoop.rotation.z =
    -0.06;

  rightLoop.scale.set(
    0.94,
    1.22,
    1.0
  );

  ribbon.add(
    rightLoop
  );


  /*
   * =====================================================
   * 左尾带
   *
   * 比旧版更宽、更短。
   * =====================================================
   */

  const leftTail =
    createRibbonStrip({
      points: [

        new THREE.Vector3(
          -0.045,
          -0.02,
          0.07
        ),

        new THREE.Vector3(
          -0.14,
          -0.20,
          0.11
        ),

        new THREE.Vector3(
          -0.20,
          -0.40,
          0.13
        ),

        new THREE.Vector3(
          -0.32,
          -0.60,
          0.08
        ),

        new THREE.Vector3(
          -0.30,
          -0.82,
          0.03
        )
      ],

      widthStart:
        0.145,

      widthEnd:
        0.060,

      color:
        '#74172F',

      opacity:
        0.13,

      edgeColor:
        '#E94A68',

      edgeSize:
        0.013,

      dustCount:
        55,

      segments:
        58,

      /*
       * 尾带需要更多扭转。
       */
      twistAmount:
        0.030
    });


  ribbon.add(
    leftTail
  );


  /*
   * =====================================================
   * 右尾带
   *
   * 比左边稍短，
   * 避免完全对称。
   * =====================================================
   */

  const rightTail =
    createRibbonStrip({
      points: [

        new THREE.Vector3(
          0.045,
          -0.02,
          0.07
        ),

        new THREE.Vector3(
          0.14,
          -0.18,
          0.12
        ),

        new THREE.Vector3(
          0.27,
          -0.36,
          0.11
        ),

        new THREE.Vector3(
          0.24,
          -0.55,
          0.07
        ),

        new THREE.Vector3(
          0.36,
          -0.74,
          0.025
        )
      ],

      widthStart:
        0.145,

      widthEnd:
        0.060,

      color:
        '#74172F',

      opacity:
        0.13,

      edgeColor:
        '#E94A68',

      edgeSize:
        0.013,

      dustCount:
        55,

      segments:
        58,

      twistAmount:
        0.030
    });


  ribbon.add(
    rightTail
  );


  /*
   * =====================================================
   * Binding Wrap + Center Knot
   * =====================================================
   */

  const bindingWrap =
    createBindingWrap();


  ribbon.add(
    bindingWrap
  );


  const knot =
    createKnot();


  knot.position.z =
    0.12;


  ribbon.add(
    knot
  );


  /*
   * =====================================================
   * Ribbon Overall Transform
   * =====================================================
   */


  /*
   * 稍微朝向观察者。
   */
  ribbon.rotation.x =
    -0.10;


  /*
   * 原来略小。
   *
   * 整体放大约 10%。
   */
  ribbon.scale.setScalar(
    1.02
  );


  /*
   * 往上贴住包装纸扎口。
   */
  ribbon.position.y +=
    0.065;


  ribbon.traverse(
    (child) => {
      if (child.material) {
        child.userData.baseOpacity =
          child.material.opacity;
      }
    }
  );


  const finalPosition =
    ribbon.position.clone();

  const finalRotation =
    ribbon.rotation.clone();

  const leftLoopScale =
    leftLoop.scale.clone();

  const rightLoopScale =
    rightLoop.scale.clone();

  const leftTailScale =
    leftTail.scale.clone();

  const rightTailScale =
    rightTail.scale.clone();

  const bindingScale =
    bindingWrap.scale.clone();

  const knotScale =
    knot.scale.clone();

  /* 从画面左上方沿弧线飞向扎口。 */
  const flightCurve =
    new THREE.CubicBezierCurve3(
      finalPosition.clone().add(
        new THREE.Vector3(
          -7.2,
          2.0,
          1.4
        )
      ),
      finalPosition.clone().add(
        new THREE.Vector3(
          -4.6,
          3.0,
          2.2
        )
      ),
      finalPosition.clone().add(
        new THREE.Vector3(
          1.4,
          1.15,
          0.8
        )
      ),
      finalPosition
    );


  ribbon.userData.setFormation =
    (progress) => {
      const clamped =
        THREE.MathUtils.clamp(
          progress,
          0,
          1
        );

      const flight =
        THREE.MathUtils.smoothstep(
          clamped,
          0.0,
          0.72
        );

      const tying =
        THREE.MathUtils.smoothstep(
          clamped,
          0.68,
          1.0
        );

      /* smoothstep 本身已有缓入缓出，不再叠加过快的三次 ease-out。 */
      const flightEase =
        flight;

      const tyingEase =
        1.0
        - Math.pow(
          1.0 - tying,
          3.0
        );

      ribbon.visible =
        true;

      ribbon.position.copy(
        flightCurve.getPoint(
          flightEase
        )
      );

      /* 飞行中沿轨迹上下摆动，而不是刚性地平移成品模型。 */
      const flightWaveEnvelope =
        Math.sin(
          flight * Math.PI
        )
        * (1.0 - tying);

      ribbon.position.y +=
        Math.sin(
          flight * Math.PI * 5.0
        )
        * 0.22
        * flightWaveEnvelope;

      ribbon.position.z +=
        Math.cos(
          flight * Math.PI * 4.0
        )
        * 0.16
        * flightWaveEnvelope;

      /* 到达扎口后有一小段柔软的摆动和回弹。 */
      if (flight >= 1.0) {
        const settle =
          1.0 - tying;

        ribbon.position.x +=
          Math.sin(
            tying * Math.PI * 3.0
          )
          * 0.10
          * settle;

        ribbon.position.y +=
          Math.sin(
            tying * Math.PI * 2.0
          )
          * 0.07
          * settle;
      }

      ribbon.rotation.set(
        finalRotation.x
          - (1.0 - flightEase) * 0.48,
        finalRotation.y
          + (1.0 - flightEase) * 1.15,
        finalRotation.z
          - (1.0 - flightEase) * 2.35
          + Math.sin(
            flight * Math.PI * 2.0
          )
            * 0.20
            * (1.0 - flight)
      );

      ribbon.scale.setScalar(
        1.02
        * (
          0.92
          + 0.08 * tyingEase
        )
      );

      /*
       * 飞行阶段只显示完整长丝带。到达扎口后长丝带向中心收紧，
       * 同时真正的左右环和尾带从结点处被“系”出来。
       */
      const stripTighten =
        1.0
        - 0.985 * tyingEase;

      flyingStrip.visible =
        clamped < 0.999;

      /*
       * 长丝带自身持续产生传播波：前端先抬起，波形沿丝带向后
       * 传递；靠近扎口时振幅逐渐收敛，为系结动作做准备。
       */
      const strandWaveAmount =
        0.13
        * (1.0 - tyingEase);

      for (
        const pointSet of flyingStripPointSets
      ) {
        const positions =
          pointSet.attribute.array;

        for (
          let i = 0;
          i < pointSet.attribute.count;
          i++
        ) {
          const offset =
            i * 3;

          const baseX =
            pointSet.basePositions[offset];

          const phase =
            baseX * 4.2
            - clamped * 24.0;

          positions[offset] =
            baseX;

          positions[offset + 1] =
            pointSet.basePositions[offset + 1]
            + Math.sin(phase)
              * strandWaveAmount;

          positions[offset + 2] =
            pointSet.basePositions[offset + 2]
            + Math.cos(phase * 0.82)
              * strandWaveAmount
              * 0.72;
        }

        pointSet.attribute.needsUpdate =
          true;
      }

      flyingStrip.scale.set(
        stripTighten,
        1.0 - 0.72 * tyingEase,
        1.0
      );

      flyingStrip.rotation.z =
        Math.sin(
          tying * Math.PI * 2.0
        )
        * 0.22
        * (1.0 - tying);

      const loopOpen =
        0.015
        + 0.985 * tyingEase
        + Math.sin(
          tying * Math.PI
        )
          * 0.10;

      leftLoop.scale.set(
        leftLoopScale.x * loopOpen,
        leftLoopScale.y * loopOpen,
        leftLoopScale.z
      );

      rightLoop.scale.set(
        rightLoopScale.x * loopOpen,
        rightLoopScale.y * loopOpen,
        rightLoopScale.z
      );

      const tailOpen =
        0.015
        + 0.985 * tyingEase;

      leftTail.scale.set(
        leftTailScale.x * tailOpen,
        leftTailScale.y * tailOpen,
        leftTailScale.z
      );

      rightTail.scale.set(
        rightTailScale.x * tailOpen,
        rightTailScale.y * tailOpen,
        rightTailScale.z
      );

      const knotTighten =
        0.015
        + 0.985 * tyingEase;

      bindingWrap.scale.copy(
        bindingScale
      ).multiplyScalar(
        knotTighten
      );

      knot.scale.copy(
        knotScale
      ).multiplyScalar(
        knotTighten
      );

      /* 所有丝带材质始终保持原始颜色和透明度。 */
    };


  return ribbon;
}