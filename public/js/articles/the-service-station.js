require([
  'jquery',
  'google.animate',
  'jquery.textfill'
], function($){

  var animation;

  window.onYouTubePlayerReady = function(pid){
    var player = $('#fm-jh').get(0);
    player.cueVideoById('54GNI2K3-ec');
    player.playVideo();
    animation.loop('prev');
  };

  $(document).ready(function(){
    var resize = function(){
      $('#panorama').css('height',$('#intro').height() + 'px');
    };

    var initAnimation = function(){
      $.ajax({
        type: 'GET',
        url: '/xml/karnak-to-hwy-37.xml',
        dataType: 'xml',
        success: function(xml){
          animation = new google.animate.StreetView('#panorama', xml);
          animation.stepIndex = 20;
          animation.step();
          animation.target.fadeTo(1,0.8);
          animation.runOnce();
        }
      });
    };

    var initPlayer = function(){
      var params = { allowScriptAccess: 'always' };
      var attrs  = { id: 'fm-jh' };
      swfobject.embedSWF(
        "http://www.youtube.com/apiplayer?" +
        "start=10&" +
        "version=3&enablejsapi=1&playerapiid=player1",
        "fm-jh", "480", "295", "9", null, null, params, attrs);
    };

    $('#intro h1').textfill({
      complete: function(){
        resize();
      }
    });

    initAnimation();
  });
});
