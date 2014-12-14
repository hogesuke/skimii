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
  fields = Field.where(:official => '1')

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
  params = JSON.parse(request.body.read)
  field_name = params['name']

  # todo OAuthを実装したらログインユーザで絞るように修正
  user = User.find(1)

  if Field.exists?(:name => field_name) then
    field = Field.where(:name => field_name).first

    if user.fields.exists?(:id => field.id) then
      status(400)
      return {:err_msg => '既に登録されています。'}.to_json
    end
  else
    field = Field.new
    field.name = field_name
    field.official = '1'
    field.save
  end

  user.fields<<field

  headers({'Content-Type' => 'application/json'})
  user.fields.to_json
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

  entry = Entry.where(:url => entry_url).first
  if entry != nil then
    if Check.exists?({:user_id => 1, :entry_id => entry.id}) then
      status(400)
      headers({'Content-Type' => 'application/json'})
      return {:err_msg => 'このエントリーは既にチェック済みとして登録されています。'}.to_json
    end
  end

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
    new_entry = Entry.where(:url => entry_info['url']).first
  else
    new_entry = Entry.new
    new_entry.url = entry_info['url']
    new_entry.title = entry_info['title']
    new_entry.save
  end

  # todo OAuthを実装したらログインユーザで絞るように修正
  User.find(1).checks.create(:entry_id => new_entry.id)

  headers({'Content-Type' => 'application/json'})
  new_entry.to_json
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
  params = JSON.parse(request.body.read)
  entry_url = params['url']

  entry = Entry.where(:url => entry_url).first
  if entry != nil then
    if Later.exists?({:user_id => 1, :entry_id => entry.id}) then
      status(400)
      headers({'Content-Type' => 'application/json'})
      return {:err_msg => 'このエントリーは既にあとで読むとして登録されています。'}.to_json
    end
  end

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
    new_entry = Entry.where(:url => entry_info['url']).first
  else
    new_entry = Entry.new
    new_entry.url = entry_info['url']
    new_entry.title = entry_info['title']
    new_entry.save
  end

  # todo OAuthを実装したらログインユーザで絞るように修正
  User.find(1).laters.create(:entry_id => new_entry.id)

  headers({'Content-Type' => 'application/json'})
  new_entry.to_json
end

delete '/user/my/later' do
  params = JSON.parse(request.body.read)
  entry_url = params['url']
  user = User.find(1)

  entry = Entry.where(:url => entry_url).first
  if entry == nil then
    status(400)
    headers({'Content-Type' => 'application/json'})
    return {:err_msg => 'エントリーが存在しません。'}.to_json
  end

  later = user.laters.where(:entry_id => entry.id).first
  if later == nil then
    headers({'Content-Type' => 'application/json'})
    return user.laters.to_json
  end

  # todo 削除時エラーになる。要修正。
  later.destroy

  headers({'Content-Type' => 'application/json'})
  entry.to_json
end
