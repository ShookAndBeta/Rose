import * as THREE from 'three';

import './style.css';

import {
  createBouquet
} from './bouquet.js';

import {
  createInteraction
} from './interaction.js';

import {
  createEnvironment
} from './environment.js';


const app =
  document.querySelector('#app');


/*
 * Scene
 */

const scene =
  new THREE.Scene();

scene.background =
  new THREE.Color('#010207');


/*
 * Camera
 */

const camera =
  new THREE.PerspectiveCamera(
    35,
    window.innerWidth
      / window.innerHeight,
    0.1,
    100
  );


camera.position.set(
  0,
  0,
  8.8
);


/*
 * Renderer
 */

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference:
      'high-performance'
  });


renderer.setSize(
  window.innerWidth,
  window.innerHeight
);


renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);


renderer.outputColorSpace =
  THREE.SRGBColorSpace;


renderer.toneMapping =
  THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure =
  1.10;


app.appendChild(
  renderer.domElement
);


/*
 * 深色星空环境层：冷白、淡蓝与少量暖粉星点。
 */
const environment =
  createEnvironment();


scene.add(
  environment
);


const bouquet =
  createBouquet();


scene.add(
  bouquet
);


/*
 * Interaction
 */

const interaction =
  createInteraction(
    renderer.domElement
  );


/*
 * Clock
 */

const clock =
  new THREE.Clock();


let autoRotationY =
  0;


/*
 * Phase 6 使用逐帧累加时间，不再依赖页面恢复时可能异常的绝对
 * 时间戳。初始值略大于零，刷新后的第一帧就能看到星空和花柄。
 */
let formationElapsed =
  1.80;


function restartFormation() {
  formationElapsed =
    1.80;

  autoRotationY =
    0;

  clock.start();

  bouquet.userData.updateAnimation(
    formationElapsed
  );

  environment.userData.update(
    formationElapsed
  );

  /* 立即绘制一次，避免等待首个 requestAnimationFrame 时黑屏。 */
  renderer.render(
    scene,
    camera
  );
}


window.addEventListener(
  'pageshow',
  restartFormation
);


/*
 * 如果浏览器暂停了 requestAnimationFrame，1.5 秒后直接显示完成
 * 状态，确保任何环境下都不会永久停留在黑屏或初始粒子状态。
 */
window.setTimeout(
  () => {
    if (formationElapsed < 1.88) {
      formationElapsed =
        bouquet.userData.animationDuration;

      bouquet.userData.updateAnimation(
        formationElapsed
      );

      environment.userData.update(
        formationElapsed
      );

      renderer.render(
        scene,
        camera
      );
    }
  },
  1500
);


/*
 * Resize
 */

function onResize() {
  const width =
    window.innerWidth;

  const height =
    window.innerHeight;


  camera.aspect =
    width / height;

  camera.updateProjectionMatrix();


  renderer.setSize(
    width,
    height
  );


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

}


window.addEventListener(
  'resize',
  onResize
);


/*
 * Render Loop
 */

function animate() {
  const delta =
    clock.getDelta();

  const elapsed =
    clock.elapsedTime;


  interaction.update(
    delta
  );


  /*
   * 保留动画顺序，但跳过完全漆黑的初始空帧。页面首次渲染时
   * 已能看到一部分星空，随后立刻进入花柄生长阶段。
   */
  formationElapsed +=
    Math.min(
      delta,
      0.05
    );


  environment.userData.update(
    formationElapsed
  );


  bouquet.userData.updateAnimation(
    formationElapsed
  );


  /*
   * 滚轮改变相机距离，并通过 interaction 中的插值平滑过渡。
   */
  camera.position.z =
    8.8 * interaction.zoom.current;


  /*
   * 形成动画结束后才开放旋转、呼吸和悬浮，避免组装过程中
   * 视角变化干扰花瓣层级。
   */
  const animationDuration =
    bouquet.userData.animationDuration;

  const interactionReady =
    THREE.MathUtils.smoothstep(
      formationElapsed,
      animationDuration - 0.35,
      animationDuration
    );


  if (
    formationElapsed >= animationDuration
    && !interaction.dragging
  ) {
    autoRotationY +=
      delta * 0.08;
  }


  bouquet.rotation.y =
    autoRotationY
    + interaction.rotation.y
      * interactionReady;


  bouquet.rotation.x =
    interaction.rotation.x
      * interactionReady
    + Math.sin(
      elapsed * 0.25
    )
      * 0.025
      * interactionReady;


  bouquet.position.y =
    Math.sin(
      elapsed * 0.72
    )
    * 0.018
    * interactionReady;


  const breathingScale =
    1.0
    + Math.sin(
      elapsed * 0.58
    )
      * 0.0035
      * interactionReady;


  bouquet.scale.setScalar(
    breathingScale
  );


  renderer.render(
    scene,
    camera
  );


  requestAnimationFrame(
    animate
  );
}


restartFormation();
animate();