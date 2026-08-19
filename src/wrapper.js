import * as THREE from 'three';


function lerp(a, b, t) {
  return a + (b - a) * t;
}


/*
 * 统一计算包装纸表面上的点。
 *
 * 整张纸是一件连续的椭圆锥形薄壳，而不是多块互相穿插的
 * 三角面。这样无论从正面、侧面还是背面观察，轮廓都连续。
 */
function getWrapperPoint(
  tiePoint,
  theta,
  v
) {
  const progress =
    Math.pow(v, 0.82);

  const rearAmount =
    (1.0 - Math.sin(theta)) * 0.5;

  /* 背面略高、正面略低，花头仍然保持可见。 */
  const sideLift =
    Math.pow(
      Math.abs(Math.cos(theta)),
      6.0
    ) * 0.48;

  const topY =
    -0.42
    + rearAmount * 0.98
    + sideLift
    + Math.sin(theta * 3.0 + 0.45) * 0.018;

  const y =
    lerp(
      tiePoint.y + 0.055,
      topY,
      Math.pow(v, 0.94)
    );

  /* 轻微纵向褶皱，只改变半径，不制造相交的纸片。 */
  const pleat =
    1.0
    + Math.sin(theta * 8.0 + 0.35) * 0.035 * progress;

  const radiusX =
    lerp(
      0.085,
      0.83 * pleat,
      progress
    );

  const radiusZ =
    lerp(
      0.065,
      0.43 * pleat,
      progress
    );

  /* 中段略微外鼓，让包装纸不是笔直的硬锥体。 */
  const bulge =
    Math.sin(Math.PI * v) * 0.045;

  return new THREE.Vector3(
    tiePoint.x
      + Math.cos(theta) * (radiusX + bulge),
    y,
    tiePoint.z
      + Math.sin(theta) * (radiusZ + bulge * 0.55)
  );
}


