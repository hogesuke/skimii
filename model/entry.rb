class Entry < ActiveRecord::Base
  has_many :laters
  has_many :checks
  has_many :later_users, :through => :laters, :source => 'user'
  has_many :check_users, :through => :checks, :source => 'user'
end
