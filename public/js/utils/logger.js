define([
  'jquery'
], function($){
  var logger = {
    levels: [ 'error', 'warn', 'info', 'debug' ],
    level:  'error'
  };

  logger.print = function(args){
  };

  logger.debug = function(){
    if(logger.level == 'debug'){
      console.log(arguments);
    }
  };

  return logger;
});
