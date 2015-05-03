/**
 * Views to show a description and access to the role of the player.
 */
(function () {
  
  var Dom = require('dom');
  var Plugin = require('plugin');
  var Ui = require('ui');
  var Db = require('db');
  var Modal = require('modal');
  
  var Constants = require('Constants')();
  var VotingViews = require('VotingViews');
  var UserModal = require('SelectUserModal');
  var UserViews = require('UserViews');
  
  /**
   * Gives a description of a role.
   * @param name the name of the role
   * @param icon the name of the uri
   * @param content the content to display in the description as function using dom.
   */
  function description(name, icon, content) {
    // the main color theme to use
    var color = '#ba1a6e';
    
    Dom.div(function () {
      Dom.cls('role-description');
      Dom.style({
        border: '3px solid ' + color,
        display: 'block',
        padding: '1em',
        margin: '1em'
      });
      
      // the header
      Dom.div(function () {
        Dom.h3(function () {
          Dom.style({
            color: color
          });
          Dom.span(function () {
            Dom.img(function () {
              Dom.prop('src', Plugin.resourceUri(icon));
            });
          });
          Dom.text(name);
        });
      });
      
      // the content
      Dom.div(function () {
        content();
      });
    });
  }
  
  function seer(time) {
    /**
     * Shows the role of the user in a separated modal.
     */
    function investigate(user) {
      Modal.show('Investigate ', function () {
        Dom.style({maxWidth: '80%'});
        Dom.div(function () {
          Ui.item(function () {
            Ui.avatar(Plugin.userAvatar(user));
            UserViews.name(user);
            
            Dom.span(" is a ");
            
            Dom.span("TEST");
          });
        });
        
        
      });
    }
    
    description('Seer', 'seer.png', function () {
      Dom.div(function () {
        Dom.p(
          'You are a seer. ' +
          'You can see straight through how people appear ' +
          'to discover who they really are. ' +
          'Each night you can investigate one person to find their true role.'
        );
        Dom.p(
          'You win when all the werewolves are dead.'
        );
        
        // section to activate the seer power
        Dom.div(function () {
          Dom.style({
            'background-color': 'white',
            'box-shadow': '0 2px rgba(0,0,0,.1)',
            display: 'block',
            padding: '1em'
          });
          
          // the investigate button
          var isAlive = Db.shared.get('users', Plugin.userId(), 'isAlive');
          if (time.isNight && isAlive) {
            // get the users that are still alive
            var users = Object.keys(Db.shared.get('users'));
            var aliveUsers = users.filter(function (user) {
              return Db.shared.get('users', user, 'isAlive');
            });
            
            Ui.bigButton('Investigate', UserModal.bind(this, aliveUsers, 'Investigate', null, investigate));
          } else { // we can not vote
            
            // reason why we can not vote
            Dom.div(function () {
              Dom.style({color: 'red'});
              if (time.isDay) Dom.text('You can only investigate people during the night.');
              else if (!isAlive) Dom.text('You are dead; your seer power is useless now!');
            });
            
            Dom.div(function () {
              Dom.style({'background-color': '#A88698'});
              Dom.cls('big-button');
              Dom.text('Investigate');
            });
          }
        });
      });
    });
  }
  
  function werewolf(time) {
    
    description('Werewolf', 'wolf.png', function () {
      Dom.div(function () {
        Dom.p(
          'You are a werewolf. ' +
          'Together with the other werewolves you gather ' +
          'each night to kill one of the citizens.'
        );
        Dom.p(
          'You win when there are only werewolves left in the village.'
        );
      });
      
      // show the voting for werewolves
      VotingViews.werewolves(time);
    });
  }
  
  function citizen() {
    description('Citizen', 'citizen.png', function () {
      Dom.div(function () {
        Dom.p(
          'You are an innocent citizen.' +
          'You try to protect the village by revealing ' +
          'the werewolves and lynching them.'
        );
        Dom.p(
          'You win when all the werewolves are dead.'
        );
      });
    });
  }
  
  /**
   * Gives a description view of the given role.
   * @param time the current game time
   */
  function descriptionOf(role, time) {
    // get a description based on the role
    switch(role) {
      case Constants.roles.CITIZEN:
        citizen();
        break;
      case Constants.roles.WEREWOLF:
        werewolf(time);
        break;
      case Constants.roles.SEER:
        seer(time);
        break;
    }
  }
  
  /**
   * A view giving a description and access to the given role.
   */
  exports.description = descriptionOf;
  
}());
