const MongoClient = require('mongodb').MongoClient;
const logger = require('../logger');

let cliente = null, bd = null;

function iniciar(url = "mongodb://localhost:27017", nombreBD = "UniTrivia" ) {
    cliente = new MongoClient.connect(url,{poolSize: 10, tls: false});
    bd = cliente.db(nombreBD);
}
function terminar() {
    cliente.close();
}

module.exports = {iniciar, terminar};