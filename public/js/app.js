define([
  'jquery',
  'jquery.textfill'
], function($){
  return function(){
    this.start = function(){
      $(window).on('load scroll', function(){
        repositionHeader();
      });

      $(window).on('resize', function(){
        $('layout').css('width', $(window).width() + 'px');
      });
    };

    var repositionHeader = function(){
      $('header').css('top', $(window).scrollTop());
    };
  };
});
