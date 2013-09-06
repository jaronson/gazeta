define([
  'jquery',
  'models/article',
  'settings'
], function($, Article, settings){
  return function(opts){
    var options = opts || {};
    var self = this;

    var prevIndex = 0;
    var nextIndex = -1;

    this.manifest;
    this.dates = [];
    this.loadedArticles   = [];
    this.renderedArticles = [];

    this.prev = function(count){
      loadArticles(count, 'prev');
      return self;
    };

    this.next = function(count){
      loadArticles(count, 'next');
      return self;
    };

    this.render = function(){
      for(var i = 0, l = self.loadedArticles.length; i < l; ++i){
        var article = self.loadedArticles[i];
        article.render();
        self.renderedArticles.push(article);
      }

      self.loadedArticles = [];

      return self;
    };

    var init = function(){
      loadManifest()
    };

    var addArticle = function(array, article, direction){
      if(direction == 'prev'){
        array.unshift(article);
      } else {
        array.push(article)
      }
    };

    var firstOfDate = function(entry, direction){
      var names = self.manifestJson[entry.date]
      var pos   = names.indexOf(entry.name);
      return pos == 0;
    };

    var getArticle = function(direction){
      var attrs;
      var index = direction == 'prev' ? --prevIndex : ++nextIndex;

      attrs = self.manifest[index];

      if(!attrs){
        return;
      }

      var dateline = false;

      if(firstOfDate(attrs)){
        dateline = true;
      }

      var article = new Article({
        date: attrs.date,
        name: attrs.name,
        direction: direction,
        index: index,
        dateline: dateline
      });

      return article;
    };

    var loadArticles = function(count, direction){
      var count     = count || 1;
      var direction = direction || 'next';
      var i         = count;

      while(i > 0){
        var article = getArticle(direction);

        if(article){
          self.loadedArticles.push(article);
        } else {
          break;
        }
        --i;
      }
    };

    var loadManifest = function(){
      $.ajax({
        type: 'GET',
        url:  '/manifest.json',
        success: function(json){
          parseManifest(json);
          setFrom();

          if(options.callback){
            $.proxy(options.callback, self)();
          }
        }
      });
    };

    var parseManifest = function(json){
      self.manifestJson = json;
      self.manifest     = [];
      self.dates        = Object.keys(json);

      for(date in json){
        for(var i = 0, l = json[date].length; i < l; ++i){
          self.manifest.push({ date: date, name: json[date][i] });
        }
      }
    };

    var setFrom = function(){
      if(options.from){
        var parts = options.from.split('/');
        var name  = parts.pop();
        var date  = parts.join('/');
        var from  = self.manifest.filter(function(o){
          return o.name == name && o.date == date;
        })[0];

        index = self.manifest.indexOf(from);
        
        nextIndex = index - 1;
        prevIndex = index;
      }
    };

    init();
  };
});
