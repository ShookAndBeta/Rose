import * as THREE from 'three';


function pickStarColor() {
  const value =
    Math.random();

  if (value < 0.58) {
    return new THREE.Color('#AFC7EA');
  }

  if (value < 0.78) {
    return new THREE.Color('#EEF3FF');
  }

  if (value < 0.94) {
    return new THREE.Color('#D5ABC7');
  }

  return new THREE.Color('#FFD9B8');
}


function createStarField() {
  const starCount = 1550;
  const positions = [];
  const colors = [];
  const sizes = [];
  const phases = [];
  const opacities = [];
  const sparkleStrengths = [];

  for (
    let i = 0;
    i < starCount;
    i++
  ) {
    const depth =
      Math.random();

    /*
     * 越远的星层覆盖范围越大，形成真正的空间纵深，而不是一张
     * 贴在画面后的平面点阵。
     */
    const spreadX =
      5.2 + depth * 4.8;

    const spreadY =
      3.5 + depth * 3.2;

    positions.push(
      (Math.random() * 2 - 1) * spreadX,
      (Math.random() * 2 - 1) * spreadY,
      -3.5 - depth * 9.5
    );

    const color =
      pickStarColor();

    colors.push(
      color.r,
      color.g,
      color.b
    );

    const brightStar =
      Math.random() < 0.055;

    sizes.push(
      brightStar
        ? 2.8 + Math.random() * 2.5
        : 0.78 + Math.random() * 1.42
    );

    phases.push(
      Math.random() * Math.PI * 2
    );

    opacities.push(
      brightStar
        ? 0.68 + Math.random() * 0.28
        : 0.26 + Math.random() * 0.40
    );

    sparkleStrengths.push(
      brightStar
        ? 0.55 + Math.random() * 0.45
        : 0
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
    'aPhase',
    new THREE.Float32BufferAttribute(
      phases,
      1
    )
  );

  geometry.setAttribute(
    'aOpacity',
    new THREE.Float32BufferAttribute(
      opacities,
      1
    )
  );

  geometry.setAttribute(
    'aSparkle',
    new THREE.Float32BufferAttribute(
      sparkleStrengths,
      1
    )
  );

  const material =
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0
        },
        uFade: {
          value: 1
        }
      },

      vertexColors: true,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,

      vertexShader: `
        uniform float uTime;
        uniform float uFade;

        attribute float aSize;
        attribute float aPhase;
        attribute float aOpacity;
        attribute float aSparkle;

        varying vec3 vColor;
        varying float vOpacity;
        varying float vSparkle;

        void main() {
          vColor = color;
          vSparkle = aSparkle;

          vec3 animatedPosition =
            position;

          animatedPosition.x +=
            sin(uTime * 0.025 + aPhase)
            * 0.018;

          animatedPosition.y +=
            cos(uTime * 0.020 + aPhase)
            * 0.014;

          vec4 viewPosition =
            viewMatrix
            * modelMatrix
            * vec4(animatedPosition, 1.0);

          gl_Position =
            projectionMatrix
            * viewPosition;

          gl_PointSize =
            aSize
            * 25.0
            / max(1.0, -viewPosition.z);

          float twinkle =
            0.78
            + 0.22
            * sin(
              uTime
                * (0.38 + aSparkle * 0.36)
              + aPhase
            );

          vOpacity =
            aOpacity
            * twinkle;
        }
      `,

      fragmentShader: `
        precision highp float;

        varying vec3 vColor;
        varying float vOpacity;
        varying float vSparkle;

        void main() {
          vec2 uv =
            gl_PointCoord
            - vec2(0.5);

          float radius =
            length(uv);

          if (radius > 0.5) {
            discard;
          }

          float core =
            exp(-radius * radius * 42.0);

          float softHalo =
            exp(-radius * radius * 12.0)
            * 0.30;

          /* 只有少量亮星带有非常短的十字星芒。 */
          float horizontalRay =
            exp(-abs(uv.y) * 95.0)
            * exp(-abs(uv.x) * 8.0);

          float verticalRay =
            exp(-abs(uv.x) * 95.0)
            * exp(-abs(uv.y) * 8.0);

          float rays =
            (horizontalRay + verticalRay)
            * vSparkle
            * 0.42;

          float alpha =
            (core + softHalo + rays)
            * vOpacity;

          if (alpha < 0.018) {
            discard;
          }

          vec3 finalColor =
            vColor
            * (0.96 + core * 0.52)
            + vec3(rays * 0.18);

          gl_FragColor =
            vec4(
              finalColor,
              alpha
            );
        }
      `
    });

  const stars =
    new THREE.Points(
      geometry,
      material
    );

  stars.renderOrder = -2;

  stars.userData.update =
    (elapsed) => {
      material.uniforms.uTime.value =
        elapsed;

      material.uniforms.uFade.value =
        1;
    };

  return stars;
}


export function createEnvironment() {
  const environment =
    new THREE.Group();

  const stars =
    createStarField();

  environment.add(
    stars
  );

  environment.userData.update =
    (elapsed) => {
      stars.userData.update(elapsed);
    };

  return environment;
}
