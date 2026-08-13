

// Cosine-based palette generator (Inigo Quilez)
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 dragonColor(vec2 uv) {
    vec2 z = uv;
    int iterations = 80;
    float smoothEscape = -1.0;
    float prevLen = length(z);

    for (int i = 0; i < 80; i++) {
        if (smoothEscape >= 0.0) break;

        vec2 zr = vec2(z.x - z.y, z.x + z.y);

        vec2 z0 = zr;
        vec2 z1 = zr - vec2(1.0, 0.0);
        z = (dot(z0, z0) < dot(z1, z1)) ? z0 : z1;

        float newLen = length(z);
        if (newLen > 2.0) {
            float frac = (2.0 - prevLen) / max(newLen - prevLen, 1e-5);
            smoothEscape = float(i) + clamp(frac, 0.0, 1.0);
        }
        prevLen = newLen;
    }

    // Darker, desaturated interior so large solid regions don't wash out
    vec3 interiorBase = pal(0.85,
        vec3(0.25, 0.08, 0.16),
        vec3(0.18, 0.08, 0.13),
        vec3(1.0, 0.7, 0.6),
        vec3(0.95, 0.55, 0.65)
    );

    if (smoothEscape < 0.0) {
        // Subtle internal texture: use final z position (before it stabilized)
        // to add gentle variation instead of a flat fill
        float texture = 0.85 + 0.15 * sin(dot(z, z) * 8.0 + z.x * 5.0);
        return interiorBase * texture;
    }

    float t = smoothEscape / float(iterations);
    float glow = smoothstep(0.05, 0.35, t);

    vec3 boundaryColor = pal(t,
        vec3(0.7, 0.25, 0.5),
        vec3(0.4, 0.3, 0.35),
        vec3(1.0, 0.8, 0.6),
        vec3(0.9, 0.5, 0.6)
    );

    vec3 col = mix(boundaryColor, interiorBase, smoothstep(0.6, 0.95, t));
    col *= glow;

    // Mild contrast curve: pulls mid-tones down, keeps highlights punchy
    col = pow(col, vec3(0.5));

    return col;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 base_uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float zoom = 10.0 / pow(1.3, iTime * 0.6);

    const int TIME_SAMPLES = 3;
    float dt = 0.012;

    vec3 accum = vec3(0.0);
    for (int s = 0; s < TIME_SAMPLES; s++) {
        float tOffset = float(s) * dt;
        float sampleZoom = 10.0 / pow(1.3, (iTime - tOffset) * 0.6);
        vec2 uv = base_uv * sampleZoom;
        accum += dragonColor(uv);
    }
    vec3 col = accum / float(TIME_SAMPLES);

    fragColor = vec4(col, 1.0);
}