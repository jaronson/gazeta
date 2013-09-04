require.config({
  baseUrl: 'js/libs',
  paths: {
    jquery:   'jquery.min',
    swfobject: 'swfobject'
  },
  shim: {
    'jquery.textfill': [ 'jquery' ],
    'ytplayer': [ 'jquery' ]
  }
});

require([
  'jquery',
  'jquery.textfill',
  'ytplayer',
  'swfobject'
], function($, textfill, ytplayer, swfobject){
  $(document).ready(function(){
    $('.yt-player').ytplayer();

    $.textfill({
      animation: {
        fadeDuration: 150
      }
    });

    $('.textfill').textfill({});

    $('header ul.tags li a').click(function(){
      $('header ul.tags li').removeClass('active');
      $(this).parent().addClass('active');
    });

    $(window).scroll(function(){
      $('header').css('top', $(window).scrollTop());
    });
  });
});
