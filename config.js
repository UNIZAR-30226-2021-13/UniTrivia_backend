const path = require('path');
require('dotenv').config();

const config = {
  ROOT_DIR: __dirname,
  URL_PORT: process.env.PORT || 3000,
  URL_PATH: 'https://unitrivia.herokuapp.com',
  BASE_VERSION: 'v2',
  CONTROLLER_DIRECTORY: path.join(__dirname, 'controllers'),
  PROJECT_DIR: __dirname,
  MAX_QUESITOS: 6,
  MAX_JUGADORES: 6,
  MIN_JUGADORES: 2,
  ATLAS_URI: 'mongodb+srv://cluster0.ud3f3.mongodb.net/UniTrivia?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority'
};
config.OPENAPI_YAML = path.join(config.ROOT_DIR, 'api', 'openapi.yaml');
config.FULL_PATH = `${config.URL_PATH}:${config.URL_PORT}/${config.BASE_VERSION}`;
config.FILE_UPLOAD_PATH = path.join(config.PROJECT_DIR, 'uploaded_files');
config.PATH_MONGO_KEY = path.join(config.PROJECT_DIR, 'keys/mongo_key.pem');
config.JWT_KEY = 'la primera que suelto la escribo';

module.exports = config;
