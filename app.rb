require 'bundler/setup'
require 'haml'
require 'sinatra/base'
require 'sinatra/reloader'
require File.expand_path('..', __FILE__) + '/lib/gazeta'

class App < Sinatra::Base
  register Sinatra::Gazeta
end
