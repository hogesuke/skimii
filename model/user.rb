class User < ActiveRecord::Base
  has_and_belongs_to_many :fields
  has_many :checks
  has_many :laters
end
