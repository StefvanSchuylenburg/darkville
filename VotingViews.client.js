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
  var Page = require('page');
  
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
    Ui.bigButton('Vote', voteModal.bind(this, users, selectedObs, vote));
  }
  
  /**
   * A button that looks like a vote button, but which is disabled.
   */
  function disabledVoteButton() {
    Dom.div(function () {
      Dom.style({'background-color': '#A88698'});
      Dom.cls('big-button');
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
        'background-color': 'white',
        'box-shadow': '0 2px rgba(0,0,0,.1)',
        display: 'block',
        padding: '1em'
      });
      
      // the header
      Dom.h3(header);
      
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
        
        // disabled button
        disabledVoteButton();
      }
      
      // link to the vote overview
      Dom.div(function () {
        Dom.style({
          color: Plugin.colors().highlight,
          'text-align': 'right'
        });
        
        // on click to the right page
        Dom.on('click', function () {
          Page.nav(['voting', votingId]);
        });
        
        Dom.i(function () {
          Dom.cls('fa fa-angle-double-right');
        });
        Dom.text('View votes');
      });
    
    });
  }
  
  /**
   * Shows the name of the user
   */
  function userName(user) {
    Dom.h2(function () {
      Dom.style({
        borderBottomStyle: 'none',
        textTransform: 'initial',
        margin: '4px'
      });
      
      Dom.text(Plugin.userName(user));
    });
  }
  
  /**
   * Shows where the given user voted for.
   * The html object will be a <tr> element
   * (Will do nothing if the user does not participate in the voting.)
   * @param voting the voting object as stored in the database
   * @param user the user who has voted
   */
  function voteEntry(voting, user) {
    if (voting.hasOwnProperty(user)) { // the user has a vote entry
      var vote = voting[user];
      var userId = parseInt(user, 10);
      
      // the dom element
      Ui.item(function () {
        
        // the user
        Ui.avatar(Plugin.userAvatar(userId));
        userName(userId);
        
        // check whether he has voted
        if (vote) {
          // small message saying he has voted
          Dom.div(function () {
            Dom.style({
              margin: '1em',
              color: '#AAA'
            });
            Dom.text('has voted for');
          });
          
          // the player voted on
          userName(vote);
          Ui.avatar(Plugin.userAvatar(vote));
        } else {
          // small message saying he has not voted yet
          Dom.div(function () {
            Dom.style({
              margin: '1em',
              color: '#AAA'
            });
            Dom.text(' has not voted yet ');
          });
        }
      });
    }
  }
  
  /**
   * Gives an overview for a voting.
   * An overview contains a list of who votes for who.
   */
  function overview(votingId) {
    var voting = Db.shared.get('votings', votingId);
    var voters = Object.keys(voting);
    
    Dom.style({marginTop: '20px'});
    
    // construct a table where each vote is shown
    Ui.list(function () {
      // show an entry for each of the voters
      voters.forEach(function (voter) {
        voteEntry(voting, voter);
      });
    });
  }
  
  
  exports.lynching = lynching;
  
  exports.overview = overview;
  
}());
