/**
 * Contains utility methods to display properties of the user.
 */
(function () {
  'use strict';
  
  var Dom = require('dom');
  var Plugin = require('plugin');
  var Db = require('db');
    
  /**
   * Shows the name of the user
   */
  function name(user) {
    Dom.span(function () {
      Dom.style({
        textTransform: 'initial',
        color: '#888',
        fontWeight: 'bold'
      });
      
      Dom.text(Plugin.userName(user));
    });
  }
  
  /**
   * All the users playing in the game.
   * The users can be filtered here.
   * @param filters object to set properties for the users:
   *            isAlive - only alive users.
   */
  function getUsers(filters) {
    var users = Object.keys(Db.shared.get('users'));
    
    // removing the users based on the filters
    if (filters.isAlive) {
      users = users.filter(function (user) {
        return Db.shared.get('users', user, 'isAlive');
      });
    }
    
    return users;
  }
  
  exports.name = name;
  exports.getUsers = getUsers;
  
}());
