require.config({
  baseUrl: '/js',
  urlArgs: 'bust=' + Math.random(),
  paths: {
    'jquery':          'libs/jquery.min',
    'swfobject':       'libs/swfobject',
    'jquery.textfill': 'libs/jquery.textfill',
    'jquery.scrollto': 'libs/jquery.scrollto.min',
    'jquery.mousewheel': 'libs/jquery.mousewheel'
  },
  shim: {
    'jquery.textfill': [ 'jquery' ],
    'jquery.scrollto': [ 'jquery' ],
    'jquery.mousewheel': [ 'jquery' ]
  }
});

require([
  'jquery',
  'settings',
  'router',
  'app',
  'jquery.scrollto',
  'jquery.mousewheel'
], function($, settings, Router, App){
  $(document).ready(function(){
    var app = new App();
    app.start();

    $('.textfill').textfill();

    var router = new Router();
    router.start();
  });
});
