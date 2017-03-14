FROM centos:6
RUN yum update -y && yum upgrade -y

RUN yum install -y git openssl-devel readline-devel zlib-devel
RUN yum groupinstall -y "Development Tools"

RUN groupadd unicorn && useradd -d /home/unicorn -g unicorn -m unicorn
RUN echo 'eval "$(rbenv init -)"' >> /etc/profile.d/rbenv.sh

USER unicorn
RUN git clone https://github.com/rbenv/rbenv.git ~/.rbenv
RUN git clone https://github.com/sstephenson/ruby-build.git ~/.rbenv/plugins/ruby-build
ENV PATH $PATH:/home/unicorn/.rbenv/bin:/home/unicorn/.rbenv/shims
RUN rbenv install 2.1.5
RUN rbenv global 2.1.5

RUN gem install bundler
RUN cd ~/skimii
RUN bundle install --path vendor/bundle
