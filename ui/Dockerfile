FROM us.gcr.io/broad-dsp-gcr-public/base/jre:11-debian

WORKDIR /job-manager

ADD ./ /job-manager

RUN /bin/bash -c scripts/rebuild_swagger.sh

FROM us.gcr.io/broad-dsp-gcr-public/base/nodejs:14-debian

WORKDIR /ui

COPY --from=0 /job-manager/ui/src /ui/src

ADD ./ui/package-lock.json /ui/
ADD ./ui/package.json /ui/
ADD ./ui/tsconfig.json /ui/
ADD ./ui/.angular-cli.json /ui/

RUN npm install

RUN /ui/node_modules/.bin/ng build --prod

FROM us.gcr.io/broad-dsp-gcr-public/base/nginx:mainline-alpine

COPY --from=1 /ui/dist /ui/dist
ADD ./ui/nginx.prod.conf /etc/nginx/nginx.conf
