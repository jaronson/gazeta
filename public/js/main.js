require.config({
  baseUrl: 'js',
  paths: {
    'jquery':          'libs/jquery.min',
    'swfobject':       'libs/swfobject',
    'jquery.textfill': 'libs/jquery.textfill',
    'ytplayer':        'libs/ytplayer',
    'google.animate':  'libs/google.animate'
  },
  shim: {
    'jquery.textfill': [ 'jquery' ],
    'ytplayer': [ 'jquery' ]
  }
});

require([
  'router',
  'app'
]);

/*
require([
  'app'
], function($){

$.article = {
  collection: [],

  push: function(f){
    $.article.collection.push(new f());
  },

  onScroll: function(){
    var wt = $(window).scrollTop();
    var wh = $(window).height();

    for(var i = 0, l = $.article.collection.length; i < l; ++i){
      var a = $.article.collection[i];
      a.startup();
    }
  },

  isSectionActive: function(sel, wt, wh){
    var vis = wt + wh - $(sel).offset().top / wh;
    return true;
  }
};


  require([
    'articles/the-service-station'
  ]);
});
*/
