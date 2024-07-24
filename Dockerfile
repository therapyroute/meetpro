# Taken from https://github.com/disney/meteor-base
# Based on:
# - https://github.com/jshimko/meteor-launchpad/blob/master/Dockerfile
# - https://github.com/meteor/galaxy-images/blob/master/ubuntu/Dockerfile
FROM ubuntu

# Meteor version to build for; see ../build.sh
ENV METEOR_VERSION 2.9.1

ENV SCRIPTS_FOLDER /docker
ENV APP_SOURCE_FOLDER /opt/src
ENV APP_BUNDLE_FOLDER /opt/bundle

# Install dependencies, based on https://github.com/jshimko/meteor-launchpad/blob/master/scripts/install-deps.sh (only the parts we plan to use)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
        apt-get install --assume-yes apt-transport-https ca-certificates && \
        apt-get install --assume-yes --no-install-recommends build-essential bzip2 curl git libarchive-tools python3

# Install Meteor
RUN curl https://install.meteor.com/?release=$METEOR_VERSION --output /tmp/install-meteor.sh && \
# Replace tar with bsdtar in the install script; https://github.com/jshimko/meteor-launchpad/issues/39 and 
#https://github.com/intel/lkp-tests/pull/51
        sed --in-place "s/tar -xzf.*/bsdtar -xf \"\$TARBALL_FILE\" -C \"\$INSTALL_TMPDIR\"/g" /tmp/install-meteor.sh && \
        # Install Meteor
        printf "\n[-] Installing Meteor $METEOR_VERSION...\n\n" && \
        sh /tmp/install-meteor.sh

# Fix permissions warning; https://github.com/meteor/meteor/issues/7959
ENV METEOR_ALLOW_SUPERUSER true


# Copy entrypoint and dependencies
COPY ./docker $SCRIPTS_FOLDER/

# Install Docker entrypoint dependencies; npm ci was added in npm 5.7.0, and therefore available only to Meteor 1.7+
RUN cd $SCRIPTS_FOLDER && \
        #if bash -c "if [[ ${METEOR_VERSION} == 1.6* ]]; then exit 0; else exit 1; fi"; then \
                meteor npm install
        #else \
        #        meteor npm ci; \
        #fi


# Copy app package.json and package-lock.json into container
COPY ./app/package*.json $APP_SOURCE_FOLDER/

RUN bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh

# Copy app source into container
COPY ./app $APP_SOURCE_FOLDER/

RUN bash $SCRIPTS_FOLDER/build-meteor-bundle.sh


# Use the specific version of Node expected by your Meteor release, per https://docs.meteor.com/changelog.html; this is expected for Meteor 2.9.1
FROM node:14.21.2-alpine

ENV APP_BUNDLE_FOLDER /opt/bundle
ENV SCRIPTS_FOLDER /docker

# Runtime dependencies; if your dependencies need compilation (native modules such as bcrypt) or you are using Meteor <1.8.1, use 
#app-with-native-dependencie$
RUN apk --no-cache add \
                bash \
                ca-certificates

# Copy in entrypoint
COPY --from=0 $SCRIPTS_FOLDER $SCRIPTS_FOLDER/

# Copy in app bundle
COPY --from=0 $APP_BUNDLE_FOLDER $APP_BUNDLE_FOLDER/

RUN bash $SCRIPTS_FOLDER/build-meteor-npm-dependencies.sh

# Start app
ENTRYPOINT ["/docker/entrypoint.sh"]

CMD ["node", "main.js"]
