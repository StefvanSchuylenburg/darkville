(function () {
  'use strict';
  
  // loading dependencies
  var Plugin = require('plugin');
  var Db = require('db');
  var Timer = require('timer');
  
  var Constants = require('Constants')();
  var GameTime = require('GameTime');
  
  // variables
  
  // the current GameTime (is updated on restart)
  var time = GameTime.startingOn(Db.shared.get('time', 'start'));
  
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
   * Gets all the users with the given role.
   */
  function usersWithRole(role) {
    var users = Plugin.userIds();
    return users.filter(function (user) {
      return Db.personal(user).get('role') === role;
    });
  }
  
  /**
   * Creates a new voting with the given votingId.
   * For this voting there is an entry prepared for users
   */
  function createVoting(votingId, users) {
    users.forEach(function (user) {
      Db.shared.ref('votings').set(votingId, user, 0);
    });
  }
  
  /**
   * Closes the previous night and starts the new day.
   * @param number the current number of the day that just started
   */
  function startDay(number) {
    // start a new vote
    var votingId = 'day' + number;
    createVoting(votingId, Plugin.userIds());
  }
  
  /**
   * Closes the day and starts the night.
   * @param number the current number of the day
   */
  function startNight(number) {
    // start a new vote
    var votingId = 'night' + number;
    var werewolves = usersWithRole(Constants.roles.WEREWOLF);
    createVoting(votingId, werewolves);
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
    Timer.set(delay, 'onTimeChanged');
    
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
    Timer.cancel('onTimeChanged');
    
    // start new game
    var users = Plugin.userIds();
    
    // saving each player in the players list
    users.forEach(function (user) {
      Db.shared.ref('users').set('' + user, {
        isAlive: true
      });
    });
    
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
      start: now
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
  
  exports.onTimeChanged = onTimeChanged;
  
  /* The rpc calls */
  
  /**
   * Votes at the voting for the given user.
   * @param votingId the id of the voting you want to vote on
   * @param vote the user to vote for
   */
  exports.client_vote = function (votingId, vote) {
    // the user that is trying to vote
    var currentUser = Plugin.userId();
    
    // verify whether the user is allowed to vote for this
    var voting = Db.shared.ref('votings').get(votingId);
    if (voting.hasOwnProperty(currentUser)) {
      // the current user is allowed to vote
      
      // and voting!
      Db.shared.ref('votings').set(votingId, currentUser, vote);
    }
  };
  
}());
