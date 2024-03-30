FROM alpine:3.15.4

LABEL description = "FFmpeg video re-packer"

RUN apk -U upgrade && \
    apk -v add --no-cache ffmpeg haserl lua mini_httpd && \
    rm -rf /var/cache/apk/* && \
    mkdir -p /var/www 

COPY /www /var/www
RUN cd /var/www && chmod -R 777 *
WORKDIR "/var/www"

CMD [\
 "mini_httpd", \
 "-c", "**.cgi|**.sh", \
 "-u", "root", \
 "-D" \
]

EXPOSE 80/tcp