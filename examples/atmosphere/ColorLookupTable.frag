//
// Generic log lin transforms
//
vec3 LogToLin( vec3 LogColor )
{
	const float LinearRange = 14.;
	const float LinearGrey = 0.18;
	const float ExposureGrey = 444.;

	// Using stripped down, 'pure log', formula. Parameterized by grey points and dynamic range covered.
	vec3 LinearColor = exp2( ( LogColor - ExposureGrey / 1023.0 ) * LinearRange ) * LinearGrey;
	//vec3 LinearColor = 2 * ( pow(10.0, ((LogColor - 0.616596 - 0.03) / 0.432699)) - 0.037584 );	// SLog
	//vec3 LinearColor = ( pow( 10, ( 1023 * LogColor - 685 ) / 300) - .0108 ) / (1 - .0108);	// Cineon
	//LinearColor = max( 0, LinearColor );

	return LinearColor;
}
vec3 LogToLin(float a) {
	return LogToLin(vec3(a));
}


vec3 LinToLog( vec3 LinearColor )
{
	const float LinearRange = 14.;
	const float LinearGrey = 0.18;
	const float ExposureGrey = 444.;

	// Using stripped down, 'pure log', formula. Parameterized by grey points and dynamic range covered.
	vec3 LogColor = log2(LinearColor) / LinearRange - log2(LinearGrey) / LinearRange + ExposureGrey / 1023.0;	// scalar: 3log2 3mad
	//vec3 LogColor = (log2(LinearColor) - log2(LinearGrey)) / LinearRange + ExposureGrey / 1023.0;
	//vec3 LogColor = log2( LinearColor / LinearGrey ) / LinearRange + ExposureGrey / 1023.0;
	//vec3 LogColor = (0.432699 * log10(0.5 * LinearColor + 0.037584) + 0.616596) + 0.03;	// SLog
	//vec3 LogColor = ( 300 * log10( LinearColor * (1 - .0108) + .0108 ) + 685 ) / 1023;	// Cineon
	// LogColor = saturate( LogColor );
	LogColor = clamp( LogColor, vec3(0), vec3(1) );

	return LogColor;
}


uniform sampler2D uColorGradingLutTexture;
#define LUTSize 32.0


vec4 UnwrappedTexture3DSample( sampler2D Texture, vec3 UVW, float Size ) {
  float IntW = floor( UVW.z * Size - 0.5 );
  float FracW = UVW.z * Size - 0.5 - IntW;

  float U = ( UVW.x + IntW ) / Size;
  float V = UVW.y;

  vec4 RG0 = texture2D( Texture, vec2(U, V) );
  vec4 RG1 = texture2D( Texture, vec2(U + 1.0 / Size, V) );

  return mix(RG0, RG1, vec4(FracW));
  // return lerp(RG0, RG1, FracW);
}

vec3 ColorLookupTable(vec3 LinearColor) {
  vec3 LUTEncodedColor;

    LUTEncodedColor = LinToLog( LinearColor + LogToLin( 0. ) );

    vec3 UVW = LUTEncodedColor * ((LUTSize - 1.) / LUTSize) + (0.5 / LUTSize);

  vec3 OutDeviceColor = UnwrappedTexture3DSample( uColorGradingLutTexture, UVW, LUTSize ).rgb;

  return OutDeviceColor * 1.05;
}