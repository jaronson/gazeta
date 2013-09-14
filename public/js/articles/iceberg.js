define([
  'jquery',
  'utils',
  'mediaelement'
], function($, utils){
  return function(){
    $('.be-kind audio').mediaelementplayer({
      features: [ 'playpause', 'progress', 'duration', 'volume' ],
      alwaysShowControls: true
    });
    $('.be-kind audio').attr('height', '0');
  };
});
