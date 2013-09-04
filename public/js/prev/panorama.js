var dan;

var DriveAnimation = function(target, markerXML){
  var self = this;

  var init = function(){
    loadSteps();
    loadCache();
    self.step();
  };

  this.target       = $(target);
  this.markerXML    = $(markerXML);
  this.steps        = [];
  this.stepIndex    = -1;
  this.stepInterval = 300;
  this.timer        = null;

  this.preloadIndex    = 0;
  this.preloadCount    = 3;
  this.preloadInterval = 3;
  this.tweenDuration   = 250;
  this.panoramaOptions = {
    panControl: false,
    zoomControl: false,
    addressControl: false,
    linksControl: false
  };

  this.play = function(interval, startIndex){
    var interval = interval || self.stepInterval;
    var startIndex = startIndex || self.stepIndex;

    var callback = function(){
      if(self.hasNext()){
        self.step();
        self.timer = setTimeout(callback, interval);
      } else {
        self.stepIndex = 0;
      }
    };

    callback();
  };

  this.pause = function(){
    clearTimeout(self.timer);
  };

  this.step = function(){
    var prev = self.steps[self.stepIndex];
    var next = self.steps[++self.stepIndex];
    var animate = function(step, o){
      step.frame.animate({
        opacity: o
      }, {
        duration: self.tweenDuration
      });
    };

    if(prev){
      animate(prev, 0);
    }
    animate(next, 1);

    if(self.preloadIndex < self.steps.length - 1 && self.stepIndex % self.preloadInterval == 0){
      loadCache();
    }
  };

  this.hasNext = function(){
    return self.stepIndex < self.steps.length - 1;
  };

  this.isPlaying = function(){
    return self.timer && self.timer != null;
  };

  var loadCache = function(){
    for(var i = self.preloadIndex, l = self.preloadCount + self.preloadIndex; i < l; ++i){
      loadPanorama(self.steps[i]);
      self.preloadIndex++;
    }
  };

  var loadSteps = function(){
    var xp = $(markerXML).find('line point');
    var heading = 0;
    var pitch   = 0;
    var zoom    = 0;

    for(var i = 0, l = xp.length; i < l; ++i){
      var pt = xp[i];
      var h = pt.getAttribute('heading');
      var d = pt.getAttribute('pitch');
      var z = pt.getAttribute('zoom');

      heading = h ? parseFloat(h) : heading;
      pitch   = d ? parseFloat(d) : pitch;
      zoom    = z ? parseInt(z) : zoom;

      container = $('<div/>').addClass('step').
        attr('id', 'step-' + i).
        attr('data-index', i);
        ;
      frame = $('<div/>').addClass('frame').appendTo(container).fadeTo(0,0);

      var step = {
        container: container,
        frame: frame,
        index: pt.getAttribute('index') || i,
        point: new google.maps.LatLng(pt.getAttribute('lat'), pt.getAttribute('lng')),
        pov: {
          heading: heading,
          pitch:   pitch,
          zoom:    zoom
        }
      };

      self.steps.push(step);
    }
  };

  var loadPanorama = function(step){
    if(!step){
      return;
    }

    var opts = $.extend({
      position: step.point,
      pov: step.pov,
    }, self.panoramaOptions);

    step.container.appendTo(self.target);

    step.panorama = new google.maps.StreetViewPanorama(step.frame.get(0), opts);

    return step.panorama;
  };

  var updatePanorama = function(panorama, step){
    panorama.setPosition(step.point);
    panorama.setPov({ heading: step.heading, pitch: step.pitch, zoom: step.zoom });
  };

  init();
};

$(document).ready(function(){
  $(window).keypress(function(evt){
    if(evt.charCode == 32){
      dan.isPlaying() ? dan.pause(): dan.play();
    }
  });

  $.ajax({
    type: 'GET',
    url: '/xml/karnak-to-hwy-37.xml',
    dataType: 'xml',
    success: function(xml){
      dan = new DriveAnimation('#panorama', xml);
    }
  });
});
