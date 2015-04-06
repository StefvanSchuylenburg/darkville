(function () {
  'use strict';
  
  // loading dependencies
  var Plugin = require('plugin');
  var Db = require('db');
  
  var Constants = require('Constants')();
  var GameTime = requrie('GameTime');
  
  // variables
  
  // the current GameTime (is updated on restart)
  var time;
  
  // timeout used for when the time changes
  var timeChangeTimeout;
  
  /**
   * + Jonas Raoni Soares Silva
   * @ http://jsfromhell.com/array/shuffle [v1.0]
   */
  function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  }
  
  /**
   * Creates a mapping of the userids to a role.
   * @param roles an object containing what roles should be added.
   *            each key should represent a role and the value how many of those
   *            roles. (if not enough roles, than we add normal citizens).
   * @param users the id of the users to assign roles to.
   */
  function generateRoles(roles, users) {
    
    // an array containing all the roles we want to add
    var roleArray = [];
    // index used for looping
    var i;
    
    // adding all the roles
    for (var role in roles) {
      if (roles.hasOwnProperty(role)) {
        // add the role
        for (i = 0; i < roles[role]; i++) {
          roleArray.push(role);
        }
      }
    }
    
    // add the missing roles
    for (i = roleArray.length; i < users.length; i++) {
      // add a citizen
      roleArray.push(Constants.roles.CITIZEN);
    }
    
    // shuffle the array
    shuffle(roleArray);
    
    // the result object (mapping from user -> role)
    var result = {};
    for (i = 0; i < users.length; i++) {
      result[users[i]] = roleArray[i];
    }
    
    return result;
  }
  
  /**
   * Closes the previous night and starts the new day.
   * @param number the current number of the day that just started
   */
  function startDay(number) {
    
  }
  
  /**
   * Closes the day and starts the night.
   * @param number the current number of the day
   */
  function startNight(number) {
    
  }
  
  /**
   * Will be called when the day changes from night to day.
   * (or when a new game has been started)
   */
  function onTimeChanged() {
    // getting the time
    var now = new Date();
    
    // starting new timer
    var nextChange = time.getNextChange(now);
    var delay = nextChange.getTime() - now.getTime();
    timeChangeTimeout = setTimeout(onTimeChanged, delay);
    
    // calling startDay/startNight
    var number = time.getNumber(now);
    if (time.isDay(now)) {
      startDay(number);
    } else {
      startNight(number);
    }
  }
  
  /**
   * Starts a new game with the given configuration.
   * THis will destroy the current game (if there is any).
   */
  function restart(config) {
    // destroy old game
    if (timeChangeTimeout) {
      clearTimeout(timeChangeTimeout);
    }
    
    // start new game
    var users = Plugin.userIds();
    
    // the roles to select
    var selectRoles = {};
    selectRoles[Constants.roles.WEREWOLF] = config.nWerewolf;
    
    // the roles for the users
    var userRoles = generateRoles(selectRoles, users);
    
    // save the roles
    users.forEach(function (user) {
      var role = userRoles['' + user];
      Db.personal(user).set('role', role);
    });
    
    // setting up the time
    var now = Date.now();
    Db.shared.ref('time').set({
    });
    
    // starting the timer and init the game time
    time = GameTime.startingOn(now);
    onTimeChanged();
  }
  
  /**
   * Handles the installation of the application in a Happening group.
   */
  exports.onInstall = function (config) {
    restart(config);
  };
  
  /**
   * Updates the settings for this game
   */
  exports.onConfig = function (config) {
    if (config.restart) { // restart the game
      restart(config);
    }
  };
  
}());
