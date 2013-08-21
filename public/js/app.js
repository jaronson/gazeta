$(document).ready(function(){
  $textfill({
    animate: {
      resize: false
    },
    animation: {
      speed: 50
    }
  });

  $('h1').textfill({
  });

  $('.big-block').textfill({
    lineHeight: 'max'
  });

  $('.side-block').textfill({
    lineHeight: 'min'
  });
});
