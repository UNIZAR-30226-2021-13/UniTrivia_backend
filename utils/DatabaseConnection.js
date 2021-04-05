const MongoClient = require('mongodb').MongoClient;
const logger = require('../logger');
const config = require('../config')

let cliente = null, bd = null;

async function iniciar(url = "mongodb://localhost:27017", nombreBD = "UniTrivia" ) {
    cliente = new MongoClient(url,{
        poolSize: 10,
        tls: true,
        tlsCertificateKeyFile: config.PATH_MONGO_KEY});
    cliente = await cliente.connect();
    bd = cliente.db(nombreBD);
}
function terminar() {
    cliente.close();
}

/**
 *
 * @returns {MongoClient.Db} Instancia de la base de datos de MongoDB
 */
function getBD(){
    return bd;
}

module.exports = {iniciar, terminar, getBD};