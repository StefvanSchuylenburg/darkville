/**
 * View for displaying the citizens of the current game and their state.
 */
(function () {
  
  var Dom = require('dom');
  var Ui = require('ui');
  var Db = require('db');
  var Plugin = require('plugin');
  
  var RoleViews = require('RoleViews');
  var UserViews = require('UserViews');
  
  /**
   * Shows the name of the user
   * @WARNING most is copied from VotingViews
   */
  function userName(user, isAlive) {
    Dom.div(function () {
      UserViews.bigName(user);
      
      if (!isAlive) { // the user is not alive
        Dom.style({
          textDecoration: 'line-through',
          color: '#777'
        });
      }
    });
  }
  
  /**
   * Renders an item for one of the citizens.
   * @param userId The id of the user.
   * @param userData the object containing the state of the user
   */
  function citizenItem(userId, userData) {
    Ui.item(function () {
      // the user
      Ui.avatar(Plugin.userAvatar(userId));
      userName(userId, userData.isAlive);
      
      
      // add role when the user is dead
      if (!userData.isAlive) {
        Dom.span(function () {
          Dom.style({
            margin: '1em',
            color: '#AAA'
          });
          Dom.text(' was a ');
        });
        
        Dom.h2(function () {
          RoleViews.name(userData.role);
        });
      }
    });
  }
  
  /**
   * Renders the overview containing all the citizens and their state
   */
  function overview() {
    var users = Db.shared.get('users');
    
    Ui.list(function () {
      // rendering the items
      for (var user in users) {
        if (users.hasOwnProperty(user)) {
          citizenItem(user, users[user]);
        }
      }
    });
  }
  
  /**
   * An overview containing a list of citizens and their state.
   */
  exports.overview = overview;
  
}());
