(function($){
  var $fn = $.textfill = function(options){
    $.extend(true, $.textfill.defaultOptions, options);
  };

  $fn.init = function(){
    if($fn.initialized){
      return false;
    }

    var addBlockSelector = function(){
      $.expr[':'].css = function(obj, index, meta, stack){
        var args = meta[3].split(/\s*=\s*/);
        return $(obj).css(args[0]) == args[1];
      };
    };

    var setEmBase = function(){
      $fn.emBase = $fn.util.parseSize($('body').css('font-size'));
    };

    addBlockSelector();
    setEmBase();

    return $fn.initialized = true;
  };

  $.extend($fn, {
    util: {},
    initialized: false,
    selectors:  {},
    elements:   [],
    containers: [],
    screenWidth: {
      current: null,
      last: null
    },
    emBase:     16,
    defaultOptions: {
      timeout:        200,
      resizeDuration: 0,
      fadeDuration:   100,
      easing:         'swing'
    }
  });

  $fn.util.arrayMin = function(values){
    return Math.min.apply(null, values);
  };

  $fn.util.arrayMax = function(values){
    return Math.max.apply(null, values);
  };

  $fn.util.arrayMean = function(values){
    return values.reduce(function(a, b){
      return a + b;
    }) / values.length;
  };

  $fn.util.arrayMedian = function(values){
    values.sort(function(a,b){
      return a - b;
    });

    var half = Math.floor(values.length / 2);

    if(values.length % 2) {
      return values[half];
    } else {
      return (values[half-1] + values[half]) / 2.0;
    }
  };

  $fn.util.emToPx = function(em, base){
    return em * base || $fn.emBase;
  };

  $fn.util.pxToEm = function(px, base){
    var base = base || $fn.emBase;
    return px / base;
  };

  $fn.util.parseSize = function(value, base){
    if(value){
      if(typeof value == 'number'){
        return value;
      } else if(typeof value == 'string'){
        if(value.match(/[\d]%$/)){
          return base * (parseFloat(value) / 100);
        } else if(value.match(/[\d]em$/)){
          return $fn.util.emToPx(parseFloat(value), base);
        } else {
          return parseFloat(value);
        }
      } else if(typeof value == 'function'){
        return value;
      }
    }
    return null;
  };

  $fn.addSelector = function(selector, options){
    if(typeof $fn.selectors[selector] == 'undefined'){
      $fn.selectors[selector] = options;
    }
  };

  $fn.addElements = function(target){
    for(selector in $fn.selectors){
      var options  = $fn.selectors[selector];
      var elements = $(target).find(selector + ':not([data-textfill-id])').get();

      for(var i = 0, l = elements.length; i < l; ++i){
        var e = elements[i];

        if(!$(e).attr('data-textfill-id')){
          $(e).attr('data-textfill-id', Math.random());
          $fn.elements.push(e);
          var opts = $.extend(true, {}, $fn.defaultOptions, options);
          $fn.containers.push(new $fn.Container(e, opts));
        }
      }
    }
  };

  $fn.resize = function(evt){
    for(s in $fn.selectors){
      $fn.addElements($(s));
    };
    for(var i = 0, l = $fn.elements.length; i < l; ++i){
      $($fn.elements[i]).trigger('filltext');
    }
  };

  $fn.Container = function(element, options){
    var self = this;

    this.element = element;
    this.scope   = $(element);
    this.options = options;
    this.timer   = null;

    var baseS   = parseFloat($(document.body).css('font-size'));

    var initialized = false;

    var init = function(){
      self.scope.on('filltext', function(){
        self.timer = setTimeout(function(){
          fill();
        }, self.options.timeout);
      });

      initialized = true;
    };

    var fill = function(){
      var origW = self.scope.width();
      var ratio;
      var fs, sw;
      var lineHeight = self.scope.data('line-height') || 0.8;

      self.scope.css({
        'display': 'inline',
        'font-size': baseS
      });

      sw    = self.scope.width();
      ratio = origW / sw;
      fs    = baseS * ratio;

      self.scope.css({
        'display':     'block',
        'white-space': 'nowrap',
        'font-size':    fs.toString() + 'px',
        'line-height':  lineHeight,
        'margin-bottom': baseS * 2
      });

      self.scope.fadeTo(self.options.fadeDuration, 1);
    };

    init();
  };

  $(document).on('DOMNodeInserted', function(e){
    $fn.addElements(e.target);
  });

  $(window).on('textfill load resize', function(){
    $fn.resize();
  });

  $.fn.textfill = function(options){
    var selector = this.selector;

    $fn.init();
    $fn.addSelector(selector, options);

    $(document).ready(function(){
      $fn.addElements(document);

      $(window).trigger('textfill');
    });
  };
})(jQuery);
