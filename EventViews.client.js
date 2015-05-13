/**
 * Displays the Events to the users.
 */
(function () {
  'use strict';
  
  var Dom = require('dom');
  var Db = require('db');
  var Plugin = require('plugin');
  var Ui = require('ui');
  var Page = require('page');
  
  var Constants = require('Constants')();
  var UserViews = require('UserViews');
  var RoleViews = require('RoleViews');
  
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
        border: '2px solid gray',
        display: 'block',
        padding: '1em',
        margin: '1em',
        fontFamily: 'cursive',
        textAlign: 'left'
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
   * The event view for when someone has died
   */
  function death(event) {
    // first determine how the player was killed
    var murdered;
    var causes = Constants.events.deathCauses;
    switch (event.cause) {
      case causes.LYNCHING:
        murdered = 'lynched';
        break;
      case causes.WEREWOLVES:
        murdered = 'murdered by the werewolves';
        break;
    }
    var role = Db.shared.get('users', event.user, 'role');
    
    // and render the event
    eventView(function () {
      Dom.p(function () {
        Dom.div(function () {
          Dom.style({float: 'right'});
          Ui.avatar(Plugin.userAvatar(event.user));
        });
        
        // And the message
        Dom.p(function () {
          UserViews.name(event.user);
          Dom.text(' has been ' + murdered + ". ");
          Dom.br();
          UserViews.name(event.user);
          Dom.text(' used to be ');
          RoleViews.name(role);
        });
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
        death(event);
        break;
    }
  }
  
  /**
   * Creates a link to an overview
   */
  function overviewLink(votingId) {
    Dom.div(function () {
      Dom.style({
        color: Plugin.colors().highlight,
        textAlign: 'right',
        margin: '.5em'
      });
      
      // on click to the right page
      Dom.on('click', function () {
        Page.nav(['events']);
      });
      
      Dom.text('All events');
    });
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
    
    // and a link to the overview
    overviewLink();
  }
  
  /**
   * Small message that indicates the time for the overview
   */
  function timeMessage(timeString) {
    Dom.div(function () {
      Dom.style({
        display: 'inline-block',
        padding: '4px 6px',
        borderRadius: '5px',
        background: '#bbb'
      });
      Dom.text(timeString);
    });
  }
  
  /**
   * Gives an overview of all the events that happened
   */
  function overview() {
    var eventsDB = Db.shared.get('events');
    
    // getting the times, starting by most recent time
    var times = Object.keys(eventsDB);
    times.reverse();
    
    // and render for each day the time
    Dom.div(function () {
      Dom.style({
        textAlign: 'center',
        marginTop: '1em'
      });
      
      times.forEach(function (time) {
        // show what day it is
        var timeString = time; // using ugly format atm
        timeMessage(timeString);
        
        // display the events
        var events = eventsDB[time];
        events.reverse();
        events.forEach(renderEvent);
      });
    });
  }
  
  exports.recent = recent;
  exports.overview = overview;
  
}());
