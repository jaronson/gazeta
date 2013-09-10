define([
  'jquery'
], function($){
  return {
    ajax: {
      fileExists: function(attrs){
        attrs.success = attrs.success || function(){};
        attrs.failure = attrs.failure || function(){};

        $.ajax({
          method: 'HEAD',
          url: attrs.url,
          complete: function(xhr){
            if(xhr.status == 200){
              $.proxy(attrs.success, this)();
            } else {
              $.proxy(attrs.failure, this)();
            }
          }
        });
      }
    }
  };
});
