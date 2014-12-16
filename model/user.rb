class User < ActiveRecord::Base
  has_and_belongs_to_many :fields
  has_many :laters
  has_many :entries, :through => :laters
end
