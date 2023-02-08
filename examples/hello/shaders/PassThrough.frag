varying vec2 vUV;
uniform sampler2D uTexture;

void main()
{
  vec2 UV = vUV;
  gl_FragColor = texture2D(uTexture, UV);
}