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
require_relative './model/setting'

ActiveRecord::Base.configurations = YAML.load_file('./db/database.yml')
ActiveRecord::Base.establish_connection('development')

# todo パラメータがちゃんと渡されてるかバリデーションすること

get '/entry' do
  page    = params[:page].to_i
  user    = User.find(1)
  setting = user.setting

  entries_data = get_entries(params[:tag], page)

  headers({'Content-Type' => 'application/json'})
  return entries_data.to_json
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
  headers({'Content-Type' => 'application/json'})
  params     = JSON.parse(request.body.read)
  param_tags = params['tags']

  if param_tags.size > 50
    status(400)
    return {err_msg: 'タグの登録上限数を越えています。'}.to_json
  end

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
      tag.save!
    end

    user.tags<<tag
  }

  user.tags.to_json
end

delete '/user/my/tag' do
  params   = JSON.parse(request.body.read)
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
  page  = params['page'].to_i
  count = 40

  # todo OAuthを実装したらログインユーザで絞るように修正
  entries = User.find(1).check_entries.
    select('entries.*, checks.hotentry_date').
    limit(count).
    offset(count * (page - 1)).
    order('checks.created_datetime DESC')
  entries.each do |e|
    e.checked = true
    e.latered = false
  end

  return { :entries => entries, :completed => entries.empty?, :sort => 'recent' }.to_json
end

post '/user/my/check' do
  checked_entry = JSON.parse(request.body.read)

  entry = Entry.where(:url => checked_entry['url']).first
  if not entry.nil? then
    if Check.exists?({:user_id => 1, :entry_id => entry.id}) then
      status(400)
      headers({'Content-Type' => 'application/json'})
      return {:err_msg => 'このエントリーは既にチェック済みとして登録されています。'}.to_json
    end
  end

  if entry.nil? then
    entry = Entry.new
    entry.url = checked_entry['url']
    entry.title = checked_entry['title']
    entry.description = checked_entry['description']
    entry.thumbnail_url = checked_entry['thumbnail_url']
    entry.favicon_url = checked_entry['favicon_url']
    entry.save!
  end

  # todo OAuthを実装したらログインユーザで絞るように修正
  new_check = Check.new
  new_check.user_id = 1
  new_check.entry_id = entry.id
  new_check.hotentry_date = checked_entry['hotentry_date']
  new_check.save!

  headers({'Content-Type' => 'application/json'})
  entry.to_json
end

delete '/user/my/check' do
  checked_entry = JSON.parse(request.body.read)

  # todo OAuthを実装したらログインユーザで絞るように修正
  user = User.find(1)

  entry = Entry.where(:url => checked_entry['url']).first
  if entry == nil then
    status(400)
    headers({'Content-Type' => 'application/json'})
    return {:err_msg => 'エントリーが存在しません。'}.to_json
  end

  check = user.checks.where({:entry_id => entry.id, :hotentry_date => checked_entry['hotentry_date']}).first
  if check.nil? then
    status(400)
    headers({'Content-Type' => 'application/json'})
    return {:err_msg => 'このエントリーはチェック済みとして登録されていません。'}.to_json
  end

  check.destroy

  headers({'Content-Type' => 'application/json'})
  entry.to_json
end

get '/user/my/later' do
  headers({'Content-Type' => 'application/json'})
  page       = params['page'].to_i
  count      = 40
  user       = User.find(1)
  setting    = user.setting
  date_begin = (Date.today - setting.later_days - 1).strftime("%Y-%m-%d")

  # todo OAuthを実装したらログインユーザで絞るように修正
  entries = User.find(1).later_entries.
    where('laters.created_datetime >= ?', date_begin).
    select('entries.*, laters.hotentry_date').
    limit(count).
    offset(count * (page - 1)).
    order('laters.created_datetime DESC')
  entries.each do |e|
    e.latered = true
    e.checked = false
  end

  return { :entries => entries, :completed => entries.empty?, :sort => 'recent' }.to_json
end

