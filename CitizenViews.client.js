/**
 * View for displaying the citizens of the current game and their state.
 */
(function () {
  
  var Dom = require('dom');
  var Ui = require('ui');
  var Db = require('db');
  var Plugin = require('plugin');
  
  /**
   * Shows the name of the user
   * @WARNING most is copied from VotingViews
   */
  function userName(user, isAlive) {
    Dom.h2(function () {
      Dom.style({
        borderBottomStyle: 'none',
        textTransform: 'initial',
        margin: '4px'
      });
      
      if (!isAlive) { // the user is not alive
        Dom.style({
          textDecoration: 'line-through'
        });
      }
      
      Dom.text(Plugin.userName(user));
    });
  }
  
  /**
   * Renders an item for one of the citizens.
   * @param userId The id of the user.
   * @param userData the object containing the state of the user
   */
  function citizenItem(userId, userData) {
    Ui.item(function () {
      // the user
      Ui.avatar(Plugin.userAvatar(userId));
      userName(userId, userData.isAlive);
      
      // add role when the user is dead
      if (!userData.isAlive) {
        // TODO: user RoleViews to render the role name
        Dom.text('(' + userData.role + ')');
      }
    });
  }
  
  /**
   * Renders the overview containing all the citizens and their state
   */
  function overview() {
    var users = Db.shared.get('users');
    
    Ui.list(function () {
      // rendering the items
      for (var user in users) {
        if (users.hasOwnProperty(user)) {
          citizenItem(user, users[user]);
        }
      }
    });
  }
  
  /**
   * An overview containing a list of citizens and their state.
   */
  exports.overview = overview;
  
}());
