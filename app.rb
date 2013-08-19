require 'bundler/setup'
require 'sinatra/base'
require 'sinatra/partial'

class App < Sinatra::Base
  register Sinatra::Partial

  get '/' do
    haml :index
  end
end
