require 'bundler/setup'
require 'sinatra/base'
require 'sinatra/partial'

class App < Sinatra::Base
  register Sinatra::Partial

  helpers do
    def part(name, attrs = {})
      partial("partials/#{name}", :locals => { :attrs => attrs })
    end
  end

  get '/' do
    haml :index
  end
end