post '/user/my/later' do
  latered_entry = JSON.parse(request.body.read)

  entry = Entry.where(:url => latered_entry['url']).first
  if entry != nil then
    if Later.exists?({:user_id => 1, :entry_id => entry.id}) then
      status(400)
      headers({'Content-Type' => 'application/json'})
      return {:err_msg => 'このエントリーは既にあとで読むとして登録されています。'}.to_json
    end
  end

  if entry.nil? then
    entry = Entry.new
    entry.url = latered_entry['url']
    entry.title = latered_entry['title']
    entry.description = latered_entry['description']
    entry.thumbnail_url = latered_entry['thumbnail_url']
    entry.favicon_url = latered_entry['favicon_url']
    entry.save!
  end

  # todo OAuthを実装したらログインユーザで絞るように修正
  new_later = Later.new
  new_later.user_id = 1
  new_later.entry_id = entry.id
  new_later.hotentry_date = latered_entry['hotentry_date']
  new_later.save!

  headers({'Content-Type' => 'application/json'})
  entry.to_json
end

delete '/user/my/later' do
  latered_entry = JSON.parse(request.body.read)

  # todo OAuthを実装したらログインユーザで絞るように修正
  user = User.find(1)

  entry = Entry.where(:url => latered_entry['url']).first
  if entry.nil? then
    status(400)
    headers({'Content-Type' => 'application/json'})
    return {:err_msg => 'エントリーが存在しません。'}.to_json
  end

  later = user.laters.where({:entry_id => entry.id, :hotentry_date => latered_entry['hotentry_date']}).first
  if later.nil? then
    status(400)
    headers({'Content-Type' => 'application/json'})
    return {:err_msg => 'このエントリーはあとで読むとして登録されていません。'}.to_json
  end

  later.destroy

  headers({'Content-Type' => 'application/json'})
  entry.to_json
end

get '/setting' do
  headers({'Content-Type' => 'application/json'})
  # todo OAuthを実装したらログインユーザで絞るように修正
  return User.find(1).setting.to_json
end

put '/setting' do
  input = JSON.parse(request.body.read)

  setting = User.find(1).setting
  setting.update_attributes!(input)

  headers({'Content-Type' => 'application/json'})
  User.find(1).setting
end

def get_entries(tag_name, page)
  user       = User.find(1)
  setting    = user.setting
  date_begin = (Date.today - setting.hotentry_days - 1).strftime("%Y-%m-%d")
  date_end   = Date.today.strftime("%Y-%m-%d")
  sort       = setting.sort == 0 ? 'recent' : 'popular'
  count      = 40

  url = URI.parse(URI.escape(
                    "http://b.hatena.ne.jp/search/tag?" +
                    "q=#{tag_name}&" +
                    "sort=#{sort}&" +
                    "date_begin=#{date_begin}&" +
                    "date_end=#{date_end}&" +
                    "users=#{setting.bookmark_threshold}&" +
                    "of=#{count * (page - 1)}" +
                    "&mode=rss"))
  req = Net::HTTP::Get.new(url.path + '?' + url.query)
  res = Net::HTTP.start(url.host, url.port) {|http|
    http.request(req)
  }

  entries = []
  completed = false
  items = XmlSimple.xml_in(res.body)['item']

  if items.nil?
    return { entries: [], completed: true }
  end

  check_entries = user.check_entries.where('checks.hotentry_date >= ?', date_begin).select('url')
  later_entries = user.later_entries.where('laters.hotentry_date >= ?', date_begin).select('url')

  checked_urls = []
  check_entries.each do |c|
    checked_urls.push(c.url)
  end

  latered_urls = []
  later_entries.each do |l|
    latered_urls.push(l.url)
  end

  items.each{|item|
    thumbnail_url = ''
    if /http:\/\/cdn-ak\.b\.st-hatena\.com\/entryimage\/[0-9\-]+\.jpg/ =~ item['encoded'][0] then
      thumbnail_url = $&
    end

    favicon_url = ''
    if /http:\/\/cdn-ak\.favicon\.st-hatena\.com\/\?url=.+?"/ =~ item['encoded'][0] then
      favicon_url = $&
    end

    next if not isValidItem(item)

    entries.push({
                   :title         => item['title'][0],
                   :url           => item['link'][0],
                   :description   => item['description'][0],
                   :hotentry_date => item['date'][0].sub(/T.+$/, ''),
                   :bookmarkcount => item['bookmarkcount'][0],
                   :thumbnail_url => thumbnail_url,
                   :favicon_url   => favicon_url,
                   :checked       => checked_urls.include?(item['link'][0]),
                   :latered       => latered_urls.include?(item['link'][0])
                 })
  }

  return { :entries => entries, :completed => completed, :sort => sort }
end

def isValidItem(item)
  not(
    item['title'].nil?       or
    item['link'].nil?        or
    item['description'].nil? or
    item['date'].nil?        or
    item['bookmarkcount'].nil?
  )
end
