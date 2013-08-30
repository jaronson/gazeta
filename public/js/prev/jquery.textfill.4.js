;(function($, window, document, undefined){
  window.$textfill = function(options){
    $.extend(true, $textfill.defaultOptions, options);
  };

  var $fn = window.$textfill;

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
    queue:      [],
    runTimeout: 0,
    debug:      false,
    defaultOptions: {
      follow:           null, // none, parent, minimum
      baseFontSize:     null,
      minFontSize:      null,
      maxFontSize:      null,
      gutter:           null,
      gutterLeft:       null,
      gutterRight:      null,
      textWrapElement:  'span',
      lineWrapClass:    'textfill-line',
      wordWrapClass:    'textfill-word',
      tracking:         false,
      lineHeight:       null, // minimum, maximum, median
      animation: {
        resizeDuration: 0,
        fadeDuration:   0,
        easing:         'linear'
      },
      before: null,
      after:  null
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

  $fn.func.addScope = function($scope, options){
    for(var i = 0, l = $scope.length; i < l; ++i){
      $fn.func.addContainerSet($($scope[i]), $.extend(true, {}, options));
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
    var self      = this;
    var scope     = $scope;
    var children  = [];

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

    this.resize = function(){
      for(var i = 0, l = children.length; i < l; ++i){
        children[i].resize();
      }

      for(var i = 0, l = children.length; i < l; ++i){
        children[i].finalize();
      }

      scope.fadeTo(self.options().animation.fadeDuration, 1);
    };

    var addChildren = function(){
      var elements = scope.find(':css(display=block)');

      for(var i = 0, l = elements.length; i < l; ++i){
        addChild(elements[i], i);
      }

      if(children.length == 0){
        addChild(scope);
      }
    };

    var addChild = function(child, index){
      children.push(new $fn.obj.TextContainer(self, child, index));
    };

    var setOptions = function(givenOptions){
      options = $.extend({}, $fn.defaultOptions, givenOptions);

      self.options.minFontSize = $fn.util.parseSize(self.options.minFontSize);
      self.options.maxFontSize = $fn.util.parseSize(self.options.maxFontSize);
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

    var containerStyle = {};
    var lineStyle = {}

    var init = function(){
      addDataAttribute();
      setBaseFontSize();

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
      var opts  = self.options();
      var ratio = self.get().width() / self.comparator().width();

      self.calculatedFontSize = self.baseFontSize * ratio;

      if(opts.maxFontSize && (self.calculatedFontSize > opts.maxFontSize)){
        self.effectiveFontsize = opts.maxFontSize;
      }

      if(self.calculatedFontSize < opts.minFontSize){
        self.effectiveFontSize = opts.minFontSize;
      }

      self.effectiveFontSize = self.effectiveFontSize || self.calculatedFontSize;
      lineStyle['font-size'] = self.effectiveFontSize;
    };

    var setGutter = function(){
      if(!self.options().gutter || self.options().leftGutter || self.options().rightGutter){
        return false;
      }

      var opts = self.options();
      var gutter, leftGutter, rightGutter;

      if(opts.gutter){
        gutter = $fn.util.parseSize(opts.gutter, self.get().width());
        leftGutter = gutter;
        rightGutter = gutter;
      }

      if(opts.gutterLeft){
        leftGutter = $fn.util.parseSize(opts.gutterLeft, self.get().width());
      }

      if(opts.gutterRight){
        rightGutter = $fn.util.parseSize(opts.gutterright, self.get().width());
      }

      if(leftGutter){
        containerStyle['padding-left'] = leftGutter;
      }

      if(rightGutter){
        containerStyle['padding-right'] = rightGutter;
      }
    };

    var setLineHeight = function(){
      var lineHeightOpt = self.options().lineHeight;

      if(!lineHeightOpt){
        return false;
      }

      var lineHeight;
      var f = self.parent().getChildFontSize;

      if(lineHeightOpt){
        switch(lineHeightOpt){
          case 'minimum':
          case 'min':
            lineHeight = f('minimum') + 'px';
            break;
          case 'maximum':
          case 'max':
            lineHeight = f('maximum') + 'px';
            break;
          case 'median':
            lineHeight = f('median') + 'px';
            break;
          case 'mean':
          case 'average':
            lineHeight = f('mean') + 'px';
            break;
          default:
            lineHeight = lineHeightOpt;
        }

        lineStyle['line-height'] = lineHeight;
        containerStyle['min-height'] = lineHeight;
      }
    };

    var setTracking = function(){
      if(!self.options().tracking){
        return false;
      }

      var cw = self.get().width();
      var mw = self.minTextWidth;
      var tl = self.letterCount();
      var bs = self.baseFontSize;
      var fs = self.effectiveFontSize;
      var diff = cw - mw;

      var px, em;

      px = diff / (tl - 1);
      em = $fn.util.pxToEm(px, fs).toString() + 'em';

      self.get().html(wrapLetters(self.get()));

      var elements = self.get().find('span.textfill-letter');

      for(var i = 0, l = elements.length; i < l; ++i){
        if(i != elements.length - 1){
          $(elements[i]).css('padding-right', em);
        }
      }
    };

    var getTextWrapper = function(){
      var el = $('<' + self.options().textWrapElement + '/>').
        addClass(self.options().lineWrapClass);

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
            newHtml += '<span class="textfill-letter">' + newText[i] + '</span>';
          }
          $temp.append($(newHtml));
        } else {
          $(this).html(wrapLetters($(this)));
          $temp.append($(this));
        }
      });

      return $temp.html();
    };

    var wrapLine = function(html){
      lines = getTextWrapper();
      lines.html(html);

      return self.get().html(lines);
    };

    var wrapLines = function(){
      return wrapLine($.trim(self.get().html()));
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
      comparator.remove();
      comparator = null;
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

