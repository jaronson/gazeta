define([
  'jquery'
], function($){
  var setAttrs = function(that){
    that['__attrs'] = that['__attrs'] || {};
  };

  var Base = {};

  Base.extend = function(child){
    child.prototype = $.extend(true, {
      attr: new Base.attr(child)
    }, child.prototype);

    return child;
  };

  Base.attr = function(that){
    var self = this;

    this.accessor = function(key){
      setAttrs(that);

      if(arguments.length > 1){
        that.__attrs[key] = arguments[1];
      }
 
      that[key] = function(value){
        if(typeof value != 'undefined'){
          return that.__attrs[key] = value;
        } else {
          return that.__attrs[key];
        }
      };
    };

    this.writer = function(key){
      setAttrs(that);

      if(arguments.length > 1){
        that.__attrs[key] = arguments[1];
      }

      that[key] = function(){
        return that.__attrs[key];
      };
    };

    this.reader = function(key){
      setAttrs(that);

      if(arguments.length > 1){
        that.__attrs[key] = arguments[1];
      }

      that[key] = function(value){
        return that.__attrs[key] = value;
      };
    };
  };

  return Base;
});
