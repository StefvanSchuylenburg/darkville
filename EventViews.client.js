/**
 * Displays the Events to the users.
 */
(function () {
  'use strict';
  
  var Dom = require('dom');
  var Db = require('db');
  
  var Constants = require('Constants')();
  
  /**
   * Gets the timeId of the time just before the given time.
   */
  function prevTimeId(time) {
    var dayNight = time.isDay? 'night': 'day';
    var number = time.number - time.isDay;
    return dayNight + number;
  }
  
  /**
   * Generic function for rendering events.
   * @param content what to render within the event view
   */
  function eventView(content) {
    Dom.div(function () {
      Dom.cls('eventView');
      Dom.style({
        backgroundColor: 'lightgray',
        border: '3px solid gray',
        display: 'block',
        padding: '1em',
        margin: '1em',
        fontFamily: 'cursive'
      });
      
      content();
    });
  }
  
  /**
   * The event view for a new game
   */
  function newGame() {
    eventView(function () {
      Dom.p(function () {
        Dom.text('Welcome to ');
        Dom.b('Darkville');
        Dom.text('! ');
        Dom.text('Darkville used to be a peaceful village until the werewolves turned up. ');
        Dom.text('Now the werewolves come each night to kill one of the innocent villagers of Darkville. ');
        Dom.text('To make things worse we know that some among us are the werewolves! ');
        Dom.text('Even you may be a werewolf! ');
      });
      Dom.p(function () {
        Dom.text('Tonight the werewolves will strike again. ');
        Dom.text('But tomorrow it is time for us as the villagers of Darkville to ');
        Dom.text('take those werewolves down by our democratic lynching system! ');
      });
    });
  }
  
  /**
   * Renders a single event.
   */
  function renderEvent(event) {
    switch (event.type) {
      case Constants.events.type.NEW_GAME:
        newGame();
        break;
      case Constants.events.type.DEATH:
        // TODO
        break;
    }
  }
  
  /**
   * The main Event view.
   * Renders a few recent events and gives a link to the overview.
   */
  function recent(time) {
    // getting the events of the current and previous moment
    var eventsNow = Db.shared.get('events', time.timeId);
    var eventsPrev = Db.shared.get('events', prevTimeId(time));
    
    // catch null
    if (!eventsNow) eventsNow = [];
    if (!eventsPrev) eventsPrev = [];
    
    // combine and reverse
    var events  = eventsPrev.concat(eventsNow);
    events.reverse();
    
    // now render!
    events.forEach(function (event) {
      renderEvent(event);
    });
  }
  
  exports.recent = recent;
  
}());
