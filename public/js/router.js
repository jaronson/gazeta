define([
  'utils',
  'models/article_collection',
  'helpers/view'
], function(utils, ArticleCollection, view){
  return function(){
    var self = this;
    var evt  = new utils.EventHandler('router', this);

    this.active = {};

    this.routes = {
      '/': function(){
        loadIndex();
      }
    };

    // Public

    this.start = function start(){
      for(path in self.routes){
        if(document.location.pathname == path){
          self.routes[path]();
        }
      }
    };

    this.setActive = function setActive(){
      for(var i = 0, l = arguments.length; i < l; ++i){
        self.findActive(arguments[i]);
      }
    };

    this.findActive = function findActive(key){
      var selector = view.selectors[key];
      var active = this.activeElement($(selector));

      if(!active){
        return;
      }

      var prev = self.active[selector];

      if(!prev || active.data('number') != $(prev).data('number')){
        self.active[selector] = active.get(0);
        evt.send(active, evt.keys[key].active);
      }
    };

    this.getActive = function getActive(name){
      return $(self.active[view.selectors[name]]);
    };

    this.activeElement = function(scope){
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

    this.atPageStart = function(){
      return $(document).scrollTop() == 0;
    };

    this.atPageEnd = function(){
      return (document.documentElement.clientHeight +
        $(document).scrollTop()) >= document.body.offsetHeight;
    };

    // Private
    var getAnchorPath = function getAnchorPath(){
      var path = document.location.hash.toString();
      path     = path.replace('#!/','');

      if($.trim(path) != ''){
        return path;
      }
    };

    var setAnchorPath = function setAnchorPath(){
      var path = self.getActive('article').data('path');
      var section = self.getActive('section');

      if(section.length > 0){
        path = path + '/' + section.data('number');
      }

      document.location.replace('#!/' + path);
    };

    var loadIndex = function loadIndex(){
      var from = getAnchorPath();

      self.collection = new ArticleCollection({
        from: from,
        callback: function(){
          this.next().render();
        }
      });

      evt.watch(document, evt.keys.section.init, function(e, section){
        self.active[view.selectors.article] = section.article.target.get(0);
        self.active[view.selectors.section] = section.target.get(0);

        utils.scrollTo(section);

        setAnchorPath();

        evt.watch(window, 'scroll', function(e){
          self.setActive('article', 'section');
          loadMore();
        });

        evt.watch(document, evt.keys.section.active, function(){
          setAnchorPath();
        });

        evt.watch(document, evt.keys.article.active, function(){
          setAnchorPath();
        });

        evt.watch(document, evt.keys.article.populate, function(e, article){
          if(article.direction == 'up'){
            utils.scrollTo(self.getActive('section'));
          }
        });
      });
    };

    var loadMore = function loadMore(){
      if(self.atPageEnd()){
        self.collection.next().render();
      }

      if(self.atPageStart()){
        self.collection.prev().render();
      }
    };
  };
});
