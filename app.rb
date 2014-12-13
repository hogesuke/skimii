# coding: utf-8

require 'sinatra'
require 'sinatra/reloader'
require 'sinatra/activerecord' # todo こいつの使い方をちゃんと調べる
require 'net/http'
require 'xmlsimple'
require 'json'
require 'active_record'
require_relative './model/user'
require_relative './model/field'
require_relative './model/check'
require_relative './model/later'
require_relative './model/entry'

ActiveRecord::Base.configurations = YAML.load_file('./db/database.yml')
ActiveRecord::Base.establish_connection('development')

get '/user/my/entry' do
  # todo OAuthを実装したらログインユーザで絞るように修正
  fields = User.find(1).fields

  entries = []
  fields.each{|field|
    url = URI.parse("http://b.hatena.ne.jp/search/tag?q=#{field.name}&mode=rss")
    req = Net::HTTP::Get.new(url.path + '?' + url.query)
    res = Net::HTTP.start(url.host, url.port) {|http|
      http.request(req)
    }
    entries.concat(XmlSimple.xml_in(res.body)['item'])
  }

  headers({'Content-Type' => 'application/json'})
  entries.to_json
end

get '/user/me' do
  # todo ログインユーザ情報の取得
end

get '/field' do
  fields = Field.where(:official => 1)

  headers({'Content-Type' => 'application/json'})
  fields.to_json
end

get '/user/my/field' do
  # todo OAuthを実装したらログインユーザで絞るように修正
  fields = User.find(1).fields

  headers({'Content-Type' => 'application/json'})
  fields.to_json
end

post '/user/my/field' do
  # todo ウォッチ対象分野の追加
end

delete '/user/my/field' do
  # todo ウォッチ対象分野の削除
end

get '/user/my/check' do
  # todo OAuthを実装したらログインユーザで絞るように修正
  checks = User.find(1).checks

  entries = []
  checks.each{|check|
    entries.push(check.entry)
  }

  headers({'Content-Type' => 'application/json'})
  entries.to_json
end

post '/user/my/check' do
  params = JSON.parse(request.body.read)
  entry_url = params['url']

  url = URI.parse("http://b.hatena.ne.jp/entry/jsonlite/?url=#{entry_url}")
  req = Net::HTTP::Get.new(url.path + '?' + url.query)
  res = Net::HTTP.start(url.host, url.port) {|http|
    http.request(req)
  }

  if res.body == 'null' then
    status(400)
    headers({'Content-Type' => 'application/json'})
    return {:err_msg => 'エントリーが存在しません。'}.to_json
  end

  entry_info = JSON.parse(res.body)
  if Entry.exists?(:url => entry_info['url']) then
    entry = Entry.where(:url => entry_info['url']).first
  else
    entry = Entry.new
    entry.url = entry_info['url']
    entry.title = entry_info['title']
    entry.save
  end

  p entry
  check = Check.new
  check.user_id = 1 # todo OAuthを実装したらログインユーザで絞るように修正
  check.entry_id = entry.id
  check.save

  headers({'Content-Type' => 'application/json'})
  entry.to_json
end

delete '/user/my/check' do
  # todo エントリー確認済みの解除
end

get '/user/my/later' do
  # todo OAuthを実装したらログインユーザで絞るように修正
  laters = User.find(1).laters

  entries = []
  laters.each{|later|
    entries.push(later.entry)
  }

  headers({'Content-Type' => 'application/json'})
  entries.to_json
end

post '/user/my/later' do
  # todo エントリーあとで読むの追加
end

delete '/user/my/later' do
  # todo エントリーあとで読むの削除
end
