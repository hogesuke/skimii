require 'sinatra'
require 'sinatra/reloader'

get '/entry' do
  # todo エントリーを取得する
end

post '/entry/checked' do
  # todo エントリー確認済み
end

get '/entry/later' do
  # todo エントリーあとで読むの取得
end

post '/entry/later' do
  # todo エントリーあとで読むの追加
end

delete '/entry/later' do
  # todo エントリーあとで読むの削除
end

get '/field' do
  # todo ウォッチ対象分野の取得
end

post '/field' do
  # todo ウォッチ対象分野の追加
end

delete '/field' do
  # todo ウォッチ対象分野の削除
end
