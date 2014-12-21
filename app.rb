# coding: utf-8

require 'sinatra'
require 'sinatra/reloader'
require 'sinatra/activerecord' # todo こいつの使い方をちゃんと調べる
require 'net/http'
require 'xmlsimple'
require 'json'
require 'active_record'
require_relative './model/user'
require_relative './model/tag'
require_relative './model/check'
require_relative './model/later'
require_relative './model/entry'

ActiveRecord::Base.configurations = YAML.load_file('./db/database.yml')
ActiveRecord::Base.establish_connection('development')

# todo パラメータがちゃんと渡されてるかバリデーションすること
# todo saveはsave!に変更すること
# todo tagの登録個数制限を付けること
# todo tagは小文字変換して登録するようにすること

get '/user/my/entry' do
  # todo OAuthを実装したらログインユーザで絞るように修正
  tags = User.find(1).tags

  all_entries = {}
  tags.each{|tag|
    all_entries[tag.name] = get_entries(tag.name)
  }

  headers({'Content-Type' => 'application/json'})
  all_entries.to_json
end

get '/user/me' do
  # todo ログインユーザ情報の取得
end

get '/tag' do
  tags = Tag.where(:official => '1')

  headers({'Content-Type' => 'application/json'})
  tags.to_json
end

get '/user/my/tag' do
  # todo OAuthを実装したらログインユーザで絞るように修正
  tags = User.find(1).tags

  headers({'Content-Type' => 'application/json'})
  tags.to_json
end

post '/user/my/tag' do
  params = JSON.parse(request.body.read)
  param_tags = params['tags']

  # todo OAuthを実装したらログインユーザで絞るように修正
  user = User.find(1)
  user.tags.delete_all

  param_tags.each{|param_tag|
    if Tag.exists?(:name => param_tag['name']) then
      tag = Tag.where(:name => param_tag['name']).first
    else
      tag = Tag.new
      tag.name = param_tag['name']
      tag.official = '0'
      tag.save
    end

    user.tags<<tag
  }

  headers({'Content-Type' => 'application/json'})
  user.tags.to_json
end

delete '/user/my/tag' do
  params = JSON.parse(request.body.read)
  tag_name = params['name']
  # todo OAuthを実装したらログインユーザで絞るように修正
  user = User.find(1)

  tag = Tag.where(:name => tag_name)
  user.tags.destroy(tag)

  headers({'Content-Type' => 'application/json'})
  user.tags.to_json
end

get '/user/my/check' do
  headers({'Content-Type' => 'application/json'})
  # todo OAuthを実装したらログインユーザで絞るように修正
  User.find(1).check_entries.to_json
end

post '/user/my/check' do
  params = JSON.parse(request.body.read)
  entry_url = params['url']

  entry = Entry.where(:url => entry_url).first
  if entry != nil then
    if Check.exists?({:user_id => 1, :entry_id => entry.id}) then
      # todo こんときのreturnはerrとするか要検討
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
  entries = User.find(1).check_entries<<new_entry

  headers({'Content-Type' => 'application/json'})
  entries.to_json
end

delete '/user/my/check' do
  params = JSON.parse(request.body.read)
  entry_url = params['url']
  user = User.find(1)

  entry = Entry.where(:url => entry_url).first
  if entry == nil then
    status(400)
    headers({'Content-Type' => 'application/json'})
    return {:err_msg => 'エントリーが存在しません。'}.to_json
  end

  check = user.checks.where(:entry_id => entry.id).first
  if check == nil then
    headers({'Content-Type' => 'application/json'})
    return user.check_entries.to_json

  end

  user.check_entries.destroy(entry)

  headers({'Content-Type' => 'application/json'})
  user.check_entries.to_json
end

get '/user/my/later' do
  headers({'Content-Type' => 'application/json'})
  # todo OAuthを実装したらログインユーザで絞るように修正
  User.find(1).later_entries.to_json
end

post '/user/my/later' do
  params = JSON.parse(request.body.read)
  entry_url = params['url']
  # todo OAuthを実装したらログインユーザで絞るように修正
  user = User.find(1)

  entry = Entry.where(:url => entry_url).first
  if entry != nil then
    if Later.exists?({:user_id => 1, :entry_id => entry.id}) then
      # todo こんときのreturnはerrとするか要検討
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

  entries = user.later_entries<<new_entry

  headers({'Content-Type' => 'application/json'})
  entries.to_json
end

delete '/user/my/later' do
  params = JSON.parse(request.body.read)
  entry_url = params['url']
  # todo OAuthを実装したらログインユーザで絞るように修正
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
    return user.later_entries.to_json
  end

  user.later_entries.destroy(entry)

  headers({'Content-Type' => 'application/json'})
  user.later_entries.to_json
end

def get_entries(tag_name)
  url = URI.parse("http://b.hatena.ne.jp/search/tag?q=#{tag_name}&mode=rss")
  req = Net::HTTP::Get.new(url.path + '?' + url.query)
  res = Net::HTTP.start(url.host, url.port) {|http|
    http.request(req)
  }

  entries = []
  items = XmlSimple.xml_in(res.body)['item']
  items.each{|item|
    thumbnail_url = ''
    if /http:\/\/cdn-ak\.b\.st-hatena\.com\/entryimage\/[0-9\-]+\.jpg/ =~ item['encoded'][0] then
      thumbnail_url = $&
    end
    entries.push({
                     :title         => item['title'][0],
                     :link          => item['link'][0],
                     :description   => item['description'][0],
                     :date          => item['date'][0],
                     :bookmarkcount => item['bookmarkcount'][0],
                     :thumbnail_url => thumbnail_url
                 })
  }

  return entries
end
