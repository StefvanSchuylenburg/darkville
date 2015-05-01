(function () {
  'use strict';
  
  // loading dependencies
  var Dom = require('dom');
  var Form = require('form');
  var Db = require('db');
  var Page = require('page');
  var Ui = require('ui');
  
  var GameTime = require('GameTime');
  var RoleViews = require('RoleViews');
  var VotingViews = require('VotingViews');
  var CitizenViews = require('CitizenViews');
  
  /**
   * Renders the home screen for each user
   */
  function renderHome() {
    
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
      
      VotingViews.lynching(time);
      
      // button to go to the overview of the citizens
      Ui.bigButton(function () {
        Dom.text('List of citizens');
        Dom.on('click', function () {
          // go to citizen overview
          Page.nav(['citizens']);
        });
      });
      
      // display the role
      RoleViews.description(Db.personal.get('role'));
    });
  }
  
  /**
   * The main render method
   */
  exports.render = function () {
    
    // render a page based on the state
    if (Page.state.get(0) === 'voting') {
      // render an overview for a voting
      // TODO: hide the voting the nights for non-werewolves
      var votingId = Page.state.get(1);
      
      if (votingId) { // there is a voting id
        VotingViews.overview(votingId);
      } else {
        // otherwise just go back to the home menu
        Page.nav([]);
      }
    } else if (Page.state.get(0) === 'citizens') {
      // render citizen overview
      CitizenViews.overview();
    } else {
      // no special page: render home page
      renderHome();
    }
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
