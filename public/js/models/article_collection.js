define([
  'jquery',
  'models/article'
], function($, Article){
  return function(opts){
    var self = this;
    var options = opts || {};

    var prevIndex = 0;
    var nextIndex = -1;
    var fromIndex = 0;
    var section;

    this.manifest;
    this.dates = [];
    this.count = 0;
    this.loadedArticles   = [];
    this.renderedArticles = [];

    var init = function(){
      loadManifest()
    };

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

    var addArticle = function(array, article, direction){
      if(direction == 'prev'){
        array.unshift(article);
      } else {
        array.push(article)
      }
    };

    var firstOfDate = function(entry){
      var names  = self.manifestJson[entry.date]
      var pos    = names.indexOf(entry.name);
      return pos == 0;
    };

    var firstOfManifest = function(entry){
      return entry.date == self.manifest[0].date;
    };

    var getArticle = function(direction){
      var attrs;
      var index = direction == 'prev' ? --prevIndex : ++nextIndex;

      attrs = self.manifest[index];

      if(!attrs){
        return;
      }

      if(index == fromIndex){
        attrs.initial = true;
      }

      if(!firstOfManifest(attrs) && firstOfDate(attrs)){
        attrs.dateline = true;
      }

      if(attrs.initial && !section){
        attrs.section = 1;
      } else if(attrs.initial){
        attrs.section = section;
      }

      var article = new Article({
        date: attrs.date,
        name: attrs.name,
        direction: direction,
        index: index,
        number: self.count - index,
        dateline: attrs.dateline,
        initial: attrs.initial,
        active:  attrs.initial,
        section: attrs.section
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
          self.count = self.manifest.length;

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
        var name;

        if(parts.length > 4){
          section = parts.pop();
          name    = parts.pop();
        } else {
          name = parts.pop();
        }

        var date  = parts.join('/');
        var from  = self.manifest.filter(function(o){
          return o.name == name && o.date == date;
        })[0];

        index = self.manifest.indexOf(from);

        if(index < 0){
          return false;
        }

        nextIndex = index - 1;
        prevIndex = index;
        fromIndex = index;
      }
    };

    init();
  };
});
