(function () {
  'use strict';
  
  // loading dependencies
  var Plugin = require('plugin');
  var Db = require('db');
  var Timer = require('timer');
  
  var Constants = require('Constants')();
  var GameTime = require('GameTime');
  var Events = require('Events');
  
  // variables
  
  // the current GameTime (is updated on restart)
  var gameTime = GameTime.startingOn(Db.shared.get('time', 'start'));
  
  /**
   * + Jonas Raoni Soares Silva
   * @ http://jsfromhell.com/array/shuffle [v1.0]
   */
  function shuffle(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  }
  
  /**
   * Clears the dabatase by setting all values to 0
   */
  function dbClear() {
    // reset the shared values
    Db.shared.set(null);
    // reset the personal values (for all the current users)
    Plugin.userIds().forEach(function (user) {
      Db.personal(user).set(null);
    });
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
   * Determines whether the given user is protected by a Guardian.
   * @param protectedUser the user who should be protected
   * @param time when the user is protected
   */
  function isProtected(protectedUser, time) {
    var users = Plugin.userIds();
    
    // find someone protecting the user
    var guardians = users.filter(function (user) {
      var obj = Db.personal(user).get();
      if (obj.role === Constants.roles.GUARDIAN && obj.protect) {
        // we have a guardian that is protecting someone
        return obj.protect[time.timeId] == protectedUser;
      } else {
        // nope, he can not protect him.
        return false;
      }
    });
    
    // there are guardians that are protecting the user
    return guardians.length > 0;
  }
  
  /**
   * Determines whether the given user is alive.
   * This is used in filters to find the correct users
   */
  function isAlive(user) {
    return Db.shared.get('users', user, 'isAlive');
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
  function kill(user, time, cause) {
    Db.shared.set('users', user, {
      isAlive: false,
      role: Db.personal(user).get('role')
    });
    
    // create event
    var event = Events.death(user, cause);
    Events.add(time, event);
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
        var voteFor = voting[user];
        
        if (voteFor) { // user has voted for someone
          if (votes[voteFor]) { // votes[voteFor] is defined (and atleast 1)
            votes['' + voteFor]++;
          } else { // not yet defined
            votes['' + voteFor] = 1;
          }
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
      var maxUsers = Object.keys(votes).filter(function (user) {
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
      Db.shared.set('votings', votingId, user, 0);
    });
  }
  
  /**
   * Closes the previous night and starts the new day.
   * @param number the current number of the day that just started
   */
  function startDay(time) {
    // message about the start of the day
    log('Starting day ', time.number);
    
    if (time.number === 0) { // no voting on day 0
      Events.add(time, Events.newGame()); // create event for first day
    } else {
      // kill the player voted for by the werewolves
      var prevTime = gameTime.previous(time);
      var target = mostVotes(prevTime.timeId);
      
      if (target && !isProtected(target, prevTime)) {
        // there is a target selected that is not protected
        kill(target, prevTime, Constants.events.deathCauses.WEREWOLVES);
      }
      
      // start a new vote
      var votingId = time.timeId;
      var users = Plugin.userIds().filter(isAlive);
      createVoting(votingId, users);
    }
    
  }
  
  /**
   * Closes the day and starts the night.
   * @param number the current number of the day
   */
  function startNight(time) {
    // message about start of the night
    log('Starting night ', time.number);
    
    if (time.number > 0) { // if there was a day before, then finish the lynching
      // kill the player voted for (if there has been voted)
      var prevTime = gameTime.previous(time);
      var target = mostVotes(prevTime.timeId);
      if (target) {
        kill(target, prevTime, Constants.events.deathCauses.LYNCHING);
      }
    }
    
    // start a new vote
    var votingId = time.timeId;
    var werewolves = usersWithRole(Constants.roles.WEREWOLF);
    createVoting(votingId, werewolves.filter(isAlive));
  }
  
  /**
   * Will be called when the day changes from night to day.
   * (or when a new game has been started)
   * @param the game time it was the last time this function was called
   * @param startTime the time on which this game has started.
   *  This is used to identify that the onTimeChanged is still used for the current game.
   *  (Because Timer.cancel has hard time working when using arguments...)
   */
  function onTimeChanged(lastTime, startTime) {
    if (startTime === Db.shared.get('time', 'start')) { // this is the current game
      // getting the time
      var now = new Date();
      var time = gameTime.getTime(now);
      
      // starting new timer
      var nextChange = time.nextChange;
      var delay = nextChange.getTime() - now.getTime();
      
      Timer.set(delay, 'onTimeChanged', [time, startTime]);
      
      // update time in the database
      Db.shared.set('time', 'gameTime', time);
      
      // calling startDay/startNight (only when the time is different)
      if (!lastTime || lastTime.timeId !== time.timeId) {
        // the time is different
        // anounce the start of the day/night
        if (time.isDay) {
          startDay(time);
        } else {
          startNight(time);
        }
        
        // and send the notifications
        Events.sendNewTimeNotifications(time);
      }
    }
  }
  
  /**
   * Starts a new game with the given configuration.
   * THis will destroy the current game (if there is any).
   */
  function restart(config) {
    // destroy old game
    dbClear();
    
    // start new game
    var users = Plugin.userIds();
    
    // saving each player in the players list
    users.forEach(function (user) {
      Db.shared.set('users', '' + user, {
        isAlive: true
      });
    });
    
    // the roles to select
    var selectRoles = {};
    selectRoles[Constants.roles.WEREWOLF] = config.nWerewolf;
    selectRoles[Constants.roles.SEER] = config.nSeer;
    selectRoles[Constants.roles.GUARDIAN] = config.nGuardian;
    
    // the roles for the users
    var userRoles = generateRoles(selectRoles, users);
    
    // save the roles
    users.forEach(function (user) {
      var role = userRoles['' + user];
      Db.personal(user).set('role', role);
    });
    
    // setting up the time
    var now = Date.now();
    Db.shared.set('time', {
      start: now
    });
    
    // starting the timer and init the game time
    gameTime = GameTime.startingOn(now);
    var time = gameTime.getTime(new Date());
    
    // start the first day and the timer for the following day/nights
    var day0Time = {
      isDay: true,
      isNight: false,
      number: 0,
      nextChange: time.nextChange,
      timeId: 'day0'
    };
    startDay(day0Time);
    onTimeChanged(day0Time, now);
    
    // and update the time value in the database
    Db.shared.set('time', 'gameTime', time);
    
    log('The game has been restarted');
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
    var voting = Db.shared.get('votings', votingId);
    if (voting.hasOwnProperty(currentUser)) {
      // the current user is allowed to vote
      
      // and voting!
      var intVote = parseInt(vote, 10);
      Db.shared.set('votings', votingId, currentUser, intVote);
    }
  };
  
  /**
   * Makes the role of the given visible for the seer.
   * The investigation will be updated in the database and the
   * seer can view in the database what the role was of his selected user.
   * This may only be selected once a night and only when the sender is
   * a seer and is alive.
   */
  exports.client_investigateRole = function (user) {
    var time = gameTime.getTime(new Date());
    // the user that requested the investigate
    var sender = Plugin.userId();
    var isSeer = Db.personal(sender).get('role') === Constants.roles.SEER;
    
    // check whether he has investigated yet
    var investigated = Db.personal(sender).get('investigate', time.timeId);
    
    if (/*time.isNight && */isSeer && !investigated) { // the user may ask for the role
      // get the role from the user
      var role = Db.personal(user).get('role');
      
      // mark as investigated and sent reply
      Db.personal(sender).set('investigate', time.timeId, {
        user: user,
        role: role
      });
    }
    
  };
  
  /**
   * Set the protection of the sender to the given user.
   * The protection will be updated in the dabase and the selected user
   * can not die by werewolf attacks.
   * This will only work when the sender is a Guardian and the protection is allowed at this moment.
   */
  exports.client_protect = function(user) {
    var time = gameTime.getTime(new Date());
    // the user that wants to protect
    var sender = Plugin.userId();
    var isGuardian = Db.personal(sender).get('role') === Constants.roles.GUARDIAN;
    
    // check who he has protected the previous night
    var prevNight = time.previous().previous();
    var prevProtect = Db.personal(sender).get('protect', prevNight.timeId);
    
    if (time.isNight && isGuardian && prevProtect !== user) { // lets protect
      Db.personal(sender).set('protect', time.timeId, user);
    }
  };
  
}());
