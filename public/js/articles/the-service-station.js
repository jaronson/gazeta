define([
  'jquery',
  'google.animate'
], function($){
  return function(){
    var animation;

    var resize = function(){
      var h = $('#panorama').closest('.section').height();
      //var h = $(window).height() + 'px';
      $('#panorama').css('height', h);
    };

    var initAnimation = function(){
      $.ajax({
        type: 'GET',
        url: '/xml/karnak-to-hwy-37.xml',
        dataType: 'xml',
        success: function(xml){
          resize();

          animation = new google.animate.StreetView('.service-intro.section-1', xml);
          animation.stepIndex = 20;
          animation.step();
          animation.runOnce();
        }
      });
    };

    initAnimation();
  }
});
