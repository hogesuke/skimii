class Setting < ActiveRecord::Base
  belongs_to :user
  after_initialize :set_default

  validates :bookmark_threshold, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 100 }
  validates :hotentry_days,      presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 100 }
  validates :later_days,         presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 100 }
  validates :dashboard_count,    presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 5, less_than_or_equal_to: 20 }
  validates :sort,               presence: true, numericality: { only_integer: true, less_than_or_equal_to: 1 }
  validates :visible_marked,     presence: true, numericality: { only_integer: true, less_than_or_equal_to: 1 }

  def set_default
    if new_record?
      self.bookmark_threshold = 3
      self.hotentry_days      = 10
      self.later_days         = 10
      self.dashboard_count    = 5
      self.sort               = 0
      self.visible_marked     = 0
    end
  end
end
