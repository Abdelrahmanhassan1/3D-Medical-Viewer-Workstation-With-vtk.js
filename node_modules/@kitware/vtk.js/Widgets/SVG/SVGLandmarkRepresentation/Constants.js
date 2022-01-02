var VerticalTextAlignment = {
  TOP: 'TOP',
  BOTTOM: 'BOTTOM',
  MIDDLE: 'MIDDLE'
};
/**
 * fontSize can be a number or a string representing a size in px
 * @param {Number|String} fontSize
 * @returns Number representing the fontSize in pixels
 */

function fontSizeToPixels(fontProperties) {
  var defaultFontSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;

  if (fontProperties != null && fontProperties.fontSize) {
    if (typeof fontProperties.fontSize === 'string') {
      if (fontProperties.fontSize.slice(-2) === 'px') {
        return window.devicePixelRatio * parseInt(fontProperties.fontSize, 10);
      }
    } else {
      return window.devicePixelRatio * fontProperties.fontSize;
    }
  }

  return window.devicePixelRatio * defaultFontSize;
}

export { VerticalTextAlignment, VerticalTextAlignment as default, fontSizeToPixels };
