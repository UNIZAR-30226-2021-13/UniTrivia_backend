const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const bd = require('./utils/DatabaseConnection.js');
const cache = require('./utils/ServerCache.js');
const cacheTest = require('./utils/ServerCacheTest.js');

const launchServer = async () => {
  try{
    await bd.iniciar(config.ATLAS_URI, "UniTrivia");
    logger.info("Pool Connection initialized");
  }catch (err){
    logger.error("Cannot initialize Pool Connection", err.message)
    await this.close();
  }
  try {
    cache.crear();
    /*
    const res = await cacheTest.testSalas();
    if (res !== 0){
      console.log('Error test cache salas')
    }*/
    this.expressServer = new ExpressServer(config.URL_PORT, config.OPENAPI_YAML);
    this.expressServer.launch();
    logger.info('Express server running');
  } catch (error) {
    logger.error('Express Server failure', error.message);
    await this.close();
  }
};
process.on("SIGINT", async () => {
  logger.info('Closing Pool Connection');
  bd.terminar();
  cache.stop();
  process.exit();
});
process.on("SIGTERM", async () => {
  logger.info('Closing Pool Connection');
  bd.terminar();
  cache.stop();
  process.exit();
});
launchServer().catch(e => logger.error(e));
