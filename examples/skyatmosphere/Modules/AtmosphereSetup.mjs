import * as ToyGL from '../../../src/index.js';
const { Cartesian3 } = ToyGL;
import ESkyAtmosphereTransformMode from './ESkyAtmosphereTransformMode.mjs';

function tentToCoefficients(tent, atmosphereSetup) {
  if (tent.Width > 0.0 && tent.TipValue > 0.0) {
    const px = tent.TipAltitude;
    const py = tent.TipValue;
    const slope = tent.TipValue / tent.Width;
    atmosphereSetup.AbsorptionDensity0LayerWidth = px;
    atmosphereSetup.AbsorptionDensity0LinearTerm =  slope;
    atmosphereSetup.AbsorptionDensity1LinearTerm = -slope;
    atmosphereSetup.AbsorptionDensity0ConstantTerm = py - px * atmosphereSetup.AbsorptionDensity0LinearTerm;
    atmosphereSetup.AbsorptionDensity1ConstantTerm = py - px * atmosphereSetup.AbsorptionDensity1LinearTerm;
  } else {
    atmosphereSetup.AbsorptionDensity0LayerWidth = 0.0;
    atmosphereSetup.AbsorptionDensity0LinearTerm = 0.0;
    atmosphereSetup.AbsorptionDensity1LinearTerm = 0.0;
    atmosphereSetup.AbsorptionDensity0ConstantTerm = 0.0;
    atmosphereSetup.AbsorptionDensity1ConstantTerm = 0.0;
  }
}

