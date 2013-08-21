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
      animate: {
        resize: true,
        fade:   true
      },
      animation:  {
        interval: 0,
        speed:    0,
        easing:   'linear'
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

    $fn.func.dequeue();

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

  $fn.util.s4 = function(){
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };

  $fn.util.guid = function(){
    var s4 = $fn.util.s4;
    return 'textfill-' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };

  $fn.func.addScope = function($scope, options){
    $scope.each(function(i, scope){
      $fn.func.enqueue(scope, function(){
        $fn.func.addContainerSet($(scope), $.extend(true, {}, options));
      });
    });
  };

  $fn.func.addContainerSet = function($scope, options){
    var containerSet = new $fn.obj.ContainerSet($scope, options);
    $fn.scope.push(containerSet);
    return containerSet;
  };

  $fn.func.screenWidthChanged = function(){
    return !$fn.screenWidth.last || ($fn.screenWidth.current != $fn.screenWidth.last);
  };

  $fn.func.updateScreenWidth = function(){
    $fn.screenWidth.last = $fn.screenWidth.current;
    $fn.screenWidth.current = $(window).width();

    if($fn.func.screenWidthChanged()){
      $.each($fn.scope, function(i, set){
        set.resize();
      });
    }
  };

  $fn.func.enqueue = function(target, method){
    var action = new $fn.obj.Action(target, method);
    $fn.queue.push(action);
    return action;
  };

  $fn.func.dequeue = function(target){
    $fn.queue = $.grep($fn.queue, function(action, i){
      if(target){
        if(action.target == target){ 
          return $fn.func.runAction(action);
        } else {
          return false;
        }
      } else {
        return $fn.func.runAction(action);
      }
    });
  };

  $fn.func.runAction = function(action){
    var run = function(){
      $.proxy(action.method, action.target)();
    };

    if(action.runTimeout && action.runTimeout > 0){
      $fn.runTimeout += action.runTimeout;

      action.timeout = setTimeout(function(){
        run(action);
        $fn.runTimeout -= action.runTimeout;
      }, $fn.runTimeout);
    } else {
      run(action);
    }

    return true;
  };

  $fn.obj.Action = function(target, method, runTimeout){
    var self = this;

    this.target     = target;
    this.method     = method;
    this.runTimeout = runTimeout;
    this.timeout    = null;

    var setRunTimeout = function(){
      if(!self.runTimeout && typeof self.target.options == 'function'){
        self.runTimeout = self.target.options().animation.interval;
      }
      self.runTimeout = self.runTimeout || 0;
    };

    setRunTimeout();
  };

  $fn.obj.ContainerSet = function($scope, options){
    var self = this;

    self.scope = $scope;

    var children = [];
    var minChildFontSize;
    var maxChildFontSize;
    var medianChildFontSize;
    var meanChildFontSize;

    self.children = function(){
      return children;
    };

    self.childFontSizes = function(){
      return self.children().map(function(child){
        return child.text().size().fontSize.effective;
      })
    };
    self.minChildFontSize = function(){
      return minChildFontSize = minChildFontSize || $fn.util.arrayMin(self.childFontSizes());
    };

    self.maxChildFontSize = function(){
      return maxChildFontSize = maxChildFontSize || $fn.util.arrayMax(self.childFontSizes());
    };

    self.meanChildFontSize = function(){
      return meanChildFontSize = meanChildFontSize || $fn.util.arrayMean(self.childFontSizes());
    };

    self.medianChildFontSize = function(){
      return medianChildFontSize = medianChildFontSize || $fn.util.arrayMax(self.childFontSizes());
    };

    self.options = function(){
      return options;
    };

    self.resize = function(){
      var callbacks = [];

      self.children().map(function(child){
        var result = child.resize();

        if(typeof result == 'function'){
          callbacks.push({ child: child, callback: result });
        }
      });

      callbacks.map(function(obj){
        $.proxy(obj.callback, obj.child)();
      });

      self.finalize();
    };

    self.finalize = function(){
      self.children().map(function(child){
        child.finalize();
      });
    };

    self.queueResize = function(){
      $fn.func.enqueue(self, self.resize);
      $fn.func.dequeue(self);
    };

    var addChild = function(child, index){
      var child = new $fn.obj.Container(self, child, index);
      children.push(child);
      return child;
    };

    var addChildren = function(){
      $(self.scope).find(':css(display=block)').each(function(i){
        addChild(this, i);
      });

      if(children.length == 0){
        addChild(self.scope);
      }
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

  $fn.obj.Container = function(parent, element, index){
    var self = this;

    self.element = element;

    var text;
    var styles = {};

    self.get = function(){
      return $(self.element);
    };

    self.firstChild = function(){
      return index == 0;
    }

    self.lastChild = function(){
      return index == self.parent().children().length - 1;
    };

    self.options = function(){
      return self.parent().options();
    };

    self.parent = function(){
      return parent;
    };

    self.text = function(){
      return text;
    };

    self.resize = function(){
      var result = self.text().resize();

      return function(){
        if(typeof result == 'function'){
          $.proxy(result, self.text())();
        }

        self.finalize();
      }
    };

    self.finalize = function(){
      self.text().finalize();

      applyStyles();

      self.parent().scope.fadeTo(self.options().animation.speed, 1);

      if(self.options().animate.fade){
        self.get().fadeTo(0,1);
      } else {
        self.get().fadeTo(0, 1);
      }
    };

    var addDataTextfillAttr = function(){
      self.get().attr('data-textfill', 'true');
    };

    self.addStyle = function(key, value){
      if(typeof key == 'string'){
        styles[key] = value;
      } else {
        styles = $.extend(styles, key);
      }
    };

    var addText = function(){
      if(self.options().wrapLines){
        self.addStyle('white-space', 'normal');
      } else {
        self.addStyle('white-space', 'nowrap');
      }
      return text = new $fn.obj.Text(self);
    };

    var applyStyles = function(){
      self.get().css(styles);
    };

    var setBaseFontSize = function(){
      return self.baseFontSize = $fn.util.parseSize(self.options.baseFontSize) || $fn.emBase;
    };

    var setBlockStyle = function(){
      self.addStyle('display', 'block');
    };

    var applyGutter = function(){
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

      self.addStyle(css);
    };

    var applyMargin = function(){
      self.addStyle({
        'margin-top': 0,
        'margin-bottom': 0
      });
    };

    var init = function(){
      addDataTextfillAttr();
      setBaseFontSize();
      addText();
      setBlockStyle();
      applyGutter();
    };

    init();
  };

  $fn.obj.Text = function(container){
    var self = this;
    var styles = {};

    var element;
    var comparator;
    var size;

    self.baseFontSize = function(){
      return self.container().baseFontSize;
    };

    self.comparator = function(){
      if(comparator){
        return comparator;
      } else {
        return comparator = new $fn.obj.Comparator(self);
      }
    };

    self.container = function(){
      return container;
    };

    self.get = function(){
      return $(element);
    };

    self.options = function(){
      return self.container().options();
    };

    self.resize = function(){
      self.size();

      switch(self.options().follow){
        case 'minimum':
          return self.resizeByMinimum;
        break;
        default:
          return self.resizeText;
      }
    };

    self.finalize = function(){
      resetSize();
      resetStyles();
      destroyComparator();
    };

    self.resizeByMinimum = function(){
      var siblingMin = self.container().parent().minChildFontSize();

      self.comparator().setWidthByMinimum(siblingMin);
      self.size().setSizeByMinimum(siblingMin);

      if(self.options().tracking){
        self.applyTracking();
      }

      self.resizeText();
    }

    self.resizeText = function(){
      var fontSize = self.size().fontSize.effective.toString() + 'px';

      addStyle('font-size', fontSize);

      self.applyLineHeight();

      applyStyles();
    };

    self.applyLineHeight = function(){
      // min, max, median, value
      var lineHeightOpt = self.options().lineHeight;
      var set = self.container().parent();
      var lineHeight;

      if(lineHeightOpt){
        switch(lineHeightOpt){
          case 'minimum':
          case 'min':
            lineHeight = set.minChildFontSize() + 'px';
            break;
          case 'maximum':
          case 'max':
            lineHeight = set.maxChildFontSize() + 'px';
            break;
          case 'median':
            lineHeight = set.medianChildFontSize() + 'px';
            break;
          case 'mean':
          case 'average':
            lineHeight = set.meanChildFontSize() + 'px';
            break;
          default:
            lineHeight = lineHeightOpt;
        }

        addStyle('line-height', lineHeight);
        self.container().addStyle('min-height', lineHeight);
      }
    };

    self.applyTracking = function(){
      var cw = self.size().containerWidth;
      var mw = self.size().minimumTextWidth;
      var tl = self.textLength();
      var fs = self.size().fontSize.effective;
      var bs = self.baseFontSize();
      var diff = cw - mw;

      var px, em;

      px = diff / (tl - 1);
      em = $fn.util.pxToEm(px, fs).toString() + 'em';

      self.get().html(wrapLetters(self.get()));

      var $scope = self.get().find('span.textfill-letter');

      $scope.each(function(i){
        var pos = i + 1;

        if(pos != $scope.length){
          $(this).css('padding-right', em);
        }
      });
    };

    self.size = function(){
      if(size){
        return size;
      } else {
        return size = new $fn.obj.Size(self);
      }
    };

    self.textLength = function(){
      return $.trim(self.get().text()).length;
    }

    var addStyle = function(key, value){
      if(typeof key == 'string'){
        styles[key] = value;
      } else {
        styles = $.extend(styles, key);
      }
    };

    var applyStyles = function(){
      if(self.options().animate.resize){
        self.get().animate(styles,
          self.options().animation.speed,
          self.options().animation.easing
        );
      } else {
        self.get().css(styles);
      }
    };

    var destroyComparator = function(){
      if(comparator){
        comparator.destroy();
      }
      comparator = null;
    };

    var getTextWrapper = function(){
      var el = $('<' + self.options().textWrapElement + '/>').
        addClass(self.options().lineWrapClass);

      if($fn.debug){
        el.attr('id', $fn.util.guid());
      }

      return el;
    };

    var resetSize = function(){
      size = null;
    };

    var resetStyles = function(){
      styles = {};
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
          $(this).html(self.wrapLetters($(this)));
          $temp.append($(this));
        }
      });

      return $temp.html();
    };

    var wrapLine = function(html){
      element = getTextWrapper();
      element.html(html);

      return self.container().get().html(element);
    };

    var wrapLines = function(){
      return wrapLine($.trim(self.container().get().html()));
    };

    var init = function(){
      wrapLines();
    };

    init();
  };

  $fn.obj.Comparator = function(text){
    var self = this;
    var text = text;
    var element;
    var innerText;

    self.get = function(){
      return $(element);
    };

    self.destroy = function(){
      return self.get().remove();
    };

    self.text = function(){
      return text;
    };

    self.innerText = function(){
      return innerText;
    };

    self.setWidthByMinimum = function(minFontSize){
      this.get().css({ 'font-size': minFontSize });
    };

    var create = function(){
      element = self.text().get().clone();
      innerText = $.trim(self.text().get().text());

      return self.get().text(innerText).hide().
             removeClass().
             addClass('textfill-comparator').
             css('font-size', self.text().baseFontSize()).
             appendTo(self.text().container().get());
    };

    var init = function(){
      create();
    };

    init();
  };

  $fn.obj.Size = function(text, options){
    var self = this;

    var options = $.extend({}, options, text.options());

    self.containerWidth = text.container().get().width();
    self.textWidth      = text.comparator().get().width();
    self.ratio          = self.containerWidth / self.textWidth;

    var calculatedSize = text.baseFontSize() * self.ratio;
    var effectiveSize  = false;

    self.setSizeByMinimum = function(minimum){
      self.fontSize.minimum   = minimum;
      self.fontSize.effective = minimum;
      self.minimumTextWidth   = text.comparator().get().width();
    };

    var setEffectiveSize = function(){
      if(options.maxFontSize && calculatedSize > options.maxFontSize){
        effectiveSize = options.maxFontSize;
      }

      if(options.minFontSize && calculatedSize < options.minFontSize){
        effectiveSize = options.minFontSize;
      }
    };

    setEffectiveSize();

    self.fontSize = {
      calculated: calculatedSize,
      effective:  effectiveSize || calculatedSize,
      minimum:    null,
      median:     null
    };
  };

  $(window).load($fn.init);

  $.fn.textfill = function(options){
    $fn.func.addScope($(this), options);
  };
})(jQuery, this, this.document);
