/**
 * Shows the time (and date) for the current game.
 * This is based on the start time of a game.
 */
(function () {
  'use strict';
  
  require('Constants');
  
  /**
   * Returns the GameTime that started on the real time given start time.
   * @param startTime The unix time in ms that the game has started.
   */
  function startingOn(startTime) {
    // the start of the night and the day (hard-coded right now)
    var dayStart = 8;
    var nightStart = 20;
    var startDay0 = getStartDay0();
    
    /**
     * Gets the start of day 0.
     * The returned value is date object.
     */
    function getStartDay0() {
      // finding out on which time day0 started
      var startDay0 = new Date(startTime);
      
      // finding on what day, day0 started
      startDay0.setHours(startDay0.getHours() - dayStart);
      
      // setting this to dayStart value
      startDay0.setHours(8, 0, 0, 0);
      
      return startDay0;
    }
    
    return {
      /**
       * Whether it is day in game right now
       */
      isDay: function (date) {
        var hours = date.getHours();
        return dayStart <= hours && hours < nightStart; // todo hard coded right now
      },
      /**
       * Determines whether it is night right now
       */
      isNight: function (date) {
        return !this.isDay(date);
      },
      /**
       * Gets the number of the day or the night.
       * We start always in day 0 or night 0, depending on isDay
       */
      getNumber: function(date) {
        // the time elapsed since the start of day 0
        var elapsedMs = date.getTime() - startDay0.getTime();
        
        // the number of days in elapsed
        var days = elapsedMs / (1000 * 60 * 60 * 24);
        
        // return the day as whole number
        return Math.floor(days);
      }
      
    };
  }
  
  exports.startingOn = startingOn;
  
}());
