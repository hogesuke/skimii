# coding: utf-8

require 'sinatra'
require 'sinatra/reloader'
require 'net/http'
require 'xmlsimple'
require 'json'
require 'active_record'
require 'twitter_oauth'
require 'twitter'
require 'yaml'
require 'pp'
require_relative './model/user'
require_relative './model/tag'
require_relative './model/check'
require_relative './model/later'
require_relative './model/entry'
require_relative './model/setting'

ActiveRecord::Base.configurations = YAML.load_file(File.join(__dir__, './db/database.yml'))
ActiveRecord::Base.establish_connection(settings.environment)

configure :production, :development do
  config = YAML.load_file(File.join(__dir__, './config/config.yml'))

  base_url = config['base_url']
  set :home_url,         base_url + '#' + config['hash']['home']
  set :server_error_url, base_url + '#' + config['hash']['server_error']
  set :callback_url,     config['callback_url']

  set :consumer_key,     config['consumer_key']
  set :consumer_secret,  config['consumer_secret']

  use Rack::Session::Cookie,
      :key          => 'rack.session',
      :expire_after => 60 * 60 * 24 * 30, # 30days
      :secret       => config['session_secret']

  set :protection, :except => [:json_csrf]
end

configure :development do
  set :server, 'webrick'
end

before %r{^/(?!auth).*$} do
  headers({'Content-Type' => 'application/json'})

  if session[:user_id]
    @user = User.find(session[:user_id])
  end
end

after do
  ActiveRecord::Base.connection.close
end

post '/auth' do
  client = TwitterOAuth::Client.new(
    :consumer_key    => settings.consumer_key,
    :consumer_secret => settings.consumer_secret
  )
  request_token = client.request_token(:oauth_callback => settings.callback_url)
  auth_url      = request_token.authorize_url

  session[:token]  = request_token.token
  session[:token_secret] = request_token.secret

  headers({'Content-Type' => 'application/json'})
  return {:auth_url => auth_url}.to_json
end

get '/auth/callback' do

  oauth_client = TwitterOAuth::Client.new(
    :consumer_key    => settings.consumer_key,
    :consumer_secret => settings.consumer_secret
  )

  access_token = oauth_client.authorize(
    session[:token],
    session[:token_secret],
    :oauth_verifier => params[:oauth_verifier]
  )

  tw_client = Twitter::REST::Client.new do |config|
    config.consumer_key       = settings.consumer_key
    config.consumer_secret    = settings.consumer_secret
    config.oauth_token        = access_token.token
    config.oauth_token_secret = access_token.secret
  end

  screen_name = access_token.params[:screen_name]
  provider_id = access_token.params[:user_id]

  user = User.where(:provider_id => provider_id).first

  if user.nil?
    login_user = tw_client.user(screen_name)

    user               = User.new
    user.provider_id   = provider_id
    user.provider_name = 'twitter'
    user.raw_name      = screen_name
    user.name          = login_user.name
    setting            = Setting.new
    user.setting       = setting
    if not user.save
      redirect(settings.server_error_url)
    end

    official_tags = Tag.where(:official => '1')
    official_tags.each do |tag|
      user.tags << tag
    end
  end

  session[:user_id] = user.id

  redirect(settings.home_url)
end

delete '/auth' do
  session.clear
  return { :msg => 'ログアウトしました' }.to_json
end

get '/auth/status' do
  if session[:user_id]
    user = User.find(session[:user_id])
    return { is_authed: true,  raw_name: user.raw_name, msg: '認証済みです' }.to_json
  else
    return { is_authed: false, msg: '未認証です' }.to_json
  end
end

get '/entry' do
  if not (valid_page?(params[:page]) and valid_tag?(params[:tag]))
    status(400)
    return { err_msg: 'パラメータが不正です' }.to_json
  end

  page = params[:page].to_i
  tag  = params[:tag]

  entries_data = get_entries(tag, page)

  return entries_data.to_json
end

get '/tag/official' do
  tags = Tag.where(:official => '1')

  headers({'Content-Type' => 'application/json'})
  tags.to_json
end

get '/user/my/tag' do
  if @user.nil?
    tags = Tag.where(:official => '1')
  else
    tags = @user.tags
  end

  tags.to_json
end

post '/user/my/tag' do
  if @user.nil?
    status(401)
    return {err_msg: '認証が必要です'}.to_json
  end

  params     = JSON.parse(request.body.read)
  param_tags = params['tags']

  if param_tags.size > 50
    status(400)
    return {err_msg: 'タグの登録上限数を越えています'}.to_json
  end

  @user.tags.delete_all

  param_tags.each do |param_tag|
    tag_name = param_tag['name'].downcase

    if Tag.exists?(:name => tag_name)
      tag = Tag.where(:name => tag_name).first
    else
      tag          = Tag.new
      tag.name     = tag_name
      tag.official = '0'
      if not tag.save
        status(400)
        return {err_msg: 'タグの登録に失敗しました'}.to_json
      end
    end

    @user.tags << tag
  end

  @user.tags.to_json
end

