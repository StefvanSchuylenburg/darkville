(function () {
  'use strict';
  
  // loading dependencies
  var Dom = require('dom');
  var Form = require('form');
  
  /**
   * The main render method
   */
  exports.render = function () {
    // TODO: fill in render function
    Dom.div("Welcome to Darkville!");
  };
  
  /**
   * The screen allowing for additional settings
   */
  exports.renderSettings = function () {
    Dom.div(function () {
      // the setting for the number of werewolves
      Dom.text("Number of werewolves in the game:");
      Form.input({
        name: "nWerewolf",
        value: 2
      });
    });
  };
  
}());
