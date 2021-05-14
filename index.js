const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const bd = require('./utils/DatabaseConnection.js');
const cache = require('./utils/ServerCache.js');
const cacheTest = require('./tests/ServerCacheTest.js');

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
    console.log("\n\n\n\n");
    let res = 0;
    /*
    res = await cacheTest.testSalas();
    if (res !== 0){
      console.log('Error test cache salas')
    }
    res = await cacheTest.testTablero();
    if (res !== 0){
      console.log('Error test cache tablero')
    }
    */
    res = await cacheTest.testPartidas();
    if (res !== 0){
      console.log('Error test cache tablero')
    }
    console.log("\n\n\n\n");

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
