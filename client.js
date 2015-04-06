(function () {
  'use strict';
  
  // loading dependencies
  var Dom = require('dom');
  var Form = require('form');
  var Db = require('db');
  var Ui = require('ui');
  var Plugin = require('plugin');
  
  var GameTime = require('GameTime');
  var RoleViews = require('RoleViews');
  
  /**
   * The main render method
   */
  exports.render = function () {
    
    // the current game time
    var time = GameTime.startingOn(Db.shared.get('time').start);
    
    /**
     * Renders information in the bar on top of the application.
     * Token from repo Happening/Betrayal
     */
    function infoItem(title, content) {
      Dom.div(function () {
        Dom.style({textAlign: 'center', Flex: true});
        Dom.div(function () {
          Dom.text(title);
          Dom.style({fontWeight: 'bold'});
        });
        content();
      });
    }
    
    // Render the page
    Dom.div(function () {
      
      // display current time
      infoItem('time', function () {
        var now = new Date();
        var dayNight = time.isDay(now)? 'Day': 'Night';
        var number = time.getNumber(now);
        Dom.text(dayNight + ' ' + number);
      });
      
      Dom.text('Welcome to Darkville!');
      
      // display the role
      RoleViews.description(Db.personal.get('role'));
    });
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
