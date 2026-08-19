attribute float aSize;
attribute vec3 aStartPosition;
attribute float aDelay;

uniform float uFormation;

varying vec3 vColor;
varying float vReveal;

void main() {
    vColor = color;

    float duration = 0.34;

    float progress =
        smoothstep(
            aDelay,
            aDelay + duration,
            uFormation
        );

    float easedProgress =
        1.0
        - pow(
            1.0 - progress,
            3.0
        );

    vReveal = progress;

    vec3 formedPosition =
        mix(
            aStartPosition,
            position,
            easedProgress
        );

    vec4 modelPosition =
        modelMatrix
        * vec4(formedPosition, 1.0);

    vec4 viewPosition =
        viewMatrix * modelPosition;

    gl_Position =
        projectionMatrix * viewPosition;

    float perspective =
        18.0 / max(1.0, -viewPosition.z);

    gl_PointSize =
        aSize
        * perspective
        * 0.62;
}