/**
* Table for fast FColor -> FLinearColor conversion.
*
* Color > 0.04045 ? pow( Color * (1.0 / 1.055) + 0.0521327, 2.4 ) : Color * (1.0 / 12.92);
*/
const sRGBToLinearTable =
[
  0.0,
  0.000303526983548838, 0.000607053967097675, 0.000910580950646512, 0.00121410793419535, 0.00151763491774419,
  0.00182116190129302, 0.00212468888484186, 0.0024282158683907, 0.00273174285193954, 0.00303526983548838,
  0.00334653564113713, 0.00367650719436314, 0.00402471688178252, 0.00439144189356217, 0.00477695332960869,
  0.005181516543916, 0.00560539145834456, 0.00604883284946662, 0.00651209061157708, 0.00699540999852809,
  0.00749903184667767, 0.00802319278093555, 0.0085681254056307, 0.00913405848170623, 0.00972121709156193,
  0.0103298227927056, 0.0109600937612386, 0.0116122449260844, 0.012286488094766, 0.0129830320714536,
  0.0137020827679224, 0.0144438433080002, 0.0152085141260192, 0.0159962930597398, 0.0168073754381669,
  0.0176419541646397, 0.0185002197955389, 0.0193823606149269, 0.0202885627054049, 0.0212190100154473,
  0.0221738844234532, 0.02315336579873, 0.0241576320596103, 0.0251868592288862, 0.0262412214867272,
  0.0273208912212394, 0.0284260390768075, 0.0295568340003534, 0.0307134432856324, 0.0318960326156814,
  0.0331047661035236, 0.0343398063312275, 0.0356013143874111, 0.0368894499032755, 0.0382043710872463,
  0.0395462347582974, 0.0409151963780232, 0.0423114100815264, 0.0437350287071788, 0.0451862038253117,
  0.0466650857658898, 0.0481718236452158, 0.049706565391714, 0.0512694577708345, 0.0528606464091205,
  0.0544802758174765, 0.0561284894136735, 0.0578054295441256, 0.0595112375049707, 0.0612460535624849,
  0.0630100169728596, 0.0648032660013696, 0.0666259379409563, 0.0684781691302512, 0.070360094971063,
  0.0722718499453493, 0.0742135676316953, 0.0761853807213167, 0.0781874210336082, 0.0802198195312533,
  0.0822827063349132, 0.0843762107375113, 0.0865004612181274, 0.0886555854555171, 0.0908417103412699,
  0.0930589619926197, 0.0953074657649191, 0.0975873462637915, 0.0998987273569704, 0.102241732185838,
  0.104616483176675, 0.107023102051626, 0.109461709839399, 0.1119324268857, 0.114435372863418,
  0.116970666782559, 0.119538426999953, 0.122138771228724, 0.124771816547542, 0.127437679409664,
  0.130136475651761, 0.132868320502552, 0.135633328591233, 0.138431613955729, 0.141263290050755,
  0.144128469755705, 0.147027265382362, 0.149959788682454, 0.152926150855031, 0.155926462553701,
  0.158960833893705, 0.162029374458845, 0.16513219330827, 0.168269398983119, 0.171441099513036,
  0.174647402422543, 0.17788841473729, 0.181164242990184, 0.184474993227387, 0.187820771014205,
  0.191201681440861, 0.194617829128147, 0.198069318232982, 0.201556252453853, 0.205078735036156,
  0.208636868777438, 0.212230756032542, 0.215860498718652, 0.219526198320249, 0.223227955893977,
  0.226965872073417, 0.23074004707378, 0.23455058069651, 0.238397572333811, 0.242281120973093,
  0.246201325201334, 0.250158283209375, 0.254152092796134, 0.258182851372752, 0.262250655966664,
  0.266355603225604, 0.270497789421545, 0.274677310454565, 0.278894261856656, 0.283148738795466,
  0.287440836077983, 0.291770648154158, 0.296138269120463, 0.300543792723403, 0.304987312362961,
  0.309468921095997, 0.313988711639584, 0.3185467763743, 0.323143207347467, 0.32777809627633,
  0.332451534551205, 0.337163613238559, 0.341914423084057, 0.346704054515559, 0.351532597646068,
  0.356400142276637, 0.361306777899234, 0.36625259369956, 0.371237678559833, 0.376262121061519,
  0.381326009488037, 0.386429431827418, 0.39157247577492, 0.396755228735618, 0.401977777826949,
  0.407240209881218, 0.41254261144808, 0.417885068796976, 0.423267667919539, 0.428690494531971,
  0.434153634077377, 0.439657171728079, 0.445201192387887, 0.450785780694349, 0.456411021020965,
  0.462076997479369, 0.467783793921492, 0.473531493941681, 0.479320180878805, 0.485149937818323,
  0.491020847594331, 0.496932992791578, 0.502886455747457, 0.50888131855397, 0.514917663059676,
  0.520995570871595, 0.527115123357109, 0.533276401645826, 0.539479486631421, 0.545724458973463,
  0.552011399099209, 0.558340387205378, 0.56471150325991, 0.571124827003694, 0.577580437952282,
  0.584078415397575, 0.590618838409497, 0.597201785837643, 0.603827336312907, 0.610495568249093,
  0.617206559844509, 0.623960389083534, 0.630757133738175, 0.637596871369601, 0.644479679329661,
  0.651405634762384, 0.658374814605461, 0.665387295591707, 0.672443154250516, 0.679542466909286,
  0.686685309694841, 0.693871758534824, 0.701101889159085, 0.708375777101046, 0.71569349769906,
  0.723055126097739, 0.730460737249286, 0.737910405914797, 0.745404206665559, 0.752942213884326,
  0.760524501766589, 0.768151144321824, 0.775822215374732, 0.783537788566466, 0.791297937355839,
  0.799102735020525, 0.806952254658248, 0.81484656918795, 0.822785751350956, 0.830769873712124,
  0.838799008660978, 0.846873228412837, 0.854992605009927, 0.863157210322481, 0.871367116049835,
  0.879622393721502, 0.887923114698241, 0.896269350173118, 0.904661171172551, 0.913098648557343,
  0.921581853023715, 0.930110855104312, 0.938685725169219, 0.947306533426946, 0.955973349925421,
  0.964686244552961, 0.973445287039244, 0.982250546956257, 0.991102093719252, 1.0
];

/**
 * 
 * @param {SkyAtmosphereComponent} SkyAtmosphereComponent 
 */
