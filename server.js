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
   * Kills the given user.
   * The user is no longer alive and his role will be exposed.
   */
  function kill(user) {
    Db.shared.set('users', user, {
      isAlive: false,
      role: Db.personal(user).get('role')
    });
  }
  
  /**
   * Gets the player who has the most votes in the voting with the given id.
   * If multiple players have the same number of votes, then one will be picked
   * randomly.
   * Returns null when no one has voted.
   */
  function mostVotes(votingId) {
    var voting = Db.shared.get('votings', votingId);
    
    // count the votes for each player
    var votes = {};
    
    // counting the votes
    for (var user in voting) {
      if (voting.hasOwnProperty(user)) {
        var voteFor = '' + voting[user];
        
        if (votes[voteFor]) { // votes[voteFor] is defined (and atleast 1)
          votes[voteFor]++;
        } else { // not yet defined
          votes[voteFor] = 1;
        }
      }
    }
    
    // get the max number of votes
    var values = Object.keys(votes).map(function (user) {
      return votes[user];
    });
    var max = Math.max.apply(null, values);
    
    if (max) { // there has been voted
      // get the users that have the max number of votes
      var maxUsers = Object.keys(voting).filter(function (user) {
        return votes[user] === max;
      });
      
      // take on randomly from the maxUsers
      var r = Math.floor(Math.random() * maxUsers.length);
      return maxUsers[r];
    } else { // no one has voted
      return null;
    }
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
    if (number === 0) { // no voting on day 0
      // TODO: send some message about first day and welcome and stuff
    } else {
      // kill the player voted for by the werewolves
      var target = mostVotes('night' + (number - 1));
      if (target) kill(target);
      
      // start a new vote
      var votingId = 'day' + number;
      createVoting(votingId, Plugin.userIds());
    }
    
  }
  
  /**
   * Closes the day and starts the night.
   * @param number the current number of the day
   */
  function startNight(number) {
    if (number > 0) { // if there was a day before, then finish the lynching
      // kill the player voted for (if there has been voted)
      var target = mostVotes('day' + number);
      if (target) kill(target);
    }
    
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
