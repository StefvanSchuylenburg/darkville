/**
 * Views to show a description and access to the role of the player.
 */
(function () {
  
  var Dom = require('dom');
  var Plugin = require('plugin');
  var Ui = require('ui');
  var Db = require('db');
  var Modal = require('modal');
  var Server = require('server');
  var Obs = require('obs');
  
  var Constants = require('Constants')();
  var VotingViews = require('VotingViews');
  var UserModal = require('SelectUserModal');
  var UserViews = require('UserViews');
  
  /**
   * A box as used for containing the possible abilities/actions.
   * Similar to the box used for voting.
   * @param content the content for within the box.
   */
  function actionBox(content) {
    Dom.div(function () {
      Dom.style({
        'background-color': 'white',
        'box-shadow': '0 2px rgba(0,0,0,.1)',
        display: 'block',
        padding: '1em'
      });
      
      content();
    });
  }
  
  /**
   * A button that is not usable.
   * @param text the text on the button
   */
  function disabledButton(text) {
    Dom.div(function () {
      Dom.style({'background-color': '#A88698'});
      Dom.cls('big-button');
      Dom.text(text);
    });
  }
  
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
  
  function guardian(time) {
    
    /** Makes rpc call to protect the given user */
    function protect(user) {
      Server.call('protect', user);
    }
    
    description('Guardian', 'shield.png', function () {
      Dom.div(function () {
        Dom.p(
          'You are a guardian, protector of the innocent. ' +
          'Each night you can secretely protect one of the citizens ' +
          'from the gruesome deeds of the werewolves.'
        );
        Dom.p(
          'You win when all the werewolves are dead.'
        );
      });
      
      actionBox(function () {
        
        // the text section
        Dom.h3('Protect');
        Dom.p(
          'Select the citizen you want to protect. ' +
          'You can not protect a single citizen twice in a row.'
        );
        
        // the button
        var isAlive = Db.shared.get('users', Plugin.userId(), 'isAlive');
        if (time.isNight && isAlive) { // when can protect
          
          // get the users that are still alive
          var users = UserViews.getUsers({isAlive: true});
          // the user that we protected last time
          var prevProtect = Db.personal.get('protect', 'night' + (time.number - 1));
          // remove prevProtect from user
          users = users.filter(function (user) {
            return user !== prevProtect;
          });
          // and the user we may already have protected
          var nowProtect = Db.personal.get('protect', time.timeId);
          
          Ui.bigButton('Protect', UserModal.bind(this, users, 'Protect', Obs.create(nowProtect), protect));
        } else {
          // Show reason why he can not protect
          Dom.div(function () {
            Dom.style({color: 'red'});
            if (!time.isNight) Dom.text('You can only protect people during the night.');
            else if (!isAlive) Dom.text('You are dead; you can not stop the werewolves like this!');
            
            disabledButton('Protect');
          });
        }
      });
    });
  }
  
  function seer(time) {
    /**
     * Shows the role of the user in a separated modal.
     */
    function investigate(user) {
      // ask the server for the role
      Server.call('investigateRole', user);
    }
    
    description('Watcher', 'seer.png', function () {
      Dom.div(function () {
        Dom.p(
          'You are a watcher. ' +
          'You can see straight through how people appear ' +
          'to discover who they really are. ' +
          'Each night you can investigate one person to find their true role.'
        );
        Dom.p(
          'You win when all the werewolves are dead.'
        );
        
        // section to activate the seer power
        actionBox(function () {
          
          // some explanation
          Dom.p('Select who you want to investigate.' +
            'You will be able to see his role during the next day.');
          
          // the investigate button
          var isAlive = Db.shared.get('users', Plugin.userId(), 'isAlive');
          var hasInvestigated = Db.personal.get('investigate', time.timeId);
          if (time.isNight && isAlive && !hasInvestigated) {
            // get the users that are still alive
            var users = UserViews.getUsers({isAlive: true});
            Ui.bigButton('Investigate', UserModal.bind(this, users, 'Investigate', null, investigate));
          } else { // we can not vote
            
            // reason why we can not vote
            Dom.div(function () {
              Dom.style({color: 'red'});
              if (!time.isNight) Dom.text('You can only investigate people during the night.');
              else if (!isAlive) Dom.text('You are dead; your investigate power is useless now!');
              else if (hasInvestigated) Dom.text('You have already used this ability this night.');
            });
            
            disabledButton('Investigate');
          }
          
          // display the role of the user selected in the previous night
          if (time.isDay && time.number > 0) {
            // get the id of the previous night
            var prevTimeId = 'night' + (time.number - 1);
            
            // get the investigation
            var investigated = Db.personal.get('investigate', prevTimeId);
            
            if (investigated) { // we have investigated last night
              // show what his role was
              Ui.item(function () {
                Ui.avatar(Plugin.userAvatar(investigated.user));
                UserViews.name(investigated.user)
                
                Dom.span(function () {
                  Dom.style({
                    margin: '1em',
                    color: '#AAA'
                  });
                  Dom.text(' is a ');
                });
                
                nameOf(investigated.role);
              });
            } else { // no one has been investigated
              Ui.item(function () {
                Dom.span(function () {
                  Dom.style({
                    margin: '1em',
                    color: '#AAA'
                  });
                  Dom.text('You did not investigate anyone last night!');
                });
              });
            }
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
      case Constants.roles.GUARDIAN:
        guardian(time);
        break;
    }
  }
  
  /**
   * Renders the name with the image found and the given source and the given text.
   */
  function name(icon, text) {
    Dom.span(function () {
      Dom.style({
        textTransform: 'initial',
        margin: '4px',
        color: Plugin.colors().highlight
      });
      
      // small image indicating the role
      Dom.img(function () {
        Dom.style({
          height: '1em',
          width: '1em'
        });
        Dom.prop('src', Plugin.resourceUri(icon));
      });
      
      // the text showing the role
      Dom.text(text);
    });
  }
  
  /**
   * Displays the name of the role (with a symbol and such.)
   */
  function nameOf(role) {
    switch(role) {
      case Constants.roles.CITIZEN:
        name('citizen.png', 'Citizen');
        break;
      case Constants.roles.WEREWOLF:
        name('wolf.png', 'Werewolf');
        break;
      case Constants.roles.SEER:
        name('seer.png', 'Watcher');
        break;
      case Constants.roles.GUARDIAN:
        name('shield.png', 'Guardian');
        break;
    }
  }
  
  /**
   * A view giving a description and access to the given role.
   */
  exports.description = descriptionOf;
  
  exports.name = nameOf;
  
}());
