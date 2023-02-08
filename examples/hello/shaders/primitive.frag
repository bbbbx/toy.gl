#extension GL_EXT_frag_depth : enable 
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
    #define highp mediump
#endif

#define LOG_DEPTH
#define OES_texture_float_linear

#define OES_texture_float







const float czm_epsilon2 = 0.01;







const float czm_epsilon7 = 0.0000001;

uniform float czm_oneOverLog2FarDepthFromNearPlusOne;
uniform float czm_farDepthFromNearPlusOne;
uniform vec3 czm_lightColor;










const float czm_sceneMode3D = 3.0;

uniform float czm_sceneMode;




















float czm_getSpecular(vec3 lightDirectionEC, vec3 toEyeEC, vec3 normalEC, float shininess)
{
    vec3 toReflectedLight = reflect(-lightDirectionEC, normalEC);
    float specular = max(dot(toReflectedLight, toEyeEC), 0.0);

    
    
    return pow(specular, max(shininess, czm_epsilon2));
}



















float czm_getLambertDiffuse(vec3 lightDirectionEC, vec3 normalEC)
{
    return max(dot(lightDirectionEC, normalEC), 0.0);
}














struct czm_material
{
    vec3 diffuse;
    float specular;
    float shininess;
    vec3 normal;
    vec3 emission;
    float alpha;
};

















struct czm_materialInput
{
    float s;
    vec2 st;
    vec3 str;
    vec3 normalEC;
    mat3 tangentToEyeMatrix;
    vec3 positionToEyeEC;
    float height;
    float slope;
    float aspect;
};

#ifdef LOG_DEPTH
varying float v_depthFromNearPlusOne;

#ifdef POLYGON_OFFSET
uniform vec2 u_polygonOffset;
#endif

#endif
















void czm_writeLogDepth(float depth)
{
#if defined(GL_EXT_frag_depth) && defined(LOG_DEPTH)
    
    
    
    
    if (depth <= 0.9999999 || depth > czm_farDepthFromNearPlusOne) {
        discard;
    }

#ifdef POLYGON_OFFSET
    
    float factor = u_polygonOffset[0];
    float units = u_polygonOffset[1];

    
#ifdef GL_OES_standard_derivatives
    
    float x = dFdx(depth);
    float y = dFdy(depth);
    float m = sqrt(x * x + y * y);

    
    depth += m * factor;
#endif

#endif

    gl_FragDepthEXT = log2(depth) * czm_oneOverLog2FarDepthFromNearPlusOne;

#ifdef POLYGON_OFFSET
    
    gl_FragDepthEXT += czm_epsilon7 * units;
#endif

#endif
}










void czm_writeLogDepth() {
#ifdef LOG_DEPTH
    czm_writeLogDepth(v_depthFromNearPlusOne);
#endif
}

uniform vec3 czm_lightDirectionEC;
float czm_private_getLambertDiffuseOfMaterial(vec3 lightDirectionEC, czm_material material)
{
    return czm_getLambertDiffuse(lightDirectionEC, material.normal);
}

float czm_private_getSpecularOfMaterial(vec3 lightDirectionEC, vec3 toEyeEC, czm_material material)
{
    return czm_getSpecular(lightDirectionEC, toEyeEC, material.normal, material.shininess);
}




















vec4 czm_phong(vec3 toEye, czm_material material, vec3 lightDirectionEC)
{
    
    float diffuse = czm_private_getLambertDiffuseOfMaterial(vec3(0.0, 0.0, 1.0), material);
    if (czm_sceneMode == czm_sceneMode3D) {
        
        diffuse += czm_private_getLambertDiffuseOfMaterial(vec3(0.0, 1.0, 0.0), material);
    }

    float specular = czm_private_getSpecularOfMaterial(lightDirectionEC, toEye, material);

    
    vec3 materialDiffuse = material.diffuse * 0.5;

    vec3 ambient = materialDiffuse;
    vec3 color = ambient + material.emission;
    color += materialDiffuse * diffuse * czm_lightColor;
    color += material.specular * specular * czm_lightColor;

    return vec4(color, material.alpha);
}

vec4 czm_private_phong(vec3 toEye, czm_material material, vec3 lightDirectionEC)
{
    float diffuse = czm_private_getLambertDiffuseOfMaterial(lightDirectionEC, material);
    float specular = czm_private_getSpecularOfMaterial(lightDirectionEC, toEye, material);

    vec3 ambient = vec3(0.0);
    vec3 color = ambient + material.emission;
    color += material.diffuse * diffuse * czm_lightColor;
    color += material.specular * specular * czm_lightColor;

    return vec4(color, material.alpha);
}

















czm_material czm_getDefaultMaterial(czm_materialInput materialInput)
{
    czm_material material;
    material.diffuse = vec3(0.0);
    material.specular = 0.0;
    material.shininess = 1.0;
    material.normal = materialInput.normalEC;
    material.emission = vec3(0.0);
    material.alpha = 1.0;
    return material;
}



#line 0

#line 0
varying vec4 v_pickColor;
#define FACE_FORWARD

            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              material.diffuse = vec3(materialInput.st, 0);
              return material;
            }
          

varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec2 v_st;

void czm_log_depth_main()
{
    vec3 positionToEyeEC = -v_positionEC;

    vec3 normalEC = normalize(v_normalEC);
#ifdef FACE_FORWARD
    normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
#endif

    czm_materialInput materialInput;
    materialInput.normalEC = normalEC;
    materialInput.positionToEyeEC = positionToEyeEC;
    materialInput.st = v_st;
    czm_material material = czm_getMaterial(materialInput);

#ifdef FLAT
    gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);
#else
    gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
#endif
}

#line 0
#ifdef GL_EXT_frag_depth 

#endif 


void main() 
{ 
    czm_log_depth_main(); 
    czm_writeLogDepth(); 
} 
