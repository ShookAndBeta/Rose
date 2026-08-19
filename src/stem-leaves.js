import * as THREE from 'three';


function createLeaf({
  base,
  control1,
  control2,
  tip,
  width,
  roll,
  phase,
  count
}) {
  const curve =
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(...base),
      new THREE.Vector3(...control1),
      new THREE.Vector3(...control2),
      new THREE.Vector3(...tip)
    );

  const positions = [];
  const colors = [];
  const sizes = [];

  const dark =
    new THREE.Color('#367A49');

  const light =
    new THREE.Color('#A8E8B0');

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const t =
      Math.pow(
        Math.random(),
        0.88
      );

    const center =
      curve.getPoint(t);

    const tangent =
      curve.getTangent(t)
        .normalize();

    let flatSide =
      new THREE.Vector3(
        -tangent.y,
        tangent.x,
        0
      );

    if (
      flatSide.lengthSq() < 0.0001
    ) {
      flatSide.set(1, 0, 0);
    }

    flatSide.normalize();

    const depthSide =
      new THREE.Vector3()
        .crossVectors(
          tangent,
          flatSide
        )
        .normalize();

    const currentRoll =
      roll
      + Math.sin(Math.PI * t) * 0.20;

    const side =
      flatSide
        .multiplyScalar(Math.cos(currentRoll))
        .addScaledVector(
          depthSide,
          Math.sin(currentRoll)
        )
        .normalize();

    const normal =
      new THREE.Vector3()
        .crossVectors(
          tangent,
          side
        )
        .normalize();

    const veinParticle =
      i < count * 0.18;

    const u =
      veinParticle
        ? (Math.random() - 0.5) * 0.08
        : Math.random() * 2 - 1;

    const widthProfile =
      Math.pow(
        Math.sin(Math.PI * t),
        0.72
      )
      * (1 - 0.12 * t);

    const point =
      center.clone()
        .addScaledVector(
          side,
          u * width * widthProfile
        )
        .addScaledVector(
          normal,
          (1 - u * u)
            * Math.sin(Math.PI * t)
            * 0.018
        );

    point.addScaledVector(
      normal,
      Math.sin(
        t * Math.PI * 3.2
        + phase
        + u
      )
      * Math.abs(u)
      * 0.004
    );

    positions.push(
      point.x
        + (Math.random() - 0.5) * 0.0025,
      point.y
        + (Math.random() - 0.5) * 0.0025,
      point.z
        + (Math.random() - 0.5) * 0.0025
    );

    const mix =
      THREE.MathUtils.clamp(
        0.20
          + t * 0.28
          + Math.abs(u) * 0.16
          + (veinParticle ? 0.18 : 0)
          + Math.random() * 0.06,
        0,
        1
      );

    colors.push(
      THREE.MathUtils.lerp(dark.r, light.r, mix),
      THREE.MathUtils.lerp(dark.g, light.g, mix),
      THREE.MathUtils.lerp(dark.b, light.b, mix)
    );

    sizes.push(
      veinParticle
        ? 1.68 + Math.random() * 0.25
        : 1.30 + Math.random() * 0.34
    );
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

  geometry.setAttribute(
    'aSize',
    new THREE.Float32BufferAttribute(sizes, 1)
  );

  const material =
    new THREE.ShaderMaterial({
      uniforms: {
        uFormation: {
          value: 0
        },
        uBase: {
          value: new THREE.Vector3(...base)
        }
      },

      vertexColors: true,
      transparent: true,
      depthTest: true,
      depthWrite: true,
      blending: THREE.NormalBlending,

      vertexShader: `
        attribute float aSize;

        uniform float uFormation;
        uniform vec3 uBase;

        varying vec3 vColor;
        varying float vReveal;

        void main() {
          vColor = color;

          float easedProgress =
            1.0
            - pow(1.0 - uFormation, 3.0);

          vReveal = uFormation;

          vec3 formedPosition =
            mix(
              uBase,
              position,
              easedProgress
            );

          vec4 viewPosition =
            viewMatrix
            * modelMatrix
            * vec4(formedPosition, 1.0);

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

          gl_FragColor =
            vec4(
              vColor,
              alpha * 0.96
            );
        }
      `
    });

  return new THREE.Points(
    geometry,
    material
  );
}


export function createStemLeaves(
  roseConfigs,
  tiePoint
) {
  const leaves =
    new THREE.Group();

  for (
    let roseIndex = 0;
    roseIndex < roseConfigs.length;
    roseIndex++
  ) {
    const config =
      roseConfigs[roseIndex];

    /*
     * 使用与花茎完全相同的贝塞尔曲线计算附着点，确保叶根真的
     * 落在对应花柄上，而不是依靠目测摆放在附近。
     */
    const stemStart =
      new THREE.Vector3(
        config.x,
        config.y - 0.18,
        config.z - 0.10
      );

    const stemControl =
      new THREE.Vector3(
        config.x * 0.42,
        (config.y + tiePoint.y) * 0.48,
        config.z * 0.35
      );

    const stemCurve =
      new THREE.QuadraticBezierCurve3(
        stemStart,
        stemControl,
        tiePoint
      );

    const attachmentProgress =
      0.075
      + (roseIndex % 3) * 0.012;

    const attachment =
      stemCurve.getPoint(
        attachmentProgress
      );

    for (
      const side of [-1, 1]
    ) {
      const length =
        (
          0.145
          + (roseIndex % 2) * 0.018
          + (side > 0 ? 0.008 : 0)
        )
        * 1.65;

      const rise =
        0.070
        + ((roseIndex + (side > 0 ? 1 : 0)) % 3) * 0.012;

      const depthDirection =
        (roseIndex % 2 === 0 ? 1 : -1)
        * side;

      const tip =
        attachment.clone()
          .add(
            new THREE.Vector3(
              side * length,
              rise,
              depthDirection
                * (0.035 + roseIndex % 3 * 0.008)
            )
          );

      const control1 =
        attachment.clone()
          .lerp(tip, 0.34);

      control1.y -=
        0.018
        + (roseIndex % 2) * 0.006;

      control1.z +=
        depthDirection * 0.018;

      const control2 =
        attachment.clone()
          .lerp(tip, 0.72);

      control2.y +=
        0.016;

      control2.x +=
        side
        * (
          roseIndex % 2 === 0
            ? 0.012
            : -0.006
        );

      leaves.add(
        createLeaf({
          base: attachment.toArray(),
          control1: control1.toArray(),
          control2: control2.toArray(),
          tip: tip.toArray(),
          width:
            (
              0.038
              + (roseIndex % 3) * 0.004
              + (side > 0 ? 0.002 : 0)
            )
            * 1.58,
          roll:
            side
            * (
              0.48
              + roseIndex % 4 * 0.10
            ),
          phase:
            roseIndex * 0.83
            + (side > 0 ? 1.7 : 0.3),
          count:
            135
            + (roseIndex % 3) * 12
        })
      );
    }
  }

  leaves.userData.setFormation =
    (progress) => {
      const clamped =
        THREE.MathUtils.clamp(
          progress,
          0,
          1
        );

      leaves.traverse(
        (child) => {
          if (
            child.material?.uniforms?.uFormation
          ) {
            child.material.uniforms.uFormation.value =
              clamped;
          }
        }
      );
    };

  return leaves;
}
