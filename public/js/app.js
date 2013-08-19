$(document).ready(function(){
  $('h1').textfill({
    resizeAnimation: {
      speed: 0
    },
    after: function(){
      this.get().fadeTo(400, 1);
    }
  });

  $('h2').textfill();

  $('.textfill').textfill({
    follow: 'minimum'
  });

  console.log('app.js');
});
