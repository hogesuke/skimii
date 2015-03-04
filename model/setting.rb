class Setting < ActiveRecord::Base
  belongs_to :user
  after_initialize :set_default

  def set_default
    self.bookmark_threshold = 3
    self.hotentry_days      = 10
    self.later_days         = 10
    self.dashboard_count    = 5
    self.sort               = 0
    self.visible_marked     = 0
  end
end
