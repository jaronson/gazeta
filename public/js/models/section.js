define([
  'jquery',
  'utils',
  'helpers/view'
], function($, utils, view){
  return function(attrs){
    var self = this;

    this.name      = 'section';
    this.article   = attrs.article;
    this.index     = attrs.index;
    this.number    = this.index + 1;
    this.target    = $(attrs.element);
    this.data      = this.target.data();
    this.isActive  = attrs.active || false;
    this.isInitial = this.article.isInitial && this.isActive;
    this.isLast    = attrs.last || false;

    var evt  = new utils.EventHandler(this.name, this);

    var init = function init(){
      var cn = utils.join.attr('section', self.number);

      self.target.addClass(cn);
      self.target.attr('data-number', self.number);
      self.fitToScreen();

      insertPageNumber();

      self.observe();

      evt.trigger('load');

      if(self.isInitial){
        evt.trigger('init');
      }

      if(self.isLast){
        evt.trigger('done');
      }
    };

    // Public

    this.fitToScreen = function fitToScreen(){
      self.target.css('min-height', $(window).height().toString() + 'px');
    };

    this.observe = function(){
      evt.watch(window, 'resize orientationchange', self.fitToScreen);
      evt.watch(document, evt.keys.section.active, function(e){
        self.isActive = self.number == $(e.target).data('number');
      });
    };

    // Private

    var insertPageNumber = function insertPageNumber(){
      var number  = utils.tag.create('number');
      var major   = utils.tag.create('major').text(self.article.number);
      var minor   = utils.tag.create('minor').text(self.number);

      major.appendTo(number);
      minor.appendTo(number);
      number.appendTo(self.target);
    };

    init();
  };
});
