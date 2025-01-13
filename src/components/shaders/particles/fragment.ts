
const particlesFragmentShader =  `
    uniform sampler2D uPictureTexture;

    varying vec3 vColor;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main()
    {
        vec2 uv = gl_PointCoord;

        // Smooth Edges to prevent seeing canvas borders
        float alphaX = 1.0 - smoothstep(0.0, 20., distance(vPosition.x, 0.));
        float alphaY = 1.0 - smoothstep(0.0, 6., distance(vPosition.y, 0.));
        float alpha = alphaX * alphaY;


        // first condition allows to render particles as disc instead of squares by default
        // second condition allow to prevent rendering black particles
        float distanceToCenter = distance(uv, vec2(0.5));
        if(distanceToCenter > 0.5 || length(vColor) <= 0.)
                discard;

        vec3 color = vColor * alpha;

        // gl_FragColor = vec4(vec3(alpha), alpha); // For testing
        gl_FragColor = vec4(color, alpha);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`

export default particlesFragmentShader