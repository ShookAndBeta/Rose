precision highp float;

varying vec3 vColor;
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
            * 24.0
        );


    /*
     * Phase 2B：
     *
     * 极透明区域直接丢弃。
     *
     * 因为现在开启了 depthWrite，
     * 如果几乎透明的边缘也写入深度，
     * 会挡住后面的粒子。
     */
    if (alpha < 0.06) {
        discard;
    }


    float core =
        exp(
            -dist
            * dist
            * 65.0
        );


    vec3 finalColor =
        vColor * 1.08
        + vec3(
            core * 0.07
        );


    gl_FragColor =
        vec4(
            finalColor,
            alpha
        );
}