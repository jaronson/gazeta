define([
  'jquery',
  'utils',
  'settings',
  'helpers/view'
], function($, utils, settings, view){
  return function(attrs){
    var self = this;
    var rendered = false;

    this.date       = attrs.date;
    this.name       = attrs.name;
    this.index      = attrs.index;
    this.number     = attrs.number;
    this.initial    = attrs.initial || false;
    this.direction  = attrs.direction == 'prev' ? 'up' : 'down';
    this.dateline   = attrs.dateline;
    this.path       = attrs.date + '/' + this.name;
    this.articleId  = 'article-' + self.name + '-' + Math.random().toString().replace('.','');
    this.selector   = '#' + this.articleId;
    this.cssUrl     = '/css/articles/' + this.name + '.css';
    this.target;
    this.loader;
    this.html;

    var init = function(){
    };

    this.isAfter = function(other){
      return other.idnex > self.index;
    };

    this.isBefore = function(other){
      return other.index < self.index;
    };

    this.loadStylesheet = function(){
      utils.ajax.fileExists({
        url: self.cssUrl,
        success: function(){
          var link = $('<link/>').attr('rel', 'stylesheet').
            attr('href', self.cssUrl).
            attr('type', 'text/css');

          link.appendTo($('head'));
        }
      });
    };

    this.render = function(){
      if(rendered){
        return false;
      }

      rendered = true;

      self.loadStylesheet();
      setTarget();

      if(self.dateline){
        addDateline();
      }

      addLoader();

      $.ajax({
        method: 'GET',
        url: '/article/' + self.path,
        success: function(html){
          self.html = $(html);
          self.target.trigger('populate');
        }
      });
    };

    this.rendered = function(){
      return rendered;
    };

    this.sections = function(){
      return self.target.find(settings.selectors.section);
    }

    var addLoader = function(){
      self.loader = $('<loader/>').appendTo(self.target);
    };

    var addDateline = function(){
      var dateline = view.dateSeparator(self.date);
      dateline.appendTo(self.target);
    };

    var addPageNumbers = function(){
      for(var i = 0, l = self.sections().length; i < l; ++i){
        var section = $(self.sections()[i]);
        var number  = $('<number/>');
        var major   = $('<major/>').text(self.number);
        var minor   = $('<minor/>').text(i + 1);

        major.appendTo(number);
        minor.appendTo(number);
        number.appendTo(section);
      }
    };

    var addSectionClasses = function(){
      self.sections().each(function(i){
        $(this).addClass('section-' + (i + 1));
      });
    };

    var removeLoader = function(){
      self.loader.remove();
    };

    var setTarget = function(){
      self.target = $('<article/>').
        addClass(self.name).
        attr('id', self.articleId).
        attr('data-path', self.path);

      if(self.direction == 'up'){
        self.target.prependTo(settings.$layout());
      } else {
        self.target.appendTo(settings.$layout());
      }

      self.target.trigger('article.load', self);

      self.target.on('populate', function(){
        removeLoader();

        $(self.html).appendTo(self.target);

        addSectionClasses();
        addPageNumbers();
        fitToScreen();

        self.target.trigger('article.populate', self);

        if(self.initial){
          self.target.trigger('article.init', self);
        }
      });

      $(window).on('resize orientationchange', function(){
        fitToScreen();
      });
    };

    var fitToScreen = function(){
      self.sections().css('min-height', $(window).height() + 'px');
    };

    init();
  };
});
