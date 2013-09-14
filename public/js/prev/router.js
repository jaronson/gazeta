define([
  'jquery',
  'settings',
  'models/article_collection'
], function($, settings, ArticleCollection){
  return function(options){
    var self = this;
    var activeArticle;
    var activeSection;
    var logEvents = false;

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

    this.start = function(){
      setOptions();

      if(document.location.pathname == '/'){
        loadIndex();
        //conformMousewheel();
      } else {
        $(window).trigger('textfill');
      }
    };

    var loadIndex = function(){
      var from = getAnchorPath();

      self.collection = new ArticleCollection({
        from: from,
        callback: function(){
          this.next().render();
        }
      });

      $(document).on('articleinit', function(){
        self.logEvent('articleinit');

        setActiveArticle();
        //setActiveSection();

        loadMore();

        if(activeArticle){
          $.scrollTo(self.activeArticle(), 0);
        }
      });

      $(document).on('articlepopulated', function(e, article){
        self.logEvent('articlepopulated');

        if(article.direction == 'up'){
          $.scrollTo(self.activeArticle(), 0);
        }
      });

      $(document).on('scroll', function(e){
        self.logEvent('document.scroll');

        setActiveArticle();
        //setActiveSection();

        loadMore();
      });

      $(document).on('article.activeChanged', function(){
        self.logEvent('article.activeChanged');
        setActiveAnchor();

        $(window).trigger('load');
        $(window).trigger('textfill');
      });

      $(window).on('conformedwheel', function(evt, d){
        if(d.dy){
          scrollY(d.dy);
        } else if(d.dx){
          scrollX(d.dx);
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

          var obj = {};

          if(dx != 0){
            obj.dx = dx > 0 ? 'right' : 'left';
          }

          if(dy != 0){
            obj.dy = dy > 0 ? 'up' : 'down';
          }

          $(window).trigger('conformedwheel', obj);
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
        settings.$layout().off('articleload', scroller);
      };

      settings.$layout().on('articleload', scroller);

      if(getNextArticle().length > 0){
        $.scrollTo(getNextArticle(), settings.scroll.duration);
      } else {
        loader();
      }
    };

    var scrollX = function(direction){
      if(direction == 'right'){
        var path = self.activeArticle().data('path');
        document.location.href = 'article/' + path;
      }
    };
  };
});
