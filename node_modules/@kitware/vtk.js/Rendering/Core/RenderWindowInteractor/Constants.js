var Device = {
  Unknown: 0,
  LeftController: 1,
  RightController: 2
};
var Input = {
  Unknown: 0,
  Trigger: 1,
  TrackPad: 2,
  Grip: 3,
  ApplicationMenu: 4
};
var Constants = {
  Device: Device,
  Input: Input
};

export { Device, Input, Constants as default };
