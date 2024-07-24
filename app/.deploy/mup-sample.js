module.exports = {
  servers: {
    one: {
      host: '',
      username: '',
      // password: '',
      // or leave blank for authenticate from ssh-agent
      opts: {
          port: 22,
      }
    }
  },

  meteor: {
    name: 'meetpro',
    path: '../',
    port: 3000,
    servers: {
      one: {}
    },
    docker: {
      image: 'zodern/meteor:root',
      prepareBundle: true,
      networks: [
        'nginxproxy'
      ]
    },
    buildOptions: {
      serverOnly: true
    },
    env: {
      ROOT_URL: 'https://appurl.com',
      PORT: 3000,
      MONGO_URL: 'mongodb://localhost/meteor'
    },
    deployCheckWaitTime: 60,
    enableUploadProgressBar: true
  },
  mongo: {
    version: '4.2',
    oplog: true,
    dbName: 'main',
    port: 27017,
    servers: {
      one: {},
    },
  },
};
