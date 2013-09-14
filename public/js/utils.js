define([
  'jquery',
  'settings',
  'utils/event_handler',
  'jquery.scrollto'
], function($, settings, EventHandler){
  var utils = {
    ajax: {
      fileExists: function(attrs){
        attrs.success = attrs.success || function(){};
        attrs.failure = attrs.failure || function(){};

        $.ajax({
          method: 'HEAD',
          url: attrs.url,
          complete: function(xhr){
            if(xhr.status == 200){
              $.proxy(attrs.success, this)();
            } else {
              $.proxy(attrs.failure, this)();
            }
          }
        });
      },
    },

    EventHandler: EventHandler,

    import: {
      css: function(url){
        utils.ajax.fileExists({
          url: url,
          success: function(){
            var link = $('<link/>').
              attr('rel', 'stylesheet').
              attr('href', url).
              attr('type', 'text/css');

            link.appendTo($('head'));
          }
        });
      },

      js: function(url, context, args){
        utils.ajax.fileExists({
          url: url,
          success: function(){
            require([ url ], function(script){
              $.proxy(script, context, args)();
            });
          }
        });
      }
    },

    join: {
      attr: function(){
        return Array.prototype.slice.call(arguments).join(settings.separator.attr);
      },
      path: function(){
        return Array.prototype.slice.call(arguments).join(settings.separator.path);
      }
    },

    scrollTo: function(target){
      if(target.name && settings.scroll[target.name]){
        return $('html, body').animate({
          scrollTop: target.target.offset().top
        }, settings.scroll[target.name]);
      }

      return $('html, body').animate({
        scrollTop: target.offset().top
      }, settings.scroll.duration);
    },

    rand: function(){
      return Math.random().toString().replace(/^0\./,'');
    },

    tag: {
      create: function(name){
        return $('<' + settings.tag[name] + '/>');
      }
    }
  };

  return utils;
});
