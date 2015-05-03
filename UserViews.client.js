/**
 * Contains utility methods to display properties of the user.
 */
(function () {
  'use strict';
  
  var Dom = require('dom');
  var Plugin = require('plugin');
    
  /**
   * Shows the name of the user
   */
  function name(user) {
    Dom.h2(function () {
      Dom.style({
        borderBottomStyle: 'none',
        textTransform: 'initial',
        margin: '4px'
      });
      
      Dom.text(Plugin.userName(user));
    });
  }
  
  exports.name = name;
  
}());
