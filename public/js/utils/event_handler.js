define([
  'jquery',
  'settings'
], function($, settings){
  return function(objName, obj){
    var self = this;

    var init = function(){
      self.objName = objName;
      self.obj     = obj;
    };

    this.keys = settings.event;

    this.trigger = function trigger(key){
      var target = self.getTarget(key);
      var key    = self.getKey(key);

      log(key);

      return target.trigger(key, self.obj);
    };

    this.observe = function observe(key, callback){
      var target = self.getTarget(key);

      log(key);

      return target.on(self.getKey(key), function(e){
        log(key, callback);
        callback.apply(target, [ e, self.obj ]);
      });
    };

    this.watch = function watch(scope, events, callback){
      var e = $(scope).get(0);
      var n = self.getName(e);

      log(n, null, events);

      $(scope).on(events, function(){
        log(n, callback, events);
        callback.apply(e.target, arguments);
      });
    };

    this.send = function send(scope, events){
      var e = $(scope).get(0);
      var n = self.getName(e);

      log(n, null, events);

      $(scope).trigger(events);
    };

    this.getKey = function getKey(part){
      if(settings.event[self.objName]){
        return settings.event[self.objName][part];
      } else {
        var parts = part.split('.');
        return settings.event[parts[0]][parts[1]];
      }
    };

    this.getName = function(element){
      var n;

      if(element == window){
        n = 'window';
      } else if(element == document){
        n = 'document';
      } else {
        n = $(element).prop('tagName').toLowerCase();
      }

      return n;
    };

    this.getTarget = function getTarget(key){
      var obj = self.obj;

      if(key.match(/(\w)\.(\w)/)){
        var parts = key.split('.');
        var obj   = self.obj[parts[0]] || self.obj;
      }

      if(typeof obj.target != 'undefined' && obj.target != null){
        return obj.target;
      } else {
        return obj;
      }
    };

    var log = function log(key, callback, events){
      if(!settings.log.events){
        return;
      }

      var msg = [];
      var caller = arguments.callee.caller.name;

      msg.push('%c' + self.objName);

      if(caller){
        msg.push(caller);
      }

      msg.push('%c' + key);

      if(events){
        msg.push(events.split(' ').join(', '));
      }

      if(callback){
        msg.push('(' + (callback.name || 'anonymous function') + ')');
      }

      console.log(msg.join(' '), 'color: green', 'color: black');
    };

    init();
  };
});
