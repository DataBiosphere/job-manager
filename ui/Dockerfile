FROM openjdk

WORKDIR /job-manager

ADD ./ /job-manager

RUN /bin/bash -c scripts/rebuild_swagger.sh

FROM node

WORKDIR /ui

COPY --from=0 /job-manager/ui/src /ui/src

ADD ./ui/package-lock.json /ui/
ADD ./ui/package.json /ui/
ADD ./ui/tsconfig.json /ui/
ADD ./ui/.angular-cli.json /ui/

RUN npm install

RUN /ui/node_modules/.bin/ng build --prod

FROM nginx

COPY --from=1 /ui/dist /ui/dist
ADD ./ui/nginx.prod.conf /etc/nginx/nginx.conf
