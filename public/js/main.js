require.config({
  baseUrl: '/js',
  urlArgs: 'bust=' + Math.random(),
  paths: {
    'jquery':          'libs/jquery.min',
    'jquery.scrollto': 'libs/jquery.scrollto.min',
    'jquery.textfill': 'libs/jquery.textfill'
  },
  shim: {
    'jquery.scrollto': [ 'jquery' ],
    'jquery.textfill': [ 'jquery' ]
  }
});

require([
  'jquery',
  'router',
  'jquery.textfill'
], function($, Router){
  $('.textfill').textfill();

  var router = new Router();
  router.start();
});
