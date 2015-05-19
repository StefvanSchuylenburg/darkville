/**
 * Events:
 * Manages the creation and retrieval of the events.
 * Also manages sending notifications based on events.
 */
(function () {
  'use strict';
  
  var Db = require('db');
  var Notifications = require('event');
  var Plugin = require('plugin');
  
  var Constants = require('Constants')();
  
  
  /**
   * Adds the given event for the given time slot.
   */
  function add(time, event) {
    // gets the events from the database
    var arr = Db.shared.get('events', time.timeId);
    if (arr) { // arr is defined
      // add event to arr
      arr.push(event);
    } else { // there is no array yet
      arr = [event];
    }
    
    Db.shared.set('events', time.timeId, arr);
  }
  
  /**
   * Gets the events that happened on the given time.
   */
  function get(time) {
    var arr = Db.shared.get('events', time.timeId);
    if (arr) {
      return arr;
    } else {
      return [];
    }
  }
  
  /**
   * Creates a new event that states the given user died by the given reason
   */
  function death(user, cause) {
    return {
      type: Constants.events.type.DEATH,
      user: user,
      cause: cause
    };
  }
  
  /**
   * Event denoting that a new game has started.
   */
  function newGame() {
    return {type: Constants.events.type.NEW_GAME};
  }
  
  /**
   * Determines whether element e is in array arr.
   * Taken from http://stackoverflow.com/questions/237104/array-containsobj-in-javascript
   */
  function contains(arr, e) {
    var i = arr.length;
    while (i--) {
       if (arr[i] == e) {
           return true;
       }
    }
    return false;
  }
  
  /**
   * Sends the notification for the new day/night.
   * The notification is sent to all alive (or just died) users and includes who has died.
   * @param time - the time that is just became
   */
  function sendNewTimeNotifications(time) {
    // find the name of the new day
    var timeString;
    if (time.isDay) timeString = 'Day ' + time.number;
    else timeString = 'Night ' + time.number;
    
    // find who has died
    var prevTime = time.previous();
    var allEvents = Db.shared.get('events', prevTime.timeId);
    if (!allEvents) allEvents = [];
    var deathEvents = allEvents.filter(function (event) {
      return event.type === Constants.events.type.DEATH;
    });
    var diedUsers = deathEvents.map(function (event) {
      return event.user;
    });
    
    // create message (based on number of users that died)
    var message;
    switch(diedUsers.length) {
      case 0: // no one died
        message = timeString + ' has started!';
        break;
      case 1: // one person died
        message = timeString + ': ' + Plugin.userName(diedUsers[0]) + ' has died';
        break;
      default: // more then one person died
        // getting the died users without the last ones
        var users = diedUsers.slice(0, diedUsers.length - 1);
        var names = users.map(function (user) {
          return Plugin.userName(user);
        });
        
        // the name of the last one
        var last = Plugin.userName(diedUsers[diedUsers.length - 1]);
        
        // and create the message
        message = timeString + ': ' + names.join(', ') + ' and ' + last + ' have died';
        break;
    }
    
    // and send the message
    var sendTo = Plugin.userIds().filter(function (user) {
      return Db.shared.get('users', user, 'isAlive') || contains(diedUsers, user);
    });
    
    Notifications.create({
      text: message,
      unit: 'newTime',
      include: sendTo
    });
  }
  
  exports.add = add;
  exports.get = get;
  exports.death = death;
  exports.newGame = newGame;
  exports.sendNewTimeNotifications = sendNewTimeNotifications;
  
}());