get '/user/my/check' do
  if @user.nil?
    status(401)
    return {err_msg: '認証が必要です'}.to_json
  end

  if not valid_page?(params[:page])
    status(400)
    return {err_msg: 'パラメータが不正です'}.to_json
  end

  page  = params[:page].to_i
  count = 40

  entries = @user.check_entries.
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
  if @user.nil?
    status(200)
    return {msg: '未認証のため登録されません'}.to_json
  end

  checked_entry = JSON.parse(request.body.read)

  entry = Entry.where(:url => checked_entry['url']).first
  if not entry.nil?
    if Check.exists?({:user_id => @user.id, :entry_id => entry.id})
      status(400)
      return {:err_msg => 'このエントリーは既にチェック済みとして登録されています'}.to_json
    end
  end

  if entry.nil?
    entry               = Entry.new
    entry.url           = checked_entry['url']
    entry.title         = checked_entry['title']
    entry.description   = checked_entry['description']
    entry.thumbnail_url = checked_entry['thumbnail_url']
    entry.favicon_url   = checked_entry['favicon_url']
    if not entry.save
      status(400)
      return {:err_msg => 'エントリーの登録に失敗しました'}.to_json
    end
  end

  new_check               = Check.new
  new_check.user_id       = @user.id
  new_check.entry_id      = entry.id
  new_check.hotentry_date = checked_entry['hotentry_date']
  new_check.save!

  entry.to_json
end

delete '/user/my/check' do
  if @user.nil?
    status(200)
    return {msg: '未認証のため削除されません'}.to_json
  end

  checked_entry = JSON.parse(request.body.read)

  entry = Entry.where(:url => checked_entry['url']).first
  if entry == nil
    status(400)
    return {:err_msg => 'エントリーが存在しません。'}.to_json
  end

  check = @user.checks.where({:entry_id => entry.id, :hotentry_date => checked_entry['hotentry_date']}).first
  if check.nil?
    status(400)
    return {:err_msg => 'このエントリーはチェック済みとして登録されていません。'}.to_json
  end

  check.destroy

  entry.to_json
end

get '/user/my/later' do
  if @user.nil?
    status(401)
    return {err_msg: '認証が必要です'}.to_json
  end

  if not valid_page?(params[:page])
    status(400)
    return {err_msg: 'パラメータが不正です'}.to_json
  end

  page       = params[:page].to_i
  count      = 40
  setting    = @user.setting
  date_begin = (Date.today - setting.later_days - 1).strftime("%Y-%m-%d")

  entries = @user.later_entries.
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

get '/user/my/later/count' do
  if @user.nil?
    status(401)
    return {err_msg: '認証が必要です'}.to_json
  end

  setting    = @user.setting
  date_begin = (Date.today - setting.later_days - 1).strftime("%Y-%m-%d")

  count = @user.later_entries.
    where('laters.created_datetime >= ?', date_begin).
    count('entries.id')

  return { :count => count }.to_json
end

post '/user/my/later' do
  if @user.nil?
    status(200)
    return {msg: '未認証のため登録されません'}.to_json
  end

  latered_entry = JSON.parse(request.body.read)

  entry = Entry.where(:url => latered_entry['url']).first
  if entry != nil
    if Later.exists?({:user_id => @user.id, :entry_id => entry.id})
      status(400)
      return {:err_msg => 'このエントリーは既にあとで読むとして登録されています。'}.to_json
    end
  end

  if entry.nil?
    entry               = Entry.new
    entry.url           = latered_entry['url']
    entry.title         = latered_entry['title']
    entry.description   = latered_entry['description']
    entry.thumbnail_url = latered_entry['thumbnail_url']
    entry.favicon_url   = latered_entry['favicon_url']
    if not entry.save
      status(400)
      return {:err_msg => 'エントリーの登録に失敗しました'}.to_json
    end
  end

  new_later               = Later.new
  new_later.user_id       = @user.id
  new_later.entry_id      = entry.id
  new_later.hotentry_date = latered_entry['hotentry_date']
  new_later.save!

  entry.to_json
end

delete '/user/my/later' do
  if @user.nil?
    status(200)
    return {msg: '未認証のため削除されません'}.to_json
  end

  latered_entry = JSON.parse(request.body.read)

  entry = Entry.where(:url => latered_entry['url']).first
  if entry.nil? then
    status(400)
    return {:err_msg => 'エントリーが存在しません。'}.to_json
  end

  later = @user.laters.where({:entry_id => entry.id, :hotentry_date => latered_entry['hotentry_date']}).first
  if later.nil? then
    status(400)
    return {:err_msg => 'このエントリーはあとで読むとして登録されていません。'}.to_json
  end

  later.destroy

  entry.to_json
end

get '/setting' do
  if @user.nil?
    return Setting.new.to_json
  end

  @user.setting.to_json
end

put '/setting' do
  if @user.nil?
    status(401)
    return {err_msg: '認証が必要です'}.to_json
  end

  input = JSON.parse(request.body.read)
  if not @user.setting.update_attributes(input)
    status(400)
    return {err_msg: '設定の更新に失敗しました'}.to_json
  end

  @user.setting.to_json
end

def get_entries(tag_name, page)
  if @user.nil?
    setting = Setting.new
  else
    setting = @user.setting
  end

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

  check_entries = []
  later_entries = []
  if not @user.nil?
    check_entries = @user.check_entries.where('checks.hotentry_date >= ?', date_begin).select('url')
    later_entries = @user.later_entries.where('laters.hotentry_date >= ?', date_begin).select('url')
  end

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

    next if not valid_item?(item)

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

def valid_item?(item)
  not(
    item['title'].nil?       or
    item['link'].nil?        or
    item['description'].nil? or
    item['date'].nil?        or
    item['bookmarkcount'].nil?
  )
end

def valid_page?(page)
  return false if page.nil?
  return false if not page =~ /[0-9]+/
  return false if page.to_i <= 0
  true
end

def valid_tag?(tag)
  return false if tag.nil?
  return false if not (1 <= tag.length and tag.length <= 30)
  return false if tag =~ /[;,\/\?:@&=\+\$#\s\r\n]/
  true
end
