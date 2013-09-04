;(function($, window, document, undefined){
  var $fn = $.textfill = function(options){
    $fn.func.addGlobalCallbacks(options);
    $.extend(true, $.textfill.defaultOptions, options);

    $fn.func.runCallbacks('before');
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
    scopeCount: 0,
    scope:      [],
    debug:      false,
    callbacks:  {},
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
      marginLast:       null,
      before:    null,
      complete:  null,
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
      } else if(typeof value == 'function'){
        return value;
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

      var c = s.find('[data-textfill="true"]').length;

      if(c == 0){
        $fn.func.addContainerSet(s, $.extend(true, {}, options));
      }
    }

    $fn.scopeCount--;

    if($fn.scopeCount == 0){
      $fn.func.runCallbacks('complete');
    }
  };

  $fn.func.addContainerSet = function($scope, options){
    var containerSet = new $fn.obj.ContainerSet($scope, options);
    $fn.scope.push(containerSet);
    return containerSet;
  };

  $fn.func.screenWidthChanged = function(){
    return !$fn.screenWidth.last || ($fn.screenWidth.current != $fn.screenWidth.last);
  };

  $fn.func.addGlobalCallbacks = function(options){
    var callbackKeys = [
      'before',
      'complete'
    ];

    for(var i = 0, l = callbackKeys.length; i < l; ++i){
      var k = callbackKeys[i];
      var c = options[k];

      if(typeof c == 'function'){
        $fn.callbacks[k] = c;
        delete options[k];
      }
    }
  };

  $fn.func.runCallbacks = function(when){
    if(when){
      var f = $fn.callbacks[when];

      if(typeof f == 'function'){
        return $.proxy(f, $fn)();
      }
    } else {
      for(key in $fn.callbacks){
        var f = $fn.callbacks[key];
        if(typeof f == 'function'){
          return $.proxy(f, $fn)();
        }
      }
    }
    return false;
  };

  $fn.func.updateScreenWidth = function(){
    $fn.screenWidth.last = $fn.screenWidth.current;
    $fn.screenWidth.current = $(window).width();

    if($fn.func.screenWidthChanged()){
      $fn.func.runCallbacks('before');

      for(var i = 0, l = $fn.scope.length; i < l; ++i){
        $fn.scope[i].resize();
      }

      $fn.func.runCallbacks('complete');
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
    var initialOpacity  = scope.css('opacity');

    this.children = function(){
      return children;
    };

    this.childFontSizes = function(){
      return self.children().map(function(child){
        return child.effectiveFontSize;
      });
    };

    this.get = function(){
      return $(scope);
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

    this.options = function(){
      return options;
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
        runCallbacks('before');

        for(var i = 0, l = children.length; i < l; ++i){
          children[i].resize();
        }

        for(var i = 0, l = children.length; i < l; ++i){
          children[i].finalize();
        }

        setBaseline();

        scope.fadeTo(self.options().animation.fadeDuration, initialOpacity);
        runCallbacks('complete');
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

    var runCallbacks = function(when){
      var f = self.options()[when];

      if(typeof f == 'function'){
        return $.proxy(f, self)();
      }

      return false;
    };

    var setBaseline = function(){
      /*
      var b = self.options().baseline;

      if(typeof b != 'undefined' && b != null){
        var ch = $(b).height();
        var sh = self.get().height();
        var m  = ch - sh;
        m = m + ($fn.emBase - (m % $fn.emBase));

        self.get().css({ 'margin-top': m + 'px' });
      }
      */
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
    var resizeRatio;

    var leftGutter  = 0;
    var rightGutter = 0;

    var containerStyle = {};
    var lineStyle      = {}

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

    this.containerWidth = function(){
      var w = self.options().comparisonWidth;

      if(w){
        if(typeof w == 'function'){
          w = $.proxy(w, self)();
        }
      } else if(self.get().css('position') == 'absolute'){
        w = self.get().parent().width();
      } else {
        w = self.get().width();
      }

      return w;
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
      setLineHeight();
      setMargin();

      animate(self.lines(), lineStyle);
      animate(self.get(), containerStyle);

      setTracking();

      destroyComparator();
    };

    this.resetValues = function(){
      lineStyle      = {};
      containerStyle = {};

      self.calculatedFontSize = null;
      self.effectiveFontSize  = null;
    };

    var addDataAttribute = function(){
      self.get().attr('data-textfill', 'true');
    };

    var animate = function($el, styleObj){
      $el.animate(styleObj,
        self.options().animation.resizeDuration,
        self.options().animation.easing
      );
    };

    var getFontSizeOption = function(key){
      var value = self.options()[key + 'FontSize'];

      if(typeof value == 'function'){
        value = $.proxy(value, self)();
        return value;
      }

      return value;
    };

    var getSiblingFontSize = function(opt){
      var f = self.parent().getChildFontSize;
      var value;

      switch(opt){
        case 'minimum':
        case 'min':
          value = f('minimum');
          break;
        case 'maximum':
        case 'max':
          value = f('maximum');
          break;
        case 'median':
          value = f('median');
          break;
        case 'mean':
        case 'average':
          value = f('mean'); 
          break;
        default:
          value = false;
      }

      return value;
    };

    var getTextWrapper = function(className){
      var className = className || self.options().lineWrapClass;
      var el = $('<' + self.options().textWrapElement + '/>').addClass(className);

      if($fn.debug){
        el.attr('id', $fn.util.guid());
      }

      return el;
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

    var setBaseFontSize = function(){
      self.baseFontSize = $fn.util.parseSize(self.options().baseFontSize) || $fn.emBase;
    };

    var setFontSize = function(){
      var opts  = self.options();
      var cw    = self.containerWidth();
      var tw    = self.comparator().width();
      var ratio = resizeRatio = cw / tw;

      var max = getFontSizeOption('max');
      var min = getFontSizeOption('min');
      var ef;

      self.calculatedFontSize = self.baseFontSize * ratio;

      if(max && (self.calculatedFontSize > max)){
        ef = max;
      }

      if(self.calculatedFontSize < min){
        ef = min
      }

      ef = ef || self.calculatedFontSize;
      ef = Math.round(ef);
      self.effectiveFontSize = ef;

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

    var setConformedFontSize = function(){
      self.conformedFontSize = parseConformOpt('fontSize');

      if(self.conformedFontSize){
        lineStyle['font-size'] = self.conformedFontSize;
      }
    };

    var setLineHeight = function(){
      var lineHeight = parseConformOpt('lineHeight');
      var fs         = self.conformedFontSize || self.effectiveFontSize;

      if(typeof lineHeight == 'undefined' || lineHeight == null){
        var lh = fs * 0.8;
        lh = lh + ($fn.emBase - (lh % $fn.emBase));
        lineHeight = lh;
      }

      lineStyle['line-height'] = lineHeight;
    };

    var setMargin = function(){
      var m = self.options().margin;

      if(typeof m == 'undefined' || m == null){
        m = $fn.emBase * 2;
      }

      if(self.isLastChild()){
        var ml = self.options().marginLast;
        if(typeof ml != 'undefined' && ml != null){
          m = ml;
        }
      }

      containerStyle['margin-bottom'] = m;
    };

    var setTracking = function(){
      if(!self.options().applyTracking){
        return false;
      }

      if(self.get().width() <= self.lines().width()){
        return false;
      }

      var px       = self.get().width() / (self.letterCount() - 1);
      var elements = self.get().find(letterSelector);

      for(var i = 0, l = elements.length; i < l; ++i){
        var $e = $(elements[i]);
        if($e.text() == ' '){
          continue;
        }

        var s  = px - $e.width();
        var styleObj = {};

        if(i == 0){
          styleObj['padding-right'] = (s / 2) + 'px';
        } else if(i == elements.length - 1){
        } else {
          styleObj['padding-right'] = (s / 2) + 'px';
          styleObj['padding-left'] = (s / 2) + 'px';
        }

        $e.css(styleObj);
      }
    };

    var setWhiteSpace = function(){
      self.get().css('white-space', 'nowrap');
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

      if(self.options().applyTracking){
        lines.html(wrapLetters(self.get()));
      }

      self.get().html(lines);

    };

    var createComparator = function(){
      comparator = lines.clone();
      innerText = $.trim(lines.text());

      comparator.hide().text(innerText).
        removeClass().
        addClass('textfill-comparator').
        css({
          'font-size': self.baseFontSize,
          'position': 'static'
        }).appendTo(self.get());
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
    $.textfill.scopeCount++;

    var start = function(evt){
      $fn.func.addScope($(evt.data.selector), evt.data.options);
    };

    $(window).load({ selector: this.selector, options: options }, start);
  };
})(jQuery, this, this.document);
