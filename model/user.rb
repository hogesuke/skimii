class User < ActiveRecord::Base
  has_and_belongs_to_many :fields
  has_many :checks, :through => :entries
  has_many :laters, :through => :entries
end
