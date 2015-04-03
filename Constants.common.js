/**
 * This file holds the constants used for both the server and the client.
 */
 (function () {
   
   var constants = {
     roles: {
       CITIZEN: "citizen",
       WEREWOLF: "werewolf"
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
