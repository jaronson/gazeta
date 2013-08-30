;(function($, window, document, undefined){
  var $fn = window.$textfill = function(options){
    $.extend(true, $textfill.defaultOptions, options);
  };

  $.extend($fn, {
    util: {},
    func: {},
    obj:  {},

    initialized: false,
    screenWidth: {
      current: null,
      last: null
    },

    emBase:     16,
    scope:      [],
    debug:      false,
    defaultOptions: {
      baseFontSize:     null,
      minFontSize:      null,
      maxFontSize:      null,
      gutter:           null,
      fontSize:         null, // minimum, maximum, median, mean
      lineHeight:       null, // minimum, maximum, median, mean
      eachWord:         false,
      breakpoints:      [],
      textWrapElement:  'span',
      lineWrapClass:    'textfill-line',
      wordWrapClass:    'textfill-word',
      letterWrapClass:  'textfill-letter',
      applyTracking:    false,
      animation: {
        resizeDuration: 0,
        fadeDuration:   0,
        easing:         'swing'
      }
    }
  });

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

    var observeWindowResize = function(){
      $(window).on('resize', function(){
        $fn.func.updateScreenWidth();
      });
    };

    addBlockSelector();
    setEmBase();
    observeWindowResize();

    return $fn.initialized = true;
  };

  $fn.logger = {
    warn: function(message, vars){
      console.warn($fn.util.supplantString(message, vars));
    }
  };

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
      }
    }
    return null;
  };

  $fn.util.supplantString = function(s, o) {
    if(typeof o == 'undefined'){
      return s;
    }

    return s.replace(/{([^{}]*)}/g, function (a, b) {
      var r = o[b];
      return typeof r === 'string' || typeof r === 'number' ? r : a;
    });
  };

  $fn.func.addScope = function($scope, options){
    for(var i = 0, l = $scope.length; i < l; ++i){
      var s = $($scope[i]);

      if(!s.attr('data-textfill')){
        $fn.func.addContainerSet(s, $.extend(true, {}, options));
      }
    }
  };

  $fn.func.addContainerSet = function($scope, options){
    var containerSet = new $fn.obj.ContainerSet($scope, options);
    $fn.scope.push(containerSet);
    return containerSet;
  };

  $fn.func.screenWidthChanged = function(){
  return true;
    return !$fn.screenWidth.last || ($fn.screenWidth.current != $fn.screenWidth.last);
  };

  $fn.func.updateScreenWidth = function(){
    $fn.screenWidth.last = $fn.screenWidth.current;
    $fn.screenWidth.current = $(window).width();

    if($fn.func.screenWidthChanged()){
      for(var i = 0, l = $fn.scope.length; i < l; ++i){
        $fn.scope[i].resize();
      }
    }
  };

  $fn.obj.ContainerSet = function($scope, options){
    var self     = this;
    var scope    = $scope;
    var children = [];

    var breakpoint     = false;
    var lastBreakpoint = false;

    var initialOptions  = options;
    var initialContents = scope.html();

    this.options = function(){
      return options;
    };

    this.children = function(){
      return children;
    };

    this.childFontSizes = function(){
      return self.children().map(function(child){
        return child.effectiveFontSize;
      });
    };

    this.getChildFontSize = function(key){
      var methods = {
        'minimum': $fn.util.arrayMin,
        'maximum': $fn.util.arrayMax,
        'median':  $fn.util.arrayMedian,
        'mean':    $fn.util.arrayMean
      };

      return methods[key](self.childFontSizes());
    };

    this.redraw = function(){
      if(typeof breakpoint != 'number'){
        var opts = $.extend({}, initialOptions, breakpoint);
        setOptions(opts);
      } else {
        setOptions(initialOptions);
      }

      scope.html(initialContents);
      children = [];

      if(!self.options().disable){
        addChildren();
        self.resize();
      }
    };

    this.resize = function(){
      if(hasBreakpoint()){
        self.redraw();
      } else {
        for(var i = 0, l = children.length; i < l; ++i){
          children[i].resize();
        }

        for(var i = 0, l = children.length; i < l; ++i){
          children[i].finalize();
        }

        scope.fadeTo(self.options().animation.fadeDuration, 1);
      }
    };

    var addChildren = function(){
      var elements = scope.find(':css(display=block)');

      if(self.options().eachWord){
        var html  = scope.html();
        var words = $.trim(html).split(' ');
        scope.html('');

        for(var i = 0, l = words.length; i < l; ++i){
          var e = $('<div class="textfill-word">');
          e.html(words[i]).appendTo(scope);
          addChild(e, i);
        }
      } else if(elements.length > 0){
        for(var i = 0, l = elements.length; i < l; ++i){
          addChild(elements[i], i);
        }
      }

      if(children.length == 0){
        addChild(scope);
      }
    };

    var addChild = function(child, index){
      children.push(new $fn.obj.TextContainer(self, child, index));
    };

    var hasBreakpoint = function(){
      var bp = findBreakpoint();

      if(bp != breakpoint){
        lastBreakpoint = breakpoint;
        breakpoint = bp;
        return true;
      }

      return false;
    };

    var findBreakpoint = function(){
      var sw = $(window).width();
      var breakpoints = self.options().breakpoints;

      for(var i = 0, l = breakpoints.length; i < l; ++i){
        var bw = breakpoints[i].screenWidth;

        if(sw <= bw){
          return breakpoints[i];
        }
      }

      return -1;
    };

    var setOptions = function(givenOptions){
      options = $.extend({}, $fn.defaultOptions, givenOptions);

      options.minFontSize = $fn.util.parseSize(options.minFontSize);
      options.maxFontSize = $fn.util.parseSize(options.maxFontSize);

      if(options.breakpoints){
        options.breakpoints = options.breakpoints.map(function(b){
          b.screenWidth = parseInt(b.screenWidth);
          return b;
        }).sort(function(a,b){
          return b.screenWidth < a.screenWidth;
        });
      }
    };

    var init = function(){
      setOptions(options);
      addChildren();
      self.resize();
    };

    init();
  };

  $fn.obj.TextContainer = function(parent, element, index){
    var self   = this;
    var lines;
    var comparator;
    var lineSelector;
    var wordSelector;
    var letterSelector;

    var leftGutter  = 0;
    var rightGutter = 0;

    var containerStyle = {};
    var lineStyle = {}

    var init = function(){

      addDataAttribute();
      setBaseFontSize();

      lineSelector   = self.options().textWrapElement + '.' + self.options().lineWrapClass;
      wordSelector   = self.options().textWrapElement + '.' + self.options().wordWrapClass;
      letterSelector = self.options().textWrapElement + '.' + self.options().letterWrapClass;

      wrapLines();
    };

    this.isFirstChild = function(){
      return index == 0;
    }

    this.isLastChild = function(){
      return index == (parent.children().length - 1)
    };

    this.get = function(){
      return $(element);
    };

    this.lines = function(){
      return lines;
    };

    this.comparator = function(){
      return comparator;
    };

    this.letterCount = function(){
      return $.trim(self.lines().text()).length;
    };

    this.options = function(){
      return parent.options();
    };

    this.parent = function(){
      return parent;
    };

    this.resize = function(){
      createComparator();
      self.resetValues();

      setWhiteSpace();
      setGutter();
      setFontSize();
    };

    this.finalize = function(){
      setConformedFontSize();
      setTracking();
      setLineHeight();

      self.lines().animate(lineStyle,
        self.options().animation.resizeDuration,
        self.options().animation.easing
      );
      self.get().animate(containerStyle,
        self.options().animation.resizeDuration,
        self.options().animation.easing
      );
      destroyComparator();
    };

    this.resetValues = function(){
      lineStyle = {};
      containerStyle = {};

      self.calculatedFontSize = null;
      self.effectiveFontSize  = null;
    };

    var addDataAttribute = function(){
      self.get().attr('data-textfill', 'true');
    };

    var setBaseFontSize = function(){
      self.baseFontSize = $fn.util.parseSize(self.options().baseFontSize) || $fn.emBase;
    };

    var setWhiteSpace = function(){
      self.get().css('white-space', 'nowrap');
    };

    var setFontSize = function(){
      var opts   = self.options();
      var cw     = self.get().width();
      var tw     = self.comparator().width();
      var ratio  = cw / tw;

      self.calculatedFontSize = self.baseFontSize * ratio;

      if(opts.maxFontSize && (self.calculatedFontSize > opts.maxFontSize)){
        self.effectiveFontSize = opts.maxFontSize;
      }

      if(self.calculatedFontSize < opts.minFontSize){
        self.effectiveFontSize = opts.minFontSize;
      }

      self.effectiveFontSize = self.effectiveFontSize || self.calculatedFontSize;
      lineStyle['font-size'] = self.effectiveFontSize;
    };

    var setGutter = function(){
      if(!self.options().gutter){
        return false;
      }

      var opts = self.options();
      var gutter;

      if(opts.gutter){
        if(typeof opts.gutter == 'object' && opts.gutter != null){
          if(opts.gutter.left){
            leftGutter = $fn.util.parseSize(opts.gutter.left, self.get().width());
          }

          if(opts.gutter.right){
            rightGutter = $fn.util.parseSize(opts.gutter.right, self.get().width());
          }
        } else {
          leftGutter = rightGutter = $fn.util.parseSize(opts.gutter, self.get().width()) / 2;
        }
      }

      if(leftGutter){
        containerStyle['padding-left'] = leftGutter;
      }

      if(rightGutter){
        containerStyle['padding-right'] = rightGutter;
      }
    };

    var getSiblingFontSize = function(opt){
      var f = self.parent().getChildFontSize;
      var value;

      switch(opt){
        case 'minimum':
        case 'min':
          value = f('minimum') + 'px';
          break;
        case 'maximum':
        case 'max':
          value = f('maximum') + 'px';
          break;
        case 'median':
          value = f('median') + 'px';
          break;
        case 'mean':
        case 'average':
          value = f('mean') + 'px';
          break;
        default:
          value = false;
      }

      return value;
    };

    var parseConformOpt = function(optName){
      var opt = self.options()[optName];

      if(typeof opt == 'object' && opt != null){
        var fontSize = getSiblingFontSize(opt.conformTo);

        if(!fontSize){
          $fn.logger.warn('Invalid option: {a}.{b}', { a: optName, b: opt.conformTo });
        }

        return fontSize;
      } else if(typeof opt == 'undefined'){
        return false;
      } else {
        return opt;
      }
    };

    var setConformedFontSize = function(){
      var fontSize = parseConformOpt('fontSize');

      if(fontSize){
        lineStyle['font-size'] = fontSize;
      }
    };

    var setLineHeight = function(){
      var lineHeight = parseConformOpt('lineHeight');

      if(lineHeight){
        lineStyle['line-height'] = lineHeight;
        containerStyle['min-height'] = lineHeight;
      }
    };

    var setTracking = function(){
      if(!self.options().applyTracking){
        return false;
      }

      var cw = self.get().width();
      var mw = self.comparator().width();
      var tl = self.letterCount();
      var bs = self.baseFontSize;
      var fs = self.effectiveFontSize;
      var diff = cw - mw;

      var px, em;

      px = diff / (tl - 1);
      em = $fn.util.pxToEm(px, fs).toString() + 'em';

      var elements = self.get().find(letterSelector);

      for(var i = 0, l = elements.length; i < l; ++i){
        if(i != elements.length - 1){
          $(elements[i]).css('padding-right', em);
        }
      }
    };

    var getTextWrapper = function(className){
      var className = className || self.options().lineWrapClass;
      var el = $('<' + self.options().textWrapElement + '/>').addClass(className);

      if($fn.debug){
        el.attr('id', $fn.util.guid());
      }

      return el;
    };

    var wrapLetters = function($target){
      var $temp = $('<div/>');
      var nodes = $target.contents().clone();

      nodes.each(function(){
        if(this.nodeType == 3){ // text
          var newHtml = '';
          var newText = this.wholeText;

          for(var i = 0, l = newText.length; i < l; ++i){
            newHtml += "<" +
              self.options().textWrapElement + " class='" + self.options().letterWrapClass + "'>" +
              newText[i] + "</" + self.options().textWrapElement + ">";
          }
          $temp.append($(newHtml));
        } else {
          $(this).html(wrapLetters($(this)));
          $temp.append($(this));
        }
      });

      return $temp.html();
    };

    var wrapWord = function(html){
      return getTextWrapper(self.options().wordWrapClass).html(html);
    };

    var wrapLines = function(){
      var html = $.trim(self.get().html());
        lines = getTextWrapper();
        lines.html(html);
        self.get().html(lines);

      if(self.options().applyTracking){
        self.get().html(wrapLetters(self.get()));
      }
    };

    var createComparator = function(){
      comparator = lines.clone();
      innerText = $.trim(lines.text());

      comparator.hide().text(innerText).
        removeClass().
        addClass('textfill-comparator').
        css('font-size', self.baseFontSize).
        appendTo(self.get());
    };

    var destroyComparator = function(){
      $('.textfill-comparator').remove();
    };

    init();
  };

  $(document).ready(function(){
    $fn.init();
  });

  $.fn.textfill = function(options){
    var start = function(evt){
      $fn.func.addScope($(evt.data.selector), evt.data.options);
    };

    $(window).load({ selector: this.selector, options: options }, start);
  };
})(jQuery, this, this.document);
