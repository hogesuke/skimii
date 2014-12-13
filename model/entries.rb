class Entries < ActiveRecord::Base
  has_many :checks
  has_many :laters
end
