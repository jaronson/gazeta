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
      duration: 260 
    },
    mousewheel: {
      timeout: 700
    },
    animation: {
      swipe: {
        duration: 300
      }
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
