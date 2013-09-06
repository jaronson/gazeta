require.config({
  baseUrl: '/js',
  urlArgs: 'bust=' + (new Date()).getTime(),
  paths: {
    'jquery':          'libs/jquery.min',
    'swfobject':       'libs/swfobject',
    'jquery.textfill': 'libs/jquery.textfill',
    'jquery.scrollto': 'libs/jquery.scrollto.min',
    'jquery.unevent':  'libs/jquery.unevent',
    'jquery.mousewheel': 'libs/jquery.mousewheel',
    'jquery.hammer':   'libs/jquery.hammer.min',
    'ytplayer':        'libs/ytplayer',
    'google.animate':  'libs/google.animate',
    'waypoints':       'libs/waypoints.min'
  },
  shim: {
    'jquery.textfill': [ 'jquery' ],
    'jquery.scrollto': [ 'jquery' ],
    'jquery.unevent':  [ 'jquery' ],
    'jquery.hammer':   [ 'jquery' ],
    'jquery.mousehweel':   [ 'jquery' ],
    'ytplayer':        [ 'jquery' ]
  }
});

require([
  'jquery',
  'router',
  'app',
  'jquery.scrollto',
  'jquery.unevent',
  'jquery.hammer',
  'jquery.mousewheel'
], function($, Router, App){
  $(document).ready(function(){
    var app = new App();
    app.start();

    var router = new Router();
    router.start();
  });
});
