var State = {
  OUTSIDE: 0,
  ONP1: 1,
  ONP2: 2,
  TRANSLATINGP1: 3,
  TRANSLATINGP2: 4,
  ONLINE: 5,
  SCALING: 6
};
var Restrict = {
  NONE: 0,
  X: 1,
  Y: 2,
  Z: 3
};
var Constants = {
  State: State,
  Restrict: Restrict
};

export { Restrict, State, Constants as default };
