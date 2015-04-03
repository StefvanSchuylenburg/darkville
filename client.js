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
    Dom.div('Welcome to Darkville!');
  };
  
  /**
   * The screen allowing for additional settings
   */
  exports.renderSettings = function () {
    Dom.div(function () {
      
      Dom.p('The following will only be applied to new games. Not the current one.');
      
      // the setting for the number of werewolves
      Dom.p('Number of werewolves in the game:');
      Form.input({
        name: 'nWerewolf',
        value: 2
      });
      
      // restart button
      Form.check({
        name: 'restart',
        text: 'Start new game!',
        sub: 'This will destroy the current game and start a new one.'
      });
    });
  };
  
}());
