define([
  'jquery',
  'settings',
  'models/article_collection'
], function($, settings, ArticleCollection){
  return function(options){
    var self = this;
    var activeArticle;
    var activeSection;
    var logEvents = true;

    this.defaults = {
    };

    this.activeArticle = function(){
      return $(activeArticle);
    };

    this.activeSection = function(){
      return $(activeSection);
    };

    this.atPageStart = function(){
      return $(document).scrollTop() == 0;
    };

    this.atPageEnd = function(){
      return (document.documentElement.clientHeight +
        $(document).scrollTop()) >= document.body.offsetHeight;
    };

    this.logEvent = function(msg){
      if(!logEvents){
        return;
      }

      console.log('event: ' + msg);
    };

    this.route = function(){
      loadIndex();
    };

    this.start = function(){
      setOptions();
      self.route();
      //conformMousewheel();

      $(document).on('article.init', function(){
        self.logEvent('article.init');

        setActiveArticle();
        setActiveSection();

        loadMore();

        if(activeArticle){
          $.scrollTo(self.activeArticle(), 0);
        }
      });

      $(document).on('article.populate', function(e, article){
        self.logEvent('article.populate');

        if(article.direction == 'up'){
          $.scrollTo(self.activeArticle(), 0);
        }
      });

      $(document).on('scroll', function(e){
        self.logEvent('document.scroll');

        setActiveArticle();
        setActiveSection();
        loadMore();
      });

      $(document).on('article.activeChanged', function(){
        self.logEvent('article.activeChanged');
        setActiveAnchor();
        $(window).trigger('load');
        $(window).trigger('textfill');
      });

      //$(window).on('conformedwheel', function(evt, d){
        //scrollY(d.directionY);
      //});
    };

    var loadIndex = function(){
      var from = getAnchorPath();

      self.collection = new ArticleCollection({
        from: from,
        callback: function(){
          this.next().render();
        }
      });
    };

    var loadMore = function(){
      if(self.atPageEnd()){
        self.collection.next().render();
      }

      if(self.atPageStart()){
        self.collection.prev().render();
      }
    };

    var getAnchorPath = function(){
      var path = document.location.hash.toString();
      path     = path.replace('#!/','');

      if($.trim(path) != ''){
        return path;
      }
    };

    var setActiveAnchor = function(){
      var path = self.activeArticle().data('path');
      setLocationHash(path);
    };

    var setActiveArticle = function(){
      var articles = settings.$articles();
      var active   = getActive(articles);

      if(!active){
        return;
      }

      if(!activeArticle || active.attr('id') != $(activeArticle).attr('id')){
        activeArticle = active.get(0);
        active.trigger('article.activeChanged');
      }
    };

    var setActiveSection = function(){
      var sections = settings.$sections();
      var aSection = getActive(sections);

      if(!aSection){
        return;
      }

      if(!activeSection || aSection.get(0) != activeSection){
        activeSection = aSection.get(0);
        settings.$layout().trigger('section.activeChanged');
      }
    };

    var getActive = function(scope){
      if(scope.length == 1){
        return scope;
      }

      var wt = $(window).scrollTop();
      var wh = $(window).height();
      var wb = wt + wh;
      var active;
      var visible;

      for(var i = 0, l = scope.length; i < l; ++i){
        var element = $(scope[i]);
        var st = element.offset().top;
        var sh = element.height();
        var sb = st + sh;
        var v  = 0;

        if(sb <= wb && sb >= wt){
          v = ( sb - wt ) / sh;
        } else if(st >= wt && st <= wb){
          v = ( wb - st ) / sh;
        }

        if(v > 0 && (!active || v > visible)){
          active = element;
          visible = v;
        }
      }
      return active;
    };

    var clearLocationHash = function(){
      document.location.hash = '';
    };

    var getLocationHash = function(){
      return document.location.hash;
    };

    var setLocationHash = function(path){
      document.location.replace('#!/' + path);
    };

    var setOptions = function(){
      var attrs = $.extend({}, self.defaults, options);

      for(key in attrs){
        self[key] = attrs[key];
      }
    };

    var conformMousewheel = function(){
      var wheelDelta;
      var wheelTimer;

      $(window).on('mousewheel', function(e, d, dx, dy){
        if(!wheelDelta){
          wheelDelta = d;
          dx = dx >= 0 ? 'left' : 'right';
          dy = dy >= 0 ? 'up' : 'down';

          $(window).trigger('conformedwheel', {
            directionX: dx,
            directionY: dy
          });
          $(window).trigger('scroll');
          wheelTimer = setTimeout(function(){
            wheelDelta = null;
          }, settings.mousewheel.timeout);
        }

        e.stopImmediatePropagation(); e.stopPropagation();
        return false;
      });
    };

    var scrollY = function(direction){
      var getNextSection = function(){
        return direction == 'up' ? self.activeSection().prev() :
          self.activeSection().next();
      };

      var getNextArticle = function(){
        return direction == 'up' ? self.activeArticle().prev() :
          self.activeArticle().next();
      };

      var loader = function(){
        return direction == 'up' ? self.collection.prev().render() :
          self.collection.next().render();
      };

      var scroller = function(e, article){
        $.scrollTo('#' + article.articleId);
        settings.$layout().off('article.load', scroller);
      };

      settings.$layout().on('article.load', scroller);

      if(getNextArticle().length > 0){
        $.scrollTo(getNextArticle(), settings.scroll.duration);
      } else {
        loader();
      }
    };
  };
});
