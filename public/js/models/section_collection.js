define([
  'jquery',
  'utils',
  'models/section',
  'helpers/view'
], function($, utils, Section, view){
  return function(article){
    var self = this;
    var evt  = new utils.EventHandler('sectioncol', this);

    this.article = article;
    this.count   = 0;
    this.renderedSections = [];

    var init = function init(){
      evt.observe('article.done', self.render);
    };

    this.render = function render(){
      var scope = self.article.target.find(view.selectors.section);

      for(var i = 0, l = scope.length; i < l; ++i){
        var e = scope[i];

        self.renderedSections.push(new Section({
          article: self.article,
          index:   i,
          element: e,
          active:  (article.activeSectionNumber == (i + 1)),
          last:    (i == l - 1)
        }));

        self.count++;
      }
    };

    init();
  };
});
