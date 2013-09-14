define([
  'jquery',
  'router',
  'jquery.textfill'
], function($, Router){
  return function(){
    $('.textfill').textfill();

    var router = new Router();
    router.start();
  };
});
