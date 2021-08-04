FROM postgres:13.3-alpine

LABEL maintainer="Me :)"

RUN set -ex \
    \
    && apk add --no-cache --virtual .fetch-deps \
        tar \
    \
    && wget -O pg_hashids.tar.gz "https://github.com/iCyberon/pg_hashids/archive/refs/heads/master.tar.gz" \
    && mkdir -p /usr/src/pg_hashids \
    && tar \
        --extract \
        --file pg_hashids.tar.gz \
        --directory /usr/src/pg_hashids \
        --strip-components 1 \
    && rm pg_hashids.tar.gz \
    \
    && pg_config --pgxs \
    && apk add --no-cache --virtual .build-deps \
        make \
        clang-dev \
        gcc \
        llvm-dev \
    musl-dev \
    && cd /usr/src/pg_hashids \
    && make \
    && make install \
    && cd / \
    && rm -rf /usr/src/pg_hashids \
    && apk del .fetch-deps .build-deps
