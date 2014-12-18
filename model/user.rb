class User < ActiveRecord::Base
  has_and_belongs_to_many :tags
  has_many :laters
  has_many :checks
  has_many :later_entries, :through => :laters, :source => 'entry'
  has_many :check_entries, :through => :checks, :source => 'entry'
end
