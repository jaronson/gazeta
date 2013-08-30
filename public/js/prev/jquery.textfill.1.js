;(function($){
  $.fn.textfill = function(opts){
    var $fn = this;

    $fn.emBase       = 16;    // Set via init or opts. Defaults to body text size.
    $fn.cssUpdates   = [];    // Track reversible css updates.
    $fn.screenWidth  = null;  // Track screen in queueing fills.

    $fn.defaultOptions = {
      screenWidthChanged: function(){
        return this.currentScreenWidth != this.lastScreenWidth;
      },
      currentScreenWidth: null,
      lastScreenWidth:    null,

      resizeSpeed:      0,
      fadeInSpeed:      0,
      emBase:           $fn.emBase,
      minFontSize:      $fn.emBase,
      maxFontSize:      null,
      gutter:           null,
      gutterLeft:       null,
      gutterRight:      null,
      lineWrapClass:    'textfill-line',
      wordWrapClass:    'textfill-word',
      letterWrapClass:  'textfill-char',
      style:            {},
      breakpoints:      [],
      wrapLines:        false,
      eachWord:         false,
      applyTracking:    false,
      disable:          false
    };

    $fn.sizeOptionKeys = [
      'emBase',
      'minFontSize',
      'maxFontSize'
    ];

    var revertChanges = function(scope){
      var toSplice = [];

      for(var i = 0, l = $fn.cssUpdates.length; i < l; ++i){
        var update = $fn.cssUpdates[i];

        if(update.scope == scope){
          scope.css(update.css);
          toSplice.push(i);
        }
      }

      for(var i = 0, l = toSplice.length; i < l; ++i){
        $fn.cssUpdates.splice(i, 1);
      }
    };

    var emToPx = function(em){
      return em * $fn.emBase;
    };

    var pxToEm = function(px, base){
      var base = base || $fn.emBase;
      return px / base;
    };

    var parseSize = function(value, base){
      if(value){
        if(typeof value == 'number'){
          return value;
        } else if(typeof value == 'string'){
          if(value.match(/[\d]%$/)){
            if(!base){ console.log('Warning: calculating percentage with no base given'); }
            return base * (parseFloat(value) / 100);
          } else if(value.match(/[\d]em$/)){
            return emToPx(parseFloat(value));
          } else {
            return parseFloat(value);
          }
        }
      }

      return null;
    };

    var parseSizeOptions = function(obj){
      $.each($fn.sizeOptionKeys, function(i, key){
        obj[key] = parseSize(obj[key]);
      });

      return obj;
    };

    var getTextWrapper = function(className){
      return $('<span/>').addClass(className);
    };

    var getTextObject = function(element){
      var size = parseSize($(element).css('font-size'));

      return {
        element:  $(element),
        width:    $(element).width(),
        fontSize: size
      };
    };

    var getContainerObject = function(element){
      return {
        element:    $(element),
        width:      $(element).width(),
        height:     $(element).height(),
        lineHeight: pxToEm(parseSize($(element).css('line-height')), parseSize($(element).css('font-size')))
      };
    };

    var wrapLetter = function(letter, opts){
      return getTextWrapper(opts.letterWrapClass).text(letter);
    };

    var wrapWord = function(word, opts){
      return getTextWrapper(opts.wordWrapClass).text(word);
    };

    var wrapLine = function(text, opts){
      var line = getTextWrapper(opts.lineWrapClass);

      $.trim(text).split(' ').map(function(word){
        var word = opts.eachWord ? word : word + ' ';
        wrapWord(word, opts).appendTo(line);
      });

      return line;
    };

    var wrapLines = function(scope, opts){
      if(scope.attr('data-textfill') == 'true'){
        return;
      }

      var containerObj = getContainerObject(scope);

      scope.attr('data-textfill', 'true').html('');

      if(opts.wrapLines){
        scope.css({ 'white-space': 'normal' });
      } else {
        scope.css({ 'white-space': 'nowrap' });
      }

      wrapLine(opts.text, opts).appendTo(scope);
    };

    var unwrapLines = function(scope, opts){
      if(scope.attr('data-textfill') == 'false'){
        return;
      }

      revertChanges(scope);
      scope.attr('data-textfill', 'false').html(opts.text);
    };

    var getLineSize = function(containerObj, textObj, opts){
      var ratio     = (containerObj.width / textObj.width);
      var resized   = ratio * textObj.fontSize;

      if(opts.maxFontSize && (resized > opts.maxFontSize)){
        resized = opts.maxFontSize;
      }

      if(resized < opts.minFontSize){
        resized = opts.minFontSize;
      }

      return resized;
    };

    var getLineTracking = function(sizeObj){
      var diff = sizeObj.calculatedSize - sizeObj.effectiveSize;
      var px, em;

      if(diff == 0){
        return 'normal';
      }

      px = diff / sizeObj.length / 2;
      em = pxToEm(px);

      return em.toString() + 'em';
    };

    var setContainerGutter = function(scope, opts){
      var gutter, leftGutter, rightGutter;
      var css = {};

      if(opts.gutter){
        gutter = parseSize(opts.gutter, scope.width());
        leftGutter = gutter;
        rightGutter = gutter;
      }

      if(opts.gutterLeft){
        leftGutter = parseSize(opts.gutterLeft, scope.width());
      }

      if(opts.gutterRight){
        rightGutter = parseSize(opts.gutterRight, scope.width());
      }

      if(leftGutter){
        scope.css('padding-left', leftGutter);
      }

      if(rightGutter){
        scope.css('padding-right', rightGutter);
      }
    };

    var updateLineCss = function(line, sizeObj, opts){
      var css = {
        'font-size':   sizeObj.effectiveSize + 'px',
        'line-height': sizeObj.lineHeight
      };

      if(opts.eachWord){
        css['display'] = 'block';

        if(opts.applyTracking){
          css['letter-spacing'] = getLineTracking(sizeObj);
        }
      }

      if(opts.center){
        css['text-align'] = 'center';
      }

      if(opts.resizeSpeed > 0){
        $(line).css('display', css['display']);
        $(line).animate(css, {
          duration: opts.resizeSpeed,
          done: function(){
            $(this).css('font-size', sizeObj.effectiveSize);
          }
        });
      } else {
        $(line).css(css);
      }
    };

    var redraw = function(scope, opts){
      unwrapLines(scope, opts);
      wrapLines(scope, opts);
      opts.redraw = false;
    };

    var getBreakpointOptions = function(scope, opts){
      opts.lastScreenWidth = opts.currentScreenWidth;

      if(!opts.breakpoints || opts.breakpoints.length < 1){
        return opts;
      }

      var breakOpts = $.extend({}, opts);
      var breakpoints = opts.breakpoints.map(function(b){
        b.screenWidth = parseSize(b.screenWidth);
        return b;
      }).sort(function(a,b){
        return a.screenWidth - b.screenWidth;
      });

      for(var i=0,l=breakpoints.length; i<l; ++i){
        var b = breakpoints[i];

        if($(window).width() <= b.screenWidth){
          breakOpts = $.extend(breakOpts, parseSizeOptions(b));
          breakOpts.currentScreenWidth = b.screenWidth;
          break;
        }
      }

      breakOpts.currentScreenWidth = breakOpts.currentScreenWidth || 0;

      return breakOpts;
    };

    var fillText = function(scope, options){
      var opts = $.extend({}, getBreakpointOptions(scope, options));

      if(opts.disable){
        unwrapLines(scope, opts);
        return;
      } else {
        wrapLines(scope, opts);
      }

      if(opts.screenWidthChanged()){
        redraw(scope, opts);
      };

      setContainerGutter(scope, opts);

      var containerObj  = getContainerObject(scope);
      var selectorClass = opts.eachWord ? opts.wordWrapClass : opts.lineWrapClass;
      var textSelector  = 'span.' + selectorClass + ':visible';
      var lineScope     = $(scope).find(textSelector);
      var lineSet       = [];

      var minSize, maxLetterCount;

      // Before resize
      lineScope.each(function(i){
        // Preserve the container's height to avoid flicker
        // Set lines inline in order to determine the text width
        $(this).css({
          'display': 'inline',
          'font-size': $fn.emBase
        });

        var textObj = getTextObject(this);
        var calculatedSize = getLineSize(containerObj, textObj, opts);
        var textLength = $(this).text().length;

        minSize = minSize || calculatedSize;
        minSize = calculatedSize < minSize ? calculatedSize: minSize;

        maxLetterCount = maxLetterCount || textLength;
        maxLetterCount = textLength < maxLetterCount ? maxLetterCount : textLength;

        lineSet.push({
          calculatedSize: calculatedSize,
          length:         $(this).text().length
        });
      });

      // After resize
      lineScope.each(function(i){
        var sizeObj = lineSet[i];
        sizeObj.effectiveSize  = minSize;
        sizeObj.maxLetterCount = maxLetterCount;
        sizeObj.lineHeight     = containerObj.lineHeight;

        updateLineCss(this, sizeObj, opts);

        if(i == lineScope.length - 1){
          //containerObj.element.fadeTo(opts.resizeDuration, 1);
        }
      });
    };

    var queueFill = function(scope, opts){
    };

    var init = function(evt){
      $fn.emBase = parseFloat($('body').css('font-size'));
      $fn.defaultOptions.emBase = $fn.emBase;

      var selector = evt.data.selector;

      for(var i = 0, l = $(selector).length; i < l; ++i){
        var element = $(selector).get(i);
        var opts  = parseSizeOptions($.extend({}, $fn.defaultOptions, evt.data.options));
        var scope = $(element);

        opts.text = scope.text();

        $(window).on('resize', function(){
          if(typeof $fn.screenWidth == 'undefined' || $(window).width() != $fn.screenWidth){
            fillText(scope, opts);
            $fn.screenWidth = $(window).width();
          }
        });

        fillText(scope, opts);
      }
    };

  $(window).load({ selector: this.selector, options: opts }, init);
}})(jQuery);
