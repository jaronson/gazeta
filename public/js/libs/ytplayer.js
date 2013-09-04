(function($, window){
  $.ytplayer = {
    url:   'http://www.youtube.com/apiplayer?version=3&enablejsapi=1',
    ready: function(playerId){
      var player = $('#' + playerId);
      player.trigger('loadPlayer');
    }
  };

  $.fn.ytplayer = function(){
    var self = this;

    this.scope   = $(this.selector);
    this.data    = this.scope.data();
    this.params  = {
      allowScriptAccess: 'always'
    };

    var init = function(){
      if(!self.data){
        return false;
      }

      self.videoId = self.data.videoId;

      if(!self.videoId){
        return false;
      }

      var r = Math.random().toString().replace('.','');
      self.playerId = 'video-' + self.videoId + r;
      self.embedId  = 'embed-' + self.videoId + r;
      self.url      = $.ytplayer.url + '&playerapiid=' + self.playerId;

      if(!self.scope.attr('id')){
        self.scope.attr('id', self.playerId);
      }

      self.embed = $('<object/>').attr('id', self.embedId).appendTo(self.scope);

      embedSwf();
      addMethods();
    };

    var addMethods = function(){
      for(name in methods){
        self.scope.on(name, $.proxy(methods[name], self));
      }
    };

    var embedSwf = function(){
      var args = [
        self.url,
        self.embedId,
        self.scope.width(),
        self.scope.height(),
        '9',
        null,
        null,
        self.params,
        {
          id: self.embedId
        }
      ];

      swfobject.embedSWF.apply(null, args);
    };

    var methods = {
      loadPlayer: function(){
        self.embed = $('#' + self.embedId);
        self.cueVideo();

        if(self.data.autoplay){
          self.playVideo();
        }
      },
    };

    this.cueVideo = function(){
      self.embed.get(0).cueVideoById(self.videoId);
    };

    this.playVideo = function(){
      self.embed.get(0).playVideo();
    };

    init();
  };

  window.onYouTubePlayerReady = function(){
    $.ytplayer.ready.apply(null, arguments);
  }
})(jQuery, this);
