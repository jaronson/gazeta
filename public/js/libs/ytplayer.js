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
        self.setupControls();
        self.setupVideo();
      },

      play: function(){
        self.recordState('play');
        self.toggleControl('pause');
        self.embed.get(0).playVideo();
        self.embed.get(0).unMute();
      },

      pause: function(){
        self.recordState('pause');
        self.toggleControl('play');
        self.embed.get(0).pauseVideo();
        self.embed.get(0).mute();
      }
    };

    this.cueVideo = function(){
      self.embed.get(0).cueVideoById(self.videoId);
    };

    this.fadeVolume = function(l,h){
      var n = l;
      var setVolume = function(){
        if(n >= h){
          return;
        }

        self.embed.get(0).setVolume(n);
        n++;

        self.volumeTimer = setTimeout(setVolume, 150);
      };

      setVolume();
    };

    this.recordProgress = function(){
      self.progressInterval = setInterval(function(){
        self.setCookie('time.current', self.embed.get(0).getCurrentTime());
      }, 1000);
    };

    this.recordState = function(state){
      self.setCookie('state', state);
    };

    this.setupVideo = function(){
      var opts  = self.data.options;
      var embed = self.embed.get(0);

      var prevState = self.getCookie('state');

      embed.mute();

      if(opts.seekTo){
        embed.seekTo(parseInt(opts.seekTo), true);
      }

      embed.pauseVideo();

      if(typeof prevState == 'undefined'){
        if(opts.autoplay){
          self.scope.trigger('play');
        }
      } else {
        self.scope.trigger(prevState);
      }
    };

    this.setupControls = function(){
      self.controls = $('<controls/>');

      var newSwitch = function(name, click){
        var s= $('<switch/>').text(name).
          on('click', click).
          on('mouseover', function(){
            $(this).fadeTo(0, 1);
          }).on('mouseout', function(){
            if($(this).text() != 'play'){
              $(this).fadeTo(0, 0);
            }
          });

          if(name != 'play'){
            s.fadeTo(0, 0);
          }

          s.appendTo(self.controls);
          return s;
      };

      var toggle = newSwitch('play', function(){
        if($(this).text() == 'play'){
          self.scope.trigger('play');
        } else {
          self.scope.trigger('pause');
        }
      });

      var volume = $('<volume/>');

      for(var i = 1, c = 6; i < c; ++i){
        $('<bar/>').attr('data-level', i).appendTo(volume);
      }

      //volume.appendTo(self.controls);

      self.controls.appendTo(self.scope);

      var m = (self.embed.height() / 2) - toggle.height() / 2;

      self.controls.find('switch').css({
        'padding-top': m + 'px',
        'padding-bottom': m + 'px'
      });
    };


    this.toggleControl = function(name){
      self.scope.find('controls switch').text(name);
    };

    this.getCookie = function(key){
      return $.cookie([ self.videoId, key ].join('.'));
    };

    this.setCookie = function(key, value){
      return $.cookie([ self.videoId, key ].join('.'), value);
    };

    init();
  };

  window.onYouTubePlayerReady = function(){
    $.ytplayer.ready.apply(null, arguments);
  }
})(jQuery, this);
