define([
  'jquery',
  'settings'
], function($, settings){
  return {
    dateSeparator: function(date){
      var date = $('<date/>').text(date);
      return $('<separator/>').html(date);
    }
  };
});
