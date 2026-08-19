export function createInteraction(
  element = window
) {
  const pointer = {
    x: 0,
    y: 0
  };

  /*
   * rotation 是用户在自动旋转基础上叠加的视角偏移。
   * velocity 用于松手后的短暂惯性。
   */
  const rotation = {
    x: 0,
    y: 0
  };

  const velocity = {
    x: 0,
    y: 0
  };

  /*
   * zoom 表示相机距离倍率：数值越小越靠近花束。
   */
  const zoom = {
    current: 1,
    target: 1
  };

  let dragging = false;
  let activePointerId = null;
  let previousX = 0;
  let previousY = 0;

  const sensitivity = 0.006;
  const maxPitch = 0.72;


  function updatePointer(event) {
    pointer.x =
      event.clientX
      / window.innerWidth
      * 2.0
      - 1.0;

    pointer.y =
      -(
        event.clientY
        / window.innerHeight
        * 2.0
        - 1.0
      );
  }


  function onPointerDown(event) {
    if (
      activePointerId !== null
    ) {
      return;
    }

    dragging = true;
    activePointerId = event.pointerId;
    previousX = event.clientX;
    previousY = event.clientY;

    velocity.x = 0;
    velocity.y = 0;

    element.setPointerCapture?.(
      event.pointerId
    );

    element.classList?.add(
      'is-dragging'
    );
  }


  function onPointerMove(event) {
    updatePointer(event);

    if (
      !dragging
      || event.pointerId !== activePointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX - previousX;

    const deltaY =
      event.clientY - previousY;

    previousX = event.clientX;
    previousY = event.clientY;

    velocity.y =
      Math.max(
        -0.09,
        Math.min(
          0.09,
          deltaX * sensitivity
        )
      );

    velocity.x =
      Math.max(
        -0.07,
        Math.min(
          0.07,
          deltaY * sensitivity
        )
      );

    rotation.y +=
      velocity.y;

    rotation.x =
      Math.max(
        -maxPitch,
        Math.min(
          maxPitch,
          rotation.x + velocity.x
        )
      );
  }


  function finishDrag(event) {
    if (
      event.pointerId !== activePointerId
    ) {
      return;
    }

    element.releasePointerCapture?.(
      event.pointerId
    );

    dragging = false;
    activePointerId = null;

    element.classList?.remove(
      'is-dragging'
    );
  }


  function onWheel(event) {
    event.preventDefault();

    zoom.target *=
      Math.exp(
        event.deltaY * 0.0012
      );

    zoom.target =
      Math.max(
        0.62,
        Math.min(
          1.55,
          zoom.target
        )
      );
  }


  function update(delta) {
    const zoomEase =
      1 - Math.exp(-delta * 11.0);

    zoom.current +=
      (zoom.target - zoom.current)
      * zoomEase;

    if (dragging) {
      return;
    }

    const frameScale =
      Math.min(
        delta * 60,
        2
      );

    rotation.y +=
      velocity.y * frameScale;

    rotation.x =
      Math.max(
        -maxPitch,
        Math.min(
          maxPitch,
          rotation.x
            + velocity.x * frameScale
        )
      );

    const damping =
      Math.pow(
        0.88,
        frameScale
      );

    velocity.x *= damping;
    velocity.y *= damping;

    if (
      Math.abs(velocity.x) < 0.00001
    ) {
      velocity.x = 0;
    }

    if (
      Math.abs(velocity.y) < 0.00001
    ) {
      velocity.y = 0;
    }
  }


  element.addEventListener(
    'pointerdown',
    onPointerDown
  );

  element.addEventListener(
    'wheel',
    onWheel,
    {
      passive: false
    }
  );

  window.addEventListener(
    'pointermove',
    onPointerMove,
    {
      passive: true
    }
  );

  window.addEventListener(
    'pointerup',
    finishDrag
  );

  window.addEventListener(
    'pointercancel',
    finishDrag
  );


  return {
    pointer,
    rotation,
    zoom,
    update,

    get dragging() {
      return dragging;
    },

    destroy() {
      element.removeEventListener(
        'pointerdown',
        onPointerDown
      );

      element.removeEventListener(
        'wheel',
        onWheel
      );

      window.removeEventListener(
        'pointermove',
        onPointerMove
      );

      window.removeEventListener(
        'pointerup',
        finishDrag
      );

      window.removeEventListener(
        'pointercancel',
        finishDrag
      );
    }
  };
}
