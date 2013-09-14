define([
  'jquery',
  'settings',
  'utils'
], function($, settings, utils){
  var view = {
    selectors: settings.selectors,

    $layout: function(){
      return $(settings.selectors.layout);
    },

    $section: function(){
      return $(settings.selectors.section);
    },

    separator: {
      date: function(d){
        var d = $('<date/>').text(d);
        var s = $('<separator/>');
        d.appendTo(s);
        return s;
      }
    }
  };

  return view;
});
