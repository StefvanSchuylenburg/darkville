/**
 * This file holds views to represent the voting procedure and to allow
 * the users to vote.
 */
(function () {
  
  var Dom = require('dom');
  var Plugin = require('plugin');
  var Ui = require('ui');
  var Db = require('db');
  var Server = require('server');
  var Obs = require('obs');
  var Page = require('page');
  
  var UserModal = require('SelectUserModal');
  var UserViews = require('UserViews');
  
  /**
   * Button that allows you to vote.
   */
  function voteButton(votingId) {
    
    // observer for who is voted on
    var selected = Db.shared.ref('votings').get(votingId, Plugin.userId());
    var selectedObs = Obs.create(selected);
    
    // callback used for userModal
    function vote(user) {
      selectedObs.set(user);
      Server.call('vote', votingId, user);
    }
    // the user we can vote on
    var users = UserViews.getUsers({isAlive: true});
    
    // the button
    Ui.bigButton('Vote', UserModal.bind(this, users, 'Vote for', selectedObs, vote));
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
  function voteView(content) {
    Dom.div(function () {
      Dom.style({
        'background-color': 'white',
        'box-shadow': '0 2px rgba(0,0,0,.1)',
        display: 'block',
        padding: '1em'
      });
      
      // the header
      Dom.h3('Voting');
      
      content();
    });
  }
  
  /**
   * Creates a link to an overview
   */
  function overviewLink(votingId) {
    Dom.div(function () {
      Dom.style({
        color: Plugin.colors().highlight,
        'text-align': 'right'
      });
      
      // on click to the right page
      Dom.on('click', function () {
        Page.nav(['voting', votingId]);
      });
      
      Dom.text('View votes');
    });
  }
  
  /**
   * A view for the voting involved for the lynching.
   * @param time the current gametime
   */
  function lynching(time) {
    var isAlive = Db.shared.get('users', Plugin.userId(), 'isAlive');
    // the id of the the current voting or the previous one
    var number = time.number;
    var votingId = 'day' + number;
    
    voteView(function () {
      Dom.p(
        'During the day you can vote here. ' +
        'Who gets the the most votes will be killed. ' +
        'Use this voting to kill the werewolves during the day. '
      );
      
      // can we vote?
      if (time.isDay && isAlive && number > 0) {
        // we can vote
        voteButton(votingId);
      } else {
        // we can not vote
        
        // show message why
        Dom.p(function () {
          Dom.style({color: 'red'});
          
          if (!isAlive) Dom.text('You are dead; you can no longer vote!');
          else if (!time.isDay) Dom.text('You can only vote during the day.');
          else if (number > 0) Dom.text('There is no voting on the first day.');
        });
        
        // disabled button
        disabledVoteButton();
      }
      
      // link to the vote overview
      if (number > 0) { // when there is a voting
        overviewLink(votingId);
      }
    });
  }
  
  /**
   * A view for the voting done by the werewolves.
   */
  function werewolves(time) {
    // TODO: still a lot is a duplicate of lynching, require clean-up
    var isAlive = Db.shared.get('users', Plugin.userId(), 'isAlive');
    // the id of the the current voting or the previous one
    var votingId = 'night' + (time.number - time.isDay);
    
    voteView(function() {
      Dom.p(
        'Vote here to kill the stupid citizens. '
      );
      if (time.isNight && isAlive) { // we can vote
        voteButton(votingId);
      } else { // we can not vote
        // show message why
        Dom.p(function () {
          Dom.style({color: 'red'});
          if (!isAlive) Dom.text('You are dead; you can no longer vote!');
          else if (!time.isNight) Dom.text('You can only vote during the night');
        });
        disabledVoteButton();
      }
      
      // link to vote overview
      if (time.number > 0 || time.isNight) { // the first voting has started
        overviewLink(votingId);
      }
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
        UserViews.bigName(userId);
        
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
          UserViews.bigName(vote);
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
  exports.werewolves = werewolves;
  
  exports.overview = overview;
  
}());
