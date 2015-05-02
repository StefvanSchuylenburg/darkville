/**
 * Shows the time (and date) for the current game.
 * This is based on the start time of a game.
 */
(function () {
  'use strict';
  
  /**
   * Returns the GameTime that started on the real time given start time.
   * @param startTime The unix time in ms that the game has started.
   */
  function startingOn(startTime) {
    // the start of the night and the day (hard-coded right now)
    var dayStart = 8;
    var nightStart = 20;
    
    // the start of day 0 as Date object
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
    
    /**
     * The start of day n.
     * Returns a Date.
     */
    function getStartDayN(n) {
      // take the start and add n days to it ;)
      var startDayN = new Date(startDay0.getTime());
      startDayN.setDate(startDayN.getDate() + n);
      
      return startDayN;
    }
    
    /**
     * The start of night n.
     * Returns a Date.
     */
    function getStartNightN(n) {
      var startNightN = getStartDayN(n);
      startNightN.setHours(nightStart);
      return startNightN;
    }
    
    function getNumber(date) {
      // the time elapsed since the start of day 0
      var elapsedMs = date.getTime() - startDay0.getTime();
      
      // the number of days in elapsed
      var days = elapsedMs / (1000 * 60 * 60 * 24);
      
      // return the day as whole number
      return Math.floor(days);
    }
    
    /**
     * Returns an object containing data for the number of the day
     * and whether it is day or night.
     * @param date Date object containing the date we want to investigate
     */
    function getTime(date) {
      // getting values used for multiple properties
      var number = getNumber(date);
      
      var hours = date.getHours();
      var isDay = dayStart <= hours && hours < nightStart;
      
      // getting time to nextChange
      var nextChange;
      if (isDay) nextChange = getStartNightN(number);
      else nextChange = getStartDayN(number + 1);
      
      return {
        
        /**
         * Whether it is day in game on this moment
         */
        isDay: isDay,
        
        /**
         * Determines whether it is night right now
         */
        isNight: !isDay,
        
        /**
         * Gets the number of the day or the night.
         * We start always in day 0 or night 0, depending on isDay
         */
         number: number,
         
         /**
          * Gets the date on which the next change from date to night or vice versa
          * happens.
          */
         nextChange: nextChange,
         
         /**
          * Gives an id that is unique for this isDay - number combination
          */
         timeId: (isDay? 'day' : 'night') + number
      };
    }
    
    
    return {
      
      /**
       * Returns an object containing data for the number of the day
       * and whether it is day or night.
       * @param date Date object containing the date we want to investigate
       */
      getTime: getTime
      
    };
  }
  
  exports.startingOn = startingOn;
  exports.getTime = function (start, date) {
    return startingOn(start).getTime(date);
  };
  
}());