function AtmosphereSetup(SkyAtmosphereComponent) {
  this.BottomRadiusKm = SkyAtmosphereComponent.BottomRadius;
  this.TopRadiusKm = SkyAtmosphereComponent.BottomRadius + Math.max(0.1, SkyAtmosphereComponent.AtmosphereHeight);
  this.GroundAlbedo = Cartesian3.fromElements(
    sRGBToLinearTable[SkyAtmosphereComponent.GroundAlbedo.x],
    sRGBToLinearTable[SkyAtmosphereComponent.GroundAlbedo.y],
    sRGBToLinearTable[SkyAtmosphereComponent.GroundAlbedo.z],
  );
  this.MultiScatteringFactor = ToyGL.Math.clamp(SkyAtmosphereComponent.MultiScatteringFactor, 0.0, 2.0);

  this.RayleighDensityExpScale = -1.0 / SkyAtmosphereComponent.RayleighExponentialDistribution;
  this.RayleighScattering = Cartesian3.multiplyByScalar(
    SkyAtmosphereComponent.RayleighScattering,
    SkyAtmosphereComponent.RayleighScatteringScale,
    new Cartesian3()
  ).clamp(0.0, 1e38);

  this.MieScattering = Cartesian3.multiplyByScalar(
    SkyAtmosphereComponent.MieScattering,
    SkyAtmosphereComponent.MieScatteringScale,
    new Cartesian3()
  ).clamp(0.0, 1e38);
  this.MieAbsorption = Cartesian3.multiplyByScalar(
    SkyAtmosphereComponent.MieAbsorption,
    SkyAtmosphereComponent.MieAbsorptionScale,
    new Cartesian3()
  ).clamp(0.0, 1e38);
  this.MieExtinction = Cartesian3.add(this.MieScattering, this.MieAbsorption, new Cartesian3());
  this.MiePhaseG = SkyAtmosphereComponent.MieAnisotropy;
  this.MieDensityExpScale = -1.0 / SkyAtmosphereComponent.MieExponentialDistribution;

  this.AbsorptionExtinction = Cartesian3.multiplyByScalar(
    SkyAtmosphereComponent.OtherAbsorption,
    SkyAtmosphereComponent.OtherAbsorptionScale,
    new Cartesian3()
  ).clamp(0.0, 1e38);
  this.AbsorptionDensity0LayerWidth = undefined;
  this.AbsorptionDensity0LinearTerm = undefined;
  this.AbsorptionDensity1LinearTerm = undefined;
  this.AbsorptionDensity0ConstantTerm = undefined;
  this.AbsorptionDensity1ConstantTerm = undefined;
  tentToCoefficients(SkyAtmosphereComponent.OtherTentDistribution, this);

  this.TransmittanceMinLightElevationAngle = SkyAtmosphereComponent.TransmittanceMinLightElevationAngle;

  this.PlanetCenterKm = undefined;
  this.UpdateTransform(SkyAtmosphereComponent.GetComponentTransform(), SkyAtmosphereComponent.TransformMode);
}

/**
 * 
 * @param {Transform} ComponentTransform 
 * @param {ESkyAtmosphereTransformMode} TransformMode 
 */
AtmosphereSetup.prototype.UpdateTransform = function(ComponentTransform, TransformMode) {
  switch (TransformMode){
  case ESkyAtmosphereTransformMode.PlanetTopAtAbsoluteWorldOrigin:
    this.PlanetCenterKm = new Cartesian3(0, 0, -this.BottomRadiusKm);
    break;
  case ESkyAtmosphereTransformMode.PlanetTopAtComponentTransform:
    this.PlanetCenterKm = Cartesian3.add(
      new Cartesian3(0, 0, -this.BottomRadiusKm),
      Cartesian3.multiplyByScalar(ComponentTransform.GetTranslation(), AtmosphereSetup.CmToSkyUnit, new Cartesian3()),
      new Cartesian3());
    break;
  case ESkyAtmosphereTransformMode.PlanetCenterAtComponentTransform:
    this.PlanetCenterKm = Cartesian3.multiplyByScalar(
      ComponentTransform.GetTranslation(),
      AtmosphereSetup.CmToSkyUnit,
      new Cartesian3());
    break;
  default:
    throw new Error('Never');
  }
};

AtmosphereSetup.CmToSkyUnit = 0.00001;       // Centimeters to Kilometers
AtmosphereSetup.SkyUnitToCm = 1.0 / 0.00001; // Kilometers to Centimeters

export default AtmosphereSetup;
