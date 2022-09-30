import * as ToyGL from '../../../src/index.js';
const { Cartesian3 } = ToyGL;
import SceneComponent from './SceneComponent.mjs';
import ESkyAtmosphereTransformMode from './ESkyAtmosphereTransformMode.mjs';

const EarthBottomRadius = 6360;
const EarthTopRadius = 6420;
const EarthRayleighScaleHeight = 8;
const EarthMieScaleHeight = 1.2;

function TentDistribution() {
  this.TipAltitude = 0.0;
  this.TipValue = 0.0;
  this.Width = 1.0;
}

function SkyAtmosphereComponent() {
  SceneComponent.call(this);

  // Default: Earth like atmosphere
  this.TransformMode = ESkyAtmosphereTransformMode.PlanetTopAtAbsoluteWorldOrigin;
  this.BottomRadius = EarthBottomRadius;
  this.AtmosphereHeight = EarthTopRadius - EarthBottomRadius;
  this.GroundAlbedo = new Cartesian3(170, 170, 170); // 170 => 0.4f linear

  const RayleighScatteringRaw = new Cartesian3(0.005802, 0.013558, 0.033100);
  this.RayleighScattering = Cartesian3.multiplyByScalar(
    RayleighScatteringRaw,
    1.0 / RayleighScatteringRaw.z,
    new Cartesian3());
  this.RayleighScatteringScale = RayleighScatteringRaw.z;
  this.RayleighExponentialDistribution = EarthRayleighScaleHeight;

  this.MieScattering = new Cartesian3(1, 1, 1);
  this.MieScatteringScale = 0.003996;
  this.MieAbsorption = new Cartesian3(1, 1, 1);
  this.MieAbsorptionScale = 0.000444;
  this.MieAnisotropy = 0.8;
  this.MieExponentialDistribution = EarthMieScaleHeight;

  // Absorption tent distribution representing ozone distribution in Earth atmosphere.
  const OtherAbsorptionRaw = new Cartesian3(0.000650, 0.001881, 0.000085);
  this.OtherAbsorptionScale = OtherAbsorptionRaw.y; // G
  this.OtherAbsorption = Cartesian3.multiplyByScalar(
    OtherAbsorptionRaw,
    1.0 / OtherAbsorptionRaw.y,
    new Cartesian3());
  this.OtherTentDistribution = new TentDistribution();
  this.OtherTentDistribution.TipAltitude = 25;
  this.OtherTentDistribution.TipValue    = 1;
  this.OtherTentDistribution.Width       = 15;

  this.SkyLuminanceFactor = new Cartesian3(1, 1, 1);
  this.MultiScatteringFactor = 1.0;
  // this.AerialPerspectiveViewDistanceScale = 1.0;
  // this.HeightFogContribution = 1.0;
  this.TransmittanceMinLightElevationAngle = -90.0;
  // this.AerialPerspectiveStartDepth = 0.1;

  // this.TraceSampleCountScale = 1.0;

  // this.OverrideAtmosphericLight = []
}

SkyAtmosphereComponent.prototype = SceneComponent.prototype;
SkyAtmosphereComponent.prototype.constructor = SkyAtmosphereComponent;


export default SkyAtmosphereComponent;

