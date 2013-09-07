define([
  'jquery',
  'jquery.textfill',
  'ytplayer',
  'swfobject',
], function($){
  return function(){
    this.start = function(){
      $.textfill({
        animation: {
          fadeDuration: 150
        }
      });

      $('.textfill').textfill({
        animation: {
          resizeDuration: 140
        }
      });
      $('.yt-player').ytplayer();

      $(window).on('load scroll', function(){
        repositionHeader();
      });
    };

    var repositionHeader = function(){
      $('header').css('top', $(window).scrollTop());
    };
  };
});
