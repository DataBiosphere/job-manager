FROM node

WORKDIR /ui
ADD package-lock.json package.json tsconfig.json .angular-cli.json /ui/
RUN npm install

ADD src /ui/src
RUN node_modules/.bin/ng build --prod

FROM nginx

COPY --from=0 /ui/dist /ui/dist
ADD nginx.prod.conf /etc/nginx/nginx.conf
ENTRYPOINT [ "/scripts/await_md5_match.sh", "/ui/src/app/shared/model/.jobs.yaml.md5", "--" ]
