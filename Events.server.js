/**
 * Events:
 * Manages the creation and retrieval of the events.
 * Also manages sending notifications based on events.
 */
(function () {
  'use strict';
  
  var Db = require('db');
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
  
  exports.add = add;
  exports.get = get;
  exports.death = death;
  exports.newGame = newGame;
  
}());
