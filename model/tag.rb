class Tag < ActiveRecord::Base
  has_and_belongs_to_many :users

  validates :name,     presence: true, length: { in: 1..30 }, format: { with: /\A[^;,\/\?:@&=\+\$#\s\r\n]+\z/ }
  validates :official, presence: true, format: { with: /\A[01]\z/ }
end
