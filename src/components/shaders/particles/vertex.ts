
const particlesVertexShader =  `
    uniform vec2 uResolution;
    uniform sampler2D uPictureTexture;
    uniform float uParticleSize;
    uniform float uTime;
    uniform vec3 uPointer;
    uniform float uProgress;

    varying vec3 vColor;
    varying vec2 vUv;
    varying vec3 vPosition;

    float random2D(vec2 value)
    {
        return fract(sin(dot(value.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    //	Simplex 3D Noise 
    //	by Ian McEwan, Ashima Arts
    //
    vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

    float simplexNoise3d(vec3 v)
    {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        //  x0 = x0 - 0. + 0.0 * C 
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        // Permutations
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
        float n_ = 1.0/7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        // Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    float rand(float n){return fract(sin(n) * 43758.5453123);}

    float noise(float p){
        float fl = floor(p);
    float fc = fract(p);
        return mix(rand(fl), rand(fl + 1.0), fc);
    }

    void main()
    {
        vUv = uv;

        // Transition effect, from far to desired position to draw image

        float multiplier = 50.; // distance factor

        // Allow to split particles to every directions
        float modX = mod(position.x, 2.0) > 1.0 ? 1.0 : -1.0;
        float modY = mod(position.y, 2.0) > 1.0 ? 1.0 : -1.0;
        float modZ = mod(position.z, 2.0)   > 1.0 ? 1.0 : -1.0;

        vec3 positionTarget = vec3(noise(position.x)  * multiplier * modX, noise(position.y) * multiplier * modY, noise(position.z)  * multiplier * modZ );

        float noiseOrigin = simplexNoise3d( positionTarget );
        float noiseTarget = simplexNoise3d( position );
        float noise = mix(noiseOrigin, noiseTarget, uProgress);

        // From Bruno Simon's particles transitions for 3D Models
        float duration = 0.6;
        float delay = (1.0 - duration) * noise;
        float end = delay + duration;
        float progress = smoothstep(delay, end, uProgress);

        vec3 mixedPosition = mix(positionTarget, position, progress);
        vPosition = mixedPosition;

        vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);

        // Glitch/Wavy Effect, can be removed and the transition still works
        float glitchTime = uTime - sin(modelPosition.y / 5.) - sin(modelPosition.x / 5.);
        float glitchStrength = sin(glitchTime) + abs(sin(glitchTime * 3.45)) +  abs(sin(glitchTime * 8.76));
        glitchStrength /= 4.;
        glitchStrength = smoothstep(0.4, 1.0, glitchStrength);
        glitchStrength *= 0.2;

        modelPosition.x += (random2D(modelPosition.xz + uTime * 1.5) - .75) * glitchStrength;
        modelPosition.y += (random2D(modelPosition.zx + uTime * 1.5) - .75) * glitchStrength;


        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;

        // Picture
        float pictureIntensity = texture(uPictureTexture, uv).r / 1.5; // divider to reduce lighting of image

        // Point size
        gl_PointSize = uParticleSize * pictureIntensity * uResolution.y;

        gl_PointSize *= (1.0 / - viewPosition.z);

        // Varyings
        // Just tot twick final color, can be updated or removed
        vColor = vec3(pow(pictureIntensity, 3.0));
        vColor.y *= 5.;
        vColor.z *= 17.;
    }
`

export default particlesVertexShader