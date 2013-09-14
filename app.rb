require 'bundler/setup'
require 'haml'
require 'sinatra/base'
require 'sinatra/partial'
require File.expand_path('..', __FILE__) + '/lib/gazeta'

class App < Sinatra::Base
  register Sinatra::Partial
  register Sinatra::Gazeta

  helpers do
    def part(name, attrs = {})
      partial("partials/#{name}", :locals => { :attrs => attrs })
    end
  end
end
