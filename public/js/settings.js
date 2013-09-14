define([
  'jquery'
], function($){
  return {
    animation: {
      swipe: {
        duration: 300
      }
    },

    event: {
      router: {
        done: 'routerdone'
      },

      article: {
        init:     'articleinitialized',
        load:     'articleloaded',
        populate: 'articlepopulated',
        done:     'articledone',
        active:   'articleactivated'
      },
      section: {
        init:   'sectioninitialized',
        load:   'sectionloaded',
        done:   'sectiondone',
        active: 'sectionactivated'
      }
    },

    log: {
      events: false
    },

    mousewheel: {
      timeout: 700
    },

    scroll: {
      duration: 0,
      section:  50
    },

    selectors: {
      layout:  'layout',
      article: 'article',
      section: '.section,section'
    },

    separator: {
      attr: '-',
      path: '/'
    },

    tag: {
      article: 'article',
      loader:  'loader',
      section: 'section',
      number:  'number',
      major:   'major',
      minor:   'minor'
    }
  };
});
