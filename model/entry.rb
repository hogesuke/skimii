class Entry < ActiveRecord::Base
  has_many :checks
  has_many :laters
  has_many :users, :through => :laters
end
