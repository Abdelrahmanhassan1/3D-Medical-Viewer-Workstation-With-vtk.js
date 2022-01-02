var BlendMode = {
  COMPOSITE_BLEND: 0,
  MAXIMUM_INTENSITY_BLEND: 1,
  MINIMUM_INTENSITY_BLEND: 2,
  AVERAGE_INTENSITY_BLEND: 3,
  ADDITIVE_INTENSITY_BLEND: 4
};
var FilterMode = {
  OFF: 0,
  NORMALIZED: 1,
  RAW: 2
};
var Constants = {
  BlendMode: BlendMode,
  FilterMode: FilterMode
};

export { BlendMode, FilterMode, Constants as default };
