({
  baseUrl: 'public/js',
  name:    'main',
  out:     'public/js/libs/main.built.js',
  paths: {
    'jquery':          'libs/jquery.min',
    'jquery.scrollto': 'libs/jquery.scrollto.min',
    'jquery.textfill': 'libs/jquery.textfill'
  },
  shim: {
    'jquery.scrollto': [ 'jquery' ],
    'jquery.textfill': [ 'jquery' ]
  }
})
