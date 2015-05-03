/**
 * A pop-up like menu to choose a person.
 * This modal is used to select a user for example for voting
 */
(function () {
  'use strict';
  
  var Dom = require('dom');
  var Plugin = require('plugin');
  var Modal = require('modal');
  var Ui = require('ui');
  var Obs = require('obs');
  
  /**
   * A pop-up like menu to choose a user to vote on.
   * @param users the users you can choose
   * @param an observer holding what currently is selected.
      Can be set to null if it is not used.
   * @param callback will be called when someone is selected
   */
  function userModal(users, selected, callback) {
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
          var selectedGet = selected? selected.get() : null;
          
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
                callback(user);
                Modal.remove();
              });
            });
          });
        });
        
      });
    });
  }
  
  /**
   * A function that pops up the User Modal.
   */
  exports = userModal;
  
}());
