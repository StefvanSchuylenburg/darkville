/**
 * This file holds the constants used for both the server and the client.
 */
 (function () {
   
   var constants = {
     roles: {
       CITIZEN: 'citizen',
       WEREWOLF: 'werewolf',
       SEER: 'seer',
       GUARDIAN: 'guardian'
     },
     events: {
       // the type of event we are handling
       type: {
         NEW_GAME: 'new game',
         // a death event contains a cause (deathCauses) and the user (id) that died.
         DEATH: 'death'
       },
       deathCauses: {
         LYNCHING: 'lynching',
         WEREWOLVES: 'werewolves'
       }
     }
   };
   
   /**
    * Takes the constants as a function,
    * such that they can be used outside the sandbox scope.
    */
   exports = function () {
     return constants;
   };
 }());
