class Entry < ActiveRecord::Base
  has_many :laters
  has_many :checks
  has_many :later_users, :through => :laters, :source => 'user'
  has_many :check_users, :through => :checks, :source => 'user'

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
