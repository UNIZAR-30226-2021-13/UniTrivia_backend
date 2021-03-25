const MongoClient = require('mongodb').MongoClient;
const logger = require('../logger');

let cliente = null, bd = null;

function iniciar(url = "mongodb://localhost:27017", nombreBD = "UniTrivia" ) {
    cliente = new MongoClient(url,{poolSize: 10, tls: false, useUnifiedTopology: true });
    cliente.connect().then((cl) =>{
        cliente = cl;
        logger.info("Connected DB");
        bd = cliente.db(nombreBD);
    });
}
function terminar() {
    cliente.close();
}

function getBD(){
    return bd;
}



module.exports = {iniciar, terminar, getBD};