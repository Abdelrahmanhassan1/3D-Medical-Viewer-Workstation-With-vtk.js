var WidgetState = {
  IDLE: 0,
  CROPPING: 1
};
var CropWidgetEvents = ['CroppingPlanesChanged']; // first 6 are face handles,
// next 12 are edge handles,
// last 8 are corner handles.

var TOTAL_NUM_HANDLES = 26;
var Constants = {
  TOTAL_NUM_HANDLES: TOTAL_NUM_HANDLES,
  WidgetState: WidgetState,
  CropWidgetEvents: CropWidgetEvents
};

export { Constants as default };
