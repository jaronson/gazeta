$(document).ready(function(){
  $('.yt-player').ytplayer();

  $('.intro h1').textfill({});

  $('header ul.tags li a').click(function(){
    $('header ul.tags li').removeClass('active');
    $(this).parent().addClass('active');
  });

  $(window).scroll(function(){
    $('header').css('top', $(window).scrollTop());
  });
});
