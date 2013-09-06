define([
  'jquery'
], function($){
  var settings = {
    selectors: {
      layout: 'layout',
      article: 'article',
      section: '.section,section'
    },
    scroll: {
      duration: 60 
    },
    mousewheel: {
      timeout: 900
    }
  };

  settings.$layout = function(){ 
    return $(settings.selectors.layout);
  };

  settings.$articles = function(){
    return settings.$layout().find(settings.selectors.article);
  };

  settings.$sections = function(){
    return $(settings.$layout()).find(settings.selectors.section);
  };

  return settings;
});
