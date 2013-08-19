require './app'

Rack::Mime::MIME_TYPES.merge!({
  'eot' => 'application/vnd.ms-fontobject',
  'ttf' => 'application/x-font-ttf',
  'ott' => 'font/opentype',
  'woff' => 'font/x-woff'
})

run App.new
