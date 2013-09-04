var isPresent = function(v){
  return v && typeof v != 'undefined' && !isNaN(v) && v != null ? true : false
};

var DriveAnimation = function(target, markerXML){
  var self = this;

  this.target     = $(target);
  this.markerXML  = $(markerXML);
  this.steps      = [];
  this.stepIndex  = -1;
  this.stepInterval = 100;
  this.fade         = 1;
  this.panorama   = null;
  this.timer      = null;
  this.direction  = 'next';
  this.panoramaOptions = {
    panControl: false,
    zoomControl: false,
    addressControl: false,
    linksControl: false,
    visible: true
  };

  this.loop = function(d){
    var start = 0;
    var end   = self.steps.length - 1;

    if(d == 'prev'){
      self.direction = d;
      self.stepIndex = end;
    }

    var run = function(){
      if(self.direction == 'next' && self.stepIndex == end){
        self.direction = 'prev';
      } else if(self.direction == 'prev' && self.stepIndex == start){
        self.direction = 'next';
      }

      var step = self.step();
      self.timer = setTimeout(run, step.interval);
    };

    run();
  };

  this.runOnce = function(start){
    self.pause();

    var start = start || parseInt($('#animation-from').val());

    if(start && start >= 0){
      self.stepIndex = start;
    }

    var f = function(){
      if(self.hasStep()){
        var step = self.step();
        self.timer = setTimeout(f, step.interval);
      } else {
        self.stepIndex = 0;
      }
    }

    f();
  };

  this.pause = function(){
    clearTimeout(self.timer);
  };

  this.restart = function(){
    self.pause();
    self.runOnce(null, 0);
  };

  this.hasStep = function(){
    return self.stepIndex < self.steps.length - 1;
  };

  this.prev = function(){
    if(self.stepIndex <= 0){
      self.stepIndex = self.steps.length - 1;
    }

    self.stepIndex -= 2;
    self.step();
  };

  this.step = function(){
    self.direction == 'prev' ? self.stepIndex-- : self.stepIndex++;
    var step = self.steps[self.stepIndex];
    if(self.fade != null){
      setOpacity(step.fade);
    }
    updatePanorama(self.panorama, step);
    logStep(step);
    logPov();
    return step;
  };

  this.currentStep = function(){
    return self.steps[self.stepIndex];
  };

  this.isPlaying = function(){
    return self.timer && self.timer != null;
  };

  var init = function(){
    setSteps();

    self.panorama = newPanorama(self.target.get(0));
    self.step();

    //setControls();
  };

  var newPanorama = function(container){
    var p = new google.maps.StreetViewPanorama(container, self.panoramaOptions);

    google.maps.event.addListener(p, 'position_changed', function(){
      logPosition()
    });

    google.maps.event.addListener(p, 'pov_changed', function(){
      logPov()
    });

    return p;
  };

  var setOpacity = function(n){
    if(n){
      self.target.fadeTo(500, n);
    }
  };

  var setControls = function(){
    $('#animation-speed').val(self.stepInterval);
    $('#animation-from').val(self.stepIndex);

    $('button.play').click(function(){
      self.runOnce();
    });
    $('button.pause').click(function(){ self.pause() });
    $('button.restart').click(function(){ self.restart() });
    $('button.prev').click(function(){ self.prev() });
    $('button.next').click(function(){ self.step() });
    $('.get-xml button').click(function(){
      $('.get-xml textarea').text('<point index="' + self.stepIndex +'" ' +
        'lat="' + self.panorama.getPosition().lat() + '" ' +
        'lng="' + self.panorama.getPosition().lng() + '" ' +
        'heading="' + self.panorama.getPov().heading + '"/>');
    });
  };

  var setSteps = function(){
    var xp = $(markerXML).find('line point');
    var heading = 0;
    var pitch   = 0;
    var zoom    = 0;

    for(var i = 0, l = xp.length; i < l; ++i){
      var pt = xp[i];
      var h = pt.getAttribute('heading');
      var d = pt.getAttribute('pitch');
      var z = pt.getAttribute('zoom');
      var t = pt.getAttribute('interval');
      var f = pt.getAttribute('fade');

      heading = h ? parseFloat(h) : heading;
      pitch   = d ? parseFloat(d) : pitch;
      zoom    = z ? parseInt(z) : zoom;
      self.stepInterval = interval = t ? parseInt(t) : self.stepInterval;

      var obj = {
        index:   pt.getAttribute('index') || i,
        point:   new google.maps.LatLng(pt.getAttribute('lat'), pt.getAttribute('lng')),
        heading: heading,
        pitch: pitch,
        zoom: zoom,
        fade: f,
        interval: interval
      };
      self.steps.push(obj);
    }
  };

  var updatePanorama = function(panorama, step){
    var h = self.direction == 'prev' ? step.heading * -1 : step.heading;
    panorama.setPosition(step.point);
    panorama.setPov({ heading: h, pitch:  step.pitch, zoom: step.zoom });
  };

  var logPosition = function(){
    $('.animation-log td.lat').text(self.panorama.getPosition().lat());
    $('.animation-log td.lng').text(self.panorama.getPosition().lng());
  };

  var logPov = function(){
    $('.animation-log td.heading').text(self.panorama.getPov().heading);
    $('.animation-log td.pitch').text(self.panorama.getPov().pitch);
    $('.animation-log td.zoom').text(self.panorama.getPov().zoom);
  };

  var logStep = function(step){
    $('.animation-log td.index').text(step.index);
    $('.animation-log td.interval').text(step.interval);
    $('.animation-log td.step').text(JSON.stringify(step));
    $('#animation-from').val(step.index);
  };

  init();
};

var dan;
var map;

function onYouTubePlayerReady(pid){
  var player = $('#fm-jh').get(0);
  player.cueVideoById('54GNI2K3-ec');
  player.playVideo();
  dan.loop('prev');
};

$(document).ready(function(){

  var initMap = function(){
    var opts = {
      center: dan.steps[0].point,
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      panControl: false,
      draggable: false,
      scaleControl: false,
      scrollwheel: false,
      backgroundColor: 'rgba(0,0,0,0)'
    };

    var styles = [{
      featureType: 'landscape',
      elementType: 'geometry.fill',
      stylers: [
        { saturation: -30 }
      ]
    },{
      featureType: 'landscape',
      elementType: 'geometry.fill',
      stylers: [
        { visibility: 'off' }
      ]
    },{
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [
        { visibility: 'off' }
      ]
    }];

    map = new google.maps.Map($('#intro .map').get(0), opts);
    map.setStreetView(dan.panorama);
    map.setOptions({
      styles: styles
    });

    google.maps.event.addListener(dan.panorama, 'position_changed', function(){
      map.setCenter(dan.currentStep().point);
    });
  };

  var resize = function(){
    $('#panorama').css('height',$('#intro').height() + 'px');
  };

  var initPano = function(){
    $.ajax({
      type: 'GET',
      url: '/xml/karnak-to-hwy-37.xml',
      dataType: 'xml',
      success: function(xml){
        dan = new DriveAnimation('#panorama', xml);
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

  initPano();
  initPlayer();
});
