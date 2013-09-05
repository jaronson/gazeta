require([
  'jquery',
  'jquery.textfill',
  'ytplayer',
  'swfobject',
], function($){
  $(document).ready(function(){
    var repositionHeader = function(){
      $('header').css('top', $(window).scrollTop());
    };

    $.textfill({
      animation: {
        fadeDuration: 150
      }
    });

    $('.textfill').textfill({});
    $('.chap').textfill({});

    $('.yt-player').ytplayer();

    $(window).scroll(function(){
      repositionHeader();
    });

    repositionHeader();
  });
});
