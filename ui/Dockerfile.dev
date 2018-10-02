# Note: This is the dockerfile for development purposes

FROM node

WORKDIR /ui
ADD package-lock.json package.json /ui/
RUN npm install
ENTRYPOINT [ "/scripts/await_md5_match.sh", "/ui/src/app/shared/model/.jobs.yaml.md5", "--" ]
