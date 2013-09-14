define([
  'jquery',
  'utils',
  'helpers/view',
  'models/section_collection'
], function($, utils, view, SectionCollection){
  return function(attrs){
    var self     = this;

    this.name     = 'article';
    this.url      = {};
    this.target   = null;
    this.loader   = null;
    this.html     = null;
    this.sections = null;

    var rendered = false;
    var evt      = new utils.EventHandler(this.name, this);

    // Initializer
    var init = function(){
      self.date        = attrs.date;
      self.name        = attrs.name;
      self.index       = attrs.index;
      self.number      = self.index + 1;
      self.isInitial   = attrs.initial;
      self.isActive    = attrs.active;
      self.direction   = attrs.direction == 'prev' ? 'up' : 'down';
      self.hasDateline = attrs.dateline;

      self.activeSectionNumber = attrs.section;

      setArticleId();
      setPath();
      setSelector();
      setUrls();
    };

    // Public
    this.render = function render(){
      if(rendered){
        return false;
      } else {
        rendered = true;
      }

      setTarget();
      setSections();
      insertLoader();

      utils.import.css(self.url.css);
      utils.import.js(self.url.js);

      insertDateline();

      $.ajax({
        method:  'GET',
        url:     utils.join.path('/article', self.path),
        success: function(html){
          self.html = $(html);
          evt.trigger('populate');
        }
      });
    };

    this.populate = function(){
      removeLoader();
      self.html.appendTo(self.target);

      var sel = self.selector + ' ' + view.selectors.section;

      evt.watch(sel, evt.keys.section.init, function(e, section){
        evt.trigger('init');
      });

      evt.watch(sel, evt.keys.section.done, function(e, section){
        self.target.trigger('textfill');
      });

      evt.trigger('done');
    };

    // Private
    var insertDateline = function(){
      if(self.hasDateline){
        self.dateline = view.separator.date(self.date).
          appendTo(self.target);
      }
    };

    var insertLoader = function(){
      self.loader = utils.tag.create('loader').appendTo(self.target);
    };

    var removeLoader = function(){
      self.loader.remove();
    };

    var setArticleId = function(){
      self.articleId = utils.join.attr(
        'article',
        self.name,
        utils.rand()
      );
    };

    var setPath = function(){
      self.path = utils.join.path(attrs.date, self.name);
    };

    var setSections = function(){
      self.sections = new SectionCollection(self);
    };

    var setSelector = function(){
      self.selector = '#' + self.articleId;
    };

    var setTarget = function(){
      self.target = utils.tag.create('article').
        addClass(self.name).
        attr('id', self.articleId).
        attr('data-path', self.path).
        attr('data-number', self.number);

      if(self.direction == 'up'){
        self.target.prependTo(view.$layout());
      } else {
        self.target.appendTo(view.$layout());
      }

      evt.observe('populate', function(){
        self.populate();
      });

      evt.watch(document, evt.keys.article.active, function(e){
        self.isActive = self.number == $(e.target).data('number');
      });
    };

    var setUrls = function(){
      self.url.css = utils.join.path('css', 'articles', self.name + '.css');
      self.url.js  = utils.join.path('js',  'articles', self.name + '.js');
    };

    init();
  };
});
