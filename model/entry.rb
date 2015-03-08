class Entry < ActiveRecord::Base
  has_many :laters
  has_many :checks
  has_many :later_users, :through => :laters, :source => 'user'
  has_many :check_users, :through => :checks, :source => 'user'

  validates :url,           presence: true,  length: { in: 1..1024 }
  validates :title,         presence: true,  length: { in: 1..256 }
  validates :description,   presence: false, length: { in: 1..512 }
  validates :thumbnail_url, presence: false, length: { in: 1..1024 }, format: { with: /\Ahttp:\/\/cdn-ak\.b\.st-hatena\.com\/entryimage\/[0-9\-]+\.jpg\z/ }
  validates :favicon_url,   presence: false, length: { in: 1..1024 }, format: { with: /\Ahttp:\/\/cdn-ak\.favicon\.st-hatena\.com\/\?url=.+?"\z/ }

  attr_accessor :checked
  attr_accessor :latered

  def as_json(options={})
    super.as_json(options).merge({:checked => get_checked, :latered => get_latered})
  end

  def get_checked
    self.checked
  end

  def get_latered
    self.latered
  end
end