function createWrapperShell(
  tiePoint
) {
  const group =
    new THREE.Group();

  const sectors = 64;
  const positions = [];
  const colors = [];
  const sizes = [];
  const startPositions = [];
  const formationDelays = [];

  const bottomColor =
    new THREE.Color('#754259');

  const topColor =
    new THREE.Color('#F0C3CF');

  /*
   * 包装纸主体完全由随机表面采样的粒子构成，不再保留实体 Mesh。
   * v 偏向顶部，使展开区域的粒子密度与锥形面积相匹配。
   */
  const shellParticleCount = 7200;

  for (
    let i = 0;
    i < shellParticleCount;
    i++
  ) {
    const theta =
      Math.random() * Math.PI * 2.0;

    const v =
      Math.pow(
        Math.random(),
        0.62
      );

    const point =
      getWrapperPoint(
        tiePoint,
        theta,
        v
      );

    point.x +=
      (Math.random() - 0.5) * 0.006;

    point.y +=
      (Math.random() - 0.5) * 0.006;

    point.z +=
      (Math.random() - 0.5) * 0.006;

    positions.push(
      point.x,
      point.y,
      point.z
    );

    /* 包装纸由扎口处的小亮点向外展开。 */
    startPositions.push(
      tiePoint.x
        + (Math.random() - 0.5) * 0.055,
      tiePoint.y
        + 0.05
        + (Math.random() - 0.5) * 0.045,
      tiePoint.z
        + (Math.random() - 0.5) * 0.055
    );

    formationDelays.push(
      v * 0.34
        + Math.random() * 0.06
    );

    const colorMix =
      THREE.MathUtils.clamp(
        0.18
          + v * 0.72
          + Math.max(0, Math.sin(theta)) * 0.08
          + Math.random() * 0.05,
        0,
        1
      );

    colors.push(
      lerp(bottomColor.r, topColor.r, colorMix),
      lerp(bottomColor.g, topColor.g, colorMix),
      lerp(bottomColor.b, topColor.b, colorMix)
    );

    sizes.push(
      1.15
      + Math.random() * 0.80
      + v * 0.16
    );
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

  const material =
    new THREE.ShaderMaterial({
      uniforms: {
        uFormation: {
          value: 0
        }
      },

      vertexColors: true,
      transparent: true,
      depthTest: true,
      depthWrite: true,
      blending: THREE.NormalBlending,

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
              aDelay + 0.56,
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

          vec4 modelPosition =
            modelMatrix * vec4(formedPosition, 1.0);

          vec4 viewPosition =
            viewMatrix * modelPosition;

          gl_Position =
            projectionMatrix * viewPosition;

          gl_PointSize =
            aSize
            * 18.0
            / max(1.0, -viewPosition.z);
        }
      `,

      fragmentShader: `
        precision highp float;
        varying vec3 vColor;
        varying float vReveal;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float distanceToCenter = length(uv);

          if (distanceToCenter > 0.5) {
            discard;
          }

          float alpha =
            exp(-distanceToCenter * distanceToCenter * 15.0);

          if (alpha < 0.07) {
            discard;
          }

          float core =
            exp(-distanceToCenter * distanceToCenter * 60.0);

          gl_FragColor =
            vec4(
              vColor + vec3(core * 0.08),
              alpha * 0.82
            );
        }
      `
    });

  const shell =
    new THREE.Points(
      geometry,
      material
    );

  shell.renderOrder = 1;

  group.add(shell);


  /*
   * 顶部只保留一条连续的椭圆波浪边，不再出现多张纸的尖角。
   */
  const rimPositions = [];

  for (
    let sector = 0;
    sector < sectors * 3;
    sector++
  ) {
    const theta =
      sector / (sectors * 3)
      * Math.PI * 2.0;

    const point =
      getWrapperPoint(
        tiePoint,
        theta,
        1.0
      );

    point.x +=
      (Math.random() - 0.5) * 0.004;

    point.y +=
      (Math.random() - 0.5) * 0.004;

    point.z +=
      (Math.random() - 0.5) * 0.004;

    rimPositions.push(
      point.x,
      point.y,
      point.z
    );
  }

  const rimGeometry =
    new THREE.BufferGeometry();

  rimGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      rimPositions,
      3
    )
  );

  const rim =
    new THREE.Points(
      rimGeometry,
      new THREE.PointsMaterial({
        color: '#F5D1DC',
        size: 0.012,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.72,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );

  rim.renderOrder = 3;
  group.add(rim);


  /*
   * 少量连续褶线用于表现纸张张力，数量保持克制。
   */
  const foldPositions = [];
  const foldCount = 6;

  for (
    let fold = 0;
    fold < foldCount;
    fold++
  ) {
    const theta =
      fold / foldCount
      * Math.PI * 2.0
      + 0.18;

    for (
      let sample = 2;
      sample <= 46;
      sample++
    ) {
      const v = sample / 46;
      const point =
        getWrapperPoint(
          tiePoint,
          theta,
          v
        );

      foldPositions.push(
        point.x,
        point.y,
        point.z
      );
    }
  }

  const foldGeometry =
    new THREE.BufferGeometry();

  foldGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      foldPositions,
      3
    )
  );

  group.add(
    new THREE.Points(
      foldGeometry,
      new THREE.PointsMaterial({
        color: '#D993A8',
        size: 0.007,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.22,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
  );


  /* 稀疏纸面微粒，避免出现规则网格感。 */
  const dustPositions = [];
  const dustCount = 240;

  for (
    let i = 0;
    i < dustCount;
    i++
  ) {
    const theta =
      Math.random() * Math.PI * 2.0;

    const v =
      0.12
      + Math.random() * 0.86;

    const point =
      getWrapperPoint(
        tiePoint,
        theta,
        v
      );

    dustPositions.push(
      point.x,
      point.y,
      point.z
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

  group.add(
    new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: '#DFA5B5',
        size: 0.009,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.24,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
  );

  /*
   * 顶部边缘、折痕和纸面微粒使用普通 PointsMaterial，无法在
   * shader 中读取包装纸形成进度。因此保存它们的目标坐标，
   * 在动画期间从扎口附近逐点插值到最终位置。
   */
  const animatedDetailPoints = [];

  group.traverse(
    (child) => {
      if (
        child !== shell
        && child.isPoints
        && child.geometry?.attributes?.position
      ) {
        const positionAttribute =
          child.geometry.attributes.position;

        const targetPositions =
          new Float32Array(
            positionAttribute.array
          );

        const startPositions =
          new Float32Array(
            targetPositions.length
          );

        const formationDelays =
          new Float32Array(
            positionAttribute.count
          );

        for (
          let i = 0;
          i < positionAttribute.count;
          i++
        ) {
          const angle =
            i * 2.3999632297;

          const radius =
            0.012
            + (i % 7) * 0.004;

          startPositions[i * 3] =
            tiePoint.x
            + Math.cos(angle) * radius;

          startPositions[i * 3 + 1] =
            tiePoint.y
            + (i % 9) * 0.003;

          startPositions[i * 3 + 2] =
            tiePoint.z
            + Math.sin(angle) * radius;

          const radialProgress =
            THREE.MathUtils.clamp(
              Math.sqrt(
                Math.pow(
                  (
                    targetPositions[i * 3]
                    - tiePoint.x
                  )
                  / 0.83,
                  2
                )
                + Math.pow(
                  (
                    targetPositions[i * 3 + 2]
                    - tiePoint.z
                  )
                  / 0.43,
                  2
                )
              ),
              0,
              1
            );

          const surfaceV =
            Math.pow(
              radialProgress,
              1.0 / 0.82
            );

          /* 与包装纸主体 shader 中的 aDelay 公式保持一致。 */
          formationDelays[i] =
            surfaceV * 0.34
            + (
              (
                i * 17
              )
              % 23
            )
              / 23
              * 0.06;
        }

        animatedDetailPoints.push({
          attribute: positionAttribute,
          targetPositions,
          startPositions,
          formationDelays
        });
      }
    }
  );

  group.userData.setFormation =
    (progress) => {
      const clamped =
        THREE.MathUtils.clamp(
          progress,
          0,
          1
        );

      group.visible =
        true;

      material.uniforms.uFormation.value =
        clamped;

      for (
        const detail of animatedDetailPoints
      ) {
        const positions =
          detail.attribute.array;

        for (
          let i = 0;
          i < detail.attribute.count;
          i++
        ) {
          const offset =
            i * 3;

          const delay =
            detail.formationDelays[i];

          const pointProgress =
            THREE.MathUtils.smoothstep(
              clamped,
              delay,
              delay + 0.56
            );

          const eased =
            1.0
            - Math.pow(
              1.0 - pointProgress,
              3.0
            );

          positions[offset] =
            THREE.MathUtils.lerp(
              detail.startPositions[offset],
              detail.targetPositions[offset],
              eased
            );

          positions[offset + 1] =
            THREE.MathUtils.lerp(
              detail.startPositions[offset + 1],
              detail.targetPositions[offset + 1],
              eased
            );

          positions[offset + 2] =
            THREE.MathUtils.lerp(
              detail.startPositions[offset + 2],
              detail.targetPositions[offset + 2],
              eased
            );
        }

        detail.attribute.needsUpdate =
          true;
      }

      /* 所有细节粒子始终保持原始颜色、尺寸和透明度。 */
    };

  return group;
}


/*
 * 创建完整包装纸。
 *
 * 只有一张连续薄壳，因此不会再从侧面或背面看到互相穿插的
 * 尖锐三角面；前低后高的顶部轮廓也更接近真实手捧花包装。
 */
export function createWrapper(
  tiePoint
) {
  return createWrapperShell(
    tiePoint
  );
}
