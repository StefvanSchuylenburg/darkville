/**
 * Views to show a description and access to the role of the player.
 */
(function () {
  
  var Dom = require('dom');
  var Plugin = require('plugin');
  var Constants = require('Constants')();
  
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
        padding: '5px'
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
        // Dom.style({float: 'left'});
        content();
      });
    });
  }
  
  function werewolf() {
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
   */
  function descriptionOf(role) {
    // get a description based on the role
    switch(role) {
      case Constants.roles.CITIZEN:
        citizen();
        break;
      case Constants.roles.WEREWOLF:
        werewolf();
        break;
    }
  }
  
  /**
   * A view giving a description and access to the given role.
   */
  exports.description = descriptionOf;
  
}());
