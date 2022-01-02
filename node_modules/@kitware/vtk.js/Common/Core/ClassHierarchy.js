import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _classCallCheck from '@babel/runtime/helpers/classCallCheck';
import _createClass from '@babel/runtime/helpers/createClass';
import _get from '@babel/runtime/helpers/get';
import _inherits from '@babel/runtime/helpers/inherits';
import _possibleConstructorReturn from '@babel/runtime/helpers/possibleConstructorReturn';
import _getPrototypeOf from '@babel/runtime/helpers/getPrototypeOf';
import _wrapNativeSuper from '@babel/runtime/helpers/wrapNativeSuper';

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var ClassHierarchy = /*#__PURE__*/function (_Array) {
  _inherits(ClassHierarchy, _Array);

  var _super = _createSuper(ClassHierarchy);

  function ClassHierarchy() {
    _classCallCheck(this, ClassHierarchy);

    return _super.apply(this, arguments);
  }

  _createClass(ClassHierarchy, [{
    key: "push",
    value: function push() {
      var _this = this,
          _get2;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // no perf issue since args.length should be small
      var newArgs = args.filter(function (arg) {
        return !_this.includes(arg);
      });
      return (_get2 = _get(_getPrototypeOf(ClassHierarchy.prototype), "push", this)).call.apply(_get2, [this].concat(_toConsumableArray(newArgs)));
    }
  }]);

  return ClassHierarchy;
}( /*#__PURE__*/_wrapNativeSuper(Array));

export { ClassHierarchy as default };
