attribute vec2 a_position;
uniform float StartDepthZ;
varying vec2 vUV;

void SkyAtmosphereVS() {
    gl_Position = vec4(a_position, StartDepthZ*2.-1., 1);
    vUV = a_position*0.5 + 0.5;
}

void main() {
    SkyAtmosphereVS();
}