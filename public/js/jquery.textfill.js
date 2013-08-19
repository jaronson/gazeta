;(function($, window, document, undefined){
  window.TextFill = {
    initialized: false,
    screenWidth: {
      current: null,
      last: null
    },
    emBase: 16,
    scope:  [],
    queue:  {
      default: [],
      parent:  [],
      minimum: []
    },
    debug:  false
  };

  var $fn = window.TextFill;

  $fn.defaultOptions = {
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
    applyTracking:    false,
    resizeAnimation:  {
      speed:  0,
      easing: 'linear'
    },
    before: null,
    after:  null,
    lastSibling: false
  };

  $fn.util  = {};
  $fn.func  = {};

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
          if(!base){ console.log('Warning: calculating percentage with no base given'); }
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

  $fn.func.addElement = function(element, options, parent){
    if($.trim($(element).text()) == ''){
      return false;
    } else if($(element).attr('data-textfill') == 'true'){
      return false;
    }

    var scopedElement = new $fn.ScopedElement(element, options);
    $fn.scope.push(scopedElement);
    return scopedElement;
  };

  $fn.func.addScope = function($scope, options){
    var $children = $scope.find(':css(display=block)');
    var opts = options || {};

    if($children.length > 0){
      opts.parentScope = $scope;

      $children.each(function(i){
        if(i == $children.length - 1){
          opts.lastSibling = true;
        }

        $fn.func.addElement(this, opts);
      });
    } else {
      $scope.each(function(){
        $fn.func.addElement(this, opts);
      });
    }
  };

  $fn.func.findByParent = function(scope){
    return $fn.scope.filter(function(scopedElement){
      return scopedElement.parentScope == scope;
    });
  };

  $fn.func.queueResize = function(){
    var scopedElement;
    var queueName;

    if(typeof arguments[0] == 'string'){
      queueName     = arguments[0];
      scopedElement = arguments[1];
    } else {
      queueName     = 'default';
      scopedElement = arguments[0];
    }

    if($fn.func.screenWidthChanged()){
      $fn.queue[queueName].push(scopedElement.resize);
    };
  };

  $fn.func.dequeueAll = function(){
    for(key in $fn.queue){
      $.each($fn.queue[key], function(i, func){
        func();
      });
    }
  };

  $fn.func.screenWidthChanged = function(){
    return !$fn.screenWidth.last || ($fn.screenWidth.current != $fn.screenWidth.last);
  };

  $fn.func.updateScreenWidth = function(){
    $fn.screenWidth.last = $fn.screenWidth.current;
    $fn.screenWidth.current = $(window).width();
  };

  $fn.SizeObject = function(scopedElement){
    var self = this;

    this.containerWidth = scopedElement.get().width();
    this.textWidth      = scopedElement.comparator().width();
    this.ratio          = this.containerWidth / this.textWidth;

    var calculatedSize = scopedElement.baseFontSize * this.ratio;
    var effectiveSize  = false

    var setEffectiveSize = function(){
      var opts = scopedElement.options;

      if(opts.maxFontSize && calculatedSize > opts.maxFontSize){
        effectiveSize = opts.maxFontSize;
      }

      if(opts.minFontSize && calculatedSize < opts.minFontSize){
        effectiveSize = opts.minFontSize;
      }
    };

    setEffectiveSize();

    this.fontSize = {
      calculated: calculatedSize,
      effective:  effectiveSize || calculatedSize
    };

    if($fn.debug){
      console.log(
        scopedElement.comparator().text(),
        $(window).width(),
        this.containerWidth,
        this.textWidth,
        this.ratio,
        scopedElement.baseFontSize
      );
    }
  };

  $fn.ScopedElement = function(element, options){
    var self = this;

    var initialized  = false;
    var stylesBefore = [];
    var stylesAfter  = [];
    var parentScope;
    var cachedSize;
    var comparator;

    this.textSelector = '*';
    this.lastSibling  = false;

    this.comparator = function(){
      return comparator;
    };

    this.get = function(){
      return $(self.element);
    };

    this.parentScope = function(){
      return parentScope;
    };

    this.queue = function(){
      return self.options.follow || 'default';
    };

    this.queueResize = function(){
      $fn.func.queueResize(self);
    };

    this.resize = function(){
      beforeResize();
      resizeText();
      afterResize();
    };

    this.siblings = function(){
      return $fn.scope.filter(function(e){
        if(e != self && e.parentScope() == self.parentScope()){
          return e;
        }
      });
    };

    this.size = function(){
      return self.cachedSize = getSizeObject();
    };

    this.text = function(){
      return self.get().find(this.textSelector);
    };

    this.textLength = function(){
      return $.trim(self.text().text().length);
    };

    var addStyle = function(when, styleObject){
      var container = when == 'before' ? stylesBefore : stylesAfter;

      return container.push(styleObject);
    };

    var afterResize = function(){
      if(typeof self.options.after == 'function'){
        $.proxy(self.options.after, self)();
      }

      $.each(stylesAfter, function(i, styleObject){
        self.get().css(styleObject);
      });

      destroyComparator();

      stylesBefore = [];
      stylesAfter  = [];
    };

    var beforeResize = function(){
      createComparator();

      $.each(stylesBefore, function(i, styleObject){
        self.get().css(styleObject);
      });

      if(typeof self.options.before == 'function'){
        $.proxy(self.options.before, self)();
      }
    };

    var createComparator = function(){
      comparator = self.text().clone();
      var text   = $.trim(self.text().text());

      return comparator.text(text).hide().
        removeClass().
        addClass('textfill-comparator').
        css('font-size', self.baseFontSize).
        appendTo(self.get());
    };

    var destroyComparator = function(){
      return comparator.remove();
    };

    var getSizeObject = function(){
      return new $fn.SizeObject(self);
    };

    var getTextWrapper = function(className){
      return $('<' + self.options.textWrapElement + '/>').addClass(className);
    };

    var resizeText = function(){
      var size = self.size();
      var styleObject = {};

      switch(self.options.follow){
        case 'parent':
        break;

        case 'minimum':
        break;

        default:
          styleObject['font-size'] = size.fontSize.effective;
      }

      return self.text().animate(styleObject,
        self.options.resizeAnimation.speed,
        self.options.resizeAnimation.easing
      );
    };

    var setBaseFontSize = function(){
      return self.baseFontSize = $fn.util.parseSize(self.options.baseFontSize) || $fn.emBase;
    };

    var setBlockStyle = function(){
      return addStyle('before', { 'display': 'block' });
    };

    var setGutter = function(){
      var gutter, leftGutter, rightGutter;
      var css = {};

      if(self.options.gutter){
        gutter = $fn.util.parseSize(self.options.gutter, self.get().width());
        leftGutter = gutter;
        rightGutter = gutter;
      }

      if(self.options.gutterLeft){
        leftGutter = $fn.util.parseSize(self.options.gutterLeft, self.get().width());
      }

      if(self.options.gutterRight){
        rightGutter = $fn.util.parseSize(self.options.gutterright, self.get().width());
      }

      if(leftGutter){
        css['padding-left'] = leftGutter;
      }

      if(rightGutter){
        css['padding-right'] = rightGutter;
      }

      return addStyle('before', css);
    };

    var setOptions = function(givenOptions){
      self.options = $.extend({}, $fn.defaultOptions, givenOptions);

      self.options.minFontSize = $fn.util.parseSize(self.options.minFontSize);
      self.options.maxFontSize = $fn.util.parseSize(self.options.maxFontSize);
    };

    var setParentScope = function(){
      return parentScope = self.options.parentScope;
    };

    var setTextSelector = function(){
      self.textSelector = self.options.textWrapElement + '.' + self.options.lineWrapClass;
    };

    var wrapLine = function(html){
      var line = getTextWrapper(self.options.lineWrapClass);

      return self.get().wrapInner(line);
    };

    var wrapLines = function(){
      if(self.options.wrapLines){
        self.get().css({ 'white-space': 'normal' });
      } else {
        self.get().css({ 'white-space': 'nowrap' });
      }

      var line = wrapLine($.trim(self.get().html()));

      return line.appendTo(self.get());
    };

    var init = function(){
      self.element = element;

      self.get().attr('data-textfill', 'true');

      setOptions(options || {});
      setParentScope();
      setBaseFontSize();
      setTextSelector();
      wrapLines();
      setBlockStyle();
      setGutter();

      $fn.func.queueResize(self.queue(), self);

      $(window).on('resize', self.queueResize);

      return initialized = true;
    };

    if(!initialized){
      init();
    }
  };

  $.fn.textfill = function(options){
    var init = function(evt){
      $fn.init();
      var $scope = $(evt.data.selector);
      $fn.func.addScope($scope, evt.data.options);
      $fn.func.dequeueAll();
    };

    $(window).load({
      selector: this.selector,
      options:  options
    }, init);
  };
})(jQuery, this, this.document)
