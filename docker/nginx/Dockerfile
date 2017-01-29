FROM nginx

MAINTAINER hogesuke <miyado@gmail.com>

ADD ./templates/skimii.conf /etc/nginx/conf.d/skimii.conf

RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim

RUN mkdir /root/logs
RUN chmod 755 /root

RUN rm -rf /etc/nginx/conf.d/default.conf
