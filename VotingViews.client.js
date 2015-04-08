/**
 * This file holds views to represent the voting procedure and to allow
 * the users to vote.
 */
(function () {
  
  var Dom = require('dom');
  var Plugin = require('plugin');
  var Modal = require('modal');
  var Ui = require('ui');
  var Db = require('db');
  var Server = require('server');
  var Obs = require('obs');
  
  /**
   * A pop-up like menu to choose a user to vote on.
   * @param users the users to vote for
   * @param an observer holding what currently is selected
   * @param callback for who is voted on
   */
  function voteModal(users, selected, onVote) {
    Modal.show('Vote for', function () {
      Dom.style({width: '80%'});
      
      // the panel with the content
      Dom.div(function () {
        Dom.style({
          maxHeight: '40%',
          overflow: 'auto',
          _overflowScrolling: 'touch',
          backgroundColor: '#eee',
          margin: '-12px'
        });
        
        // showing the users
        Obs.observe(function () {
          var selectedGet = selected.get();
          
          users.forEach(function (user) {
            Ui.item(function () {
              Ui.avatar(Plugin.userAvatar(user));
              Dom.text(Plugin.userName(user));
              
              // making the selected vote appear different
              if (user === selectedGet) {
                Dom.style({fontWeight: 'bold'});
                
                Dom.div(function () {
                  Dom.style({
                    flex: 1,
                    padding: '0 10px',
                    textAlign: 'right',
                    fontSize: '150%',
                    color: Plugin.colors().highlight
                  });
                  Dom.text('✓');
                });
              }
              
              // handling tap event
              Dom.onTap(function () {
                onVote(user);
                Modal.remove();
              });
            });
          });
        });
        
      });
    });
  }
  
  /**
   * Gets the users that are still alive.
   */
  function livingUsers() {
    // an object containing the users, with their id as key
    var users = Db.shared.ref('users').get();
    
    // the users that are alive
    var alive = Object.keys(users).filter(function (user) {
      return users[user].isAlive;
    });
    
    // cast back to int (the Object.keys always returns strings)
    return alive.map(function (user) {
      return parseInt(user, 10);
    });
  }
  
  /**
   * Button that allows you to vote.
   */
  function voteButton(votingId) {
    
    // observer for who is voted on
    var selected = Db.shared.ref('votings').get(votingId, Plugin.userId());
    var selectedObs = Obs.create(selected);
    
    // callback used for voteModal
    function vote(user) {
      selectedObs.set(user);
      Server.call('vote', votingId, user);
    }
    // the user we can vote on
    var users = livingUsers();
    
    // the button
    Ui.button('Vote', voteModal.bind(this, users, selectedObs, vote));
  }
  
  /**
   * A button that looks like a vote button, but which is disabled.
   */
  function disabledVoteButton() {
    Dom.div(function () {
      Dom.style({'background-color': '#A88698'});
      Dom.cls('button');
      Dom.text('Vote');
    });
  }
  
  
  /**
   * A small wrapper used for the lynching and werewolf voting view.
   * At the moment only adds some minor css
   */
  function voteView(header, content) {
    Dom.div(function () {
      Dom.style({
        border: '3px solid ' + Plugin.colors().highlight,
        display: 'block',
        padding: '1em',
        margin: '1em'
      });
      
      // the header
      Dom.h3(function () {
        Dom.style({
          color: Plugin.colors().highlight
        });
        Dom.text(header);
      });
      
      content();
    });
  }
  
  /**
   * A view for the voting involved for the lynching.
   * @param time the game time used for this game.
   */
  function lynching(time) {
    var now = new Date();
    var isAlive = Db.shared.get('users', Plugin.userId(), 'isAlive');
    // the id of the the current voting or the previous one
    var votingId = 'day' + time.getNumber(now);
    
    voteView('Lynching', function () {
      Dom.p(
        'During the day you can vote here. ' +
        'Who gets the the most votes will be killed. ' +
        'Use this voting to kill the werewolves during the day. '
      );
      
      // can we vote?
      if (time.isDay(now) && isAlive) {
        // we can vote
        voteButton(votingId);
      } else {
        // we can not vote
        
        // show message why
        Dom.p(function () {
          Dom.style({color: 'red'});
          
          if (!isAlive) Dom.text('You are dead; you can no longer vote!');
          else if (!time.isDay(now)) Dom.text('You can only vote during the day.');
        });
      }
      
      // TODO: show who you have voted for
        
    });
  }
  
  exports.lynching = lynching;
  
  
}());
