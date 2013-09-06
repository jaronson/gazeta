define([
  'jquery',
  'settings',
  'models/article_collection'
], function($, settings, ArticleCollection){
  return function(options){
    var self = this;
    var activeArticle;

    this.defaults = {
      preloadCount: 2
    };

    this.activeArticle = function(){
      return $(activeArticle);
    };

    this.atPageStart = function(){
      return $(document).scrollTop() == 0;
    };

    this.atPageEnd = function(){
      return (document.documentElement.clientHeight +
        $(document).scrollTop()) >= document.body.offsetHeight;
    };

    this.route = function(){
      loadIndex();
    };

    this.start = function(){
      setOptions();
      self.route();

      var loadScroll = function(e, article){
        $.scrollTo(self.activeArticle(), settings.scroll.duration);
      };

      $(window).on('load', function(){
        setActiveArticle();
        loadMore();
      });

      $(window).on('scroll conformedwheel', function(e){
        setActiveArticle();
        loadMore();
      });

      settings.$layout().on('article.load', loadScroll);

      $(window).on('scroll', function(){
        settings.$layout().off('article.load', loadScroll);
      });

      settings.$layout().on('article.load', function(e, article){
        if(article.direction == 'up'){
          $.scrollTo(self.activeArticle());
        }
      });

      settings.$layout().on('article.activeChanged', function(){
        setActiveAnchor();
      });
    };

    var loadIndex = function(){
      var from = getAnchorPath();

      self.collection = new ArticleCollection({
        from: from,
        callback: function(){
          this.next().render();
          $(window).trigger('load');
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
      var path = document.location.hash.replace('#!/','');

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
      var active = getActive(articles);

      if(!active){
        return;
      }

      if(!activeArticle || active.attr('id') != $(activeArticle).attr('id')){
        activeArticle = active.get(0);
        settings.$layout().trigger('article.activeChanged');
      }
    };

    var getActive = function(scope){
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

    var conformMousewheel = function(){
      var wheelDelta;
      var wheelTimer;

      $(window).on('mousewheel', function(e, d, dx, dy){
        if(!wheelDelta){
          wheelDelta = d;
          dy = dy >= 0 ? 'up' : 'down';
          $(window).trigger('conformedwheel', {
            directionY: dy
          });
          wheelTimer = setTimeout(function(){
            wheelDelta = null;
          }, settings.mousewheel.timeout);
        }

        e.stopImmediatePropagation(); e.stopPropagation();
        return false;
      });
    };

    var getLocationHash = function(){
      return document.location.hash;
    };

    var scrollY = function(direction){
      var getNextSection = function(){
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

    var setLocationHash = function(path){
      document.location.hash = '!/' + path;
    };

    var setOptions = function(){
      var attrs = $.extend({}, self.defaults, options);

      for(key in attrs){
        self[key] = attrs[key];
      }
    };
  };
});
