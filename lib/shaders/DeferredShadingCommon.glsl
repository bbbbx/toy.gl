float EncodeShadingModelIdAndSelectiveOutputMask(uint ShadingModelId, uint SelectiveOutputMask)
{
  uint Value = (ShadingModelId & uint(SHADINGMODELID_MASK)) | SelectiveOutputMask;
  return float(Value) / float(0xFF);
}

uint DecodeShadingModelId(float InPackedChannel)
{
  return (uint(round(InPackedChannel * float(0xFF))) & uint(SHADINGMODELID_MASK));
}
