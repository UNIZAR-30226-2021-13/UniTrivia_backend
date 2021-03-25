const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const logger = require('../logger');

let cliente = null, bd = null;

function iniciar(url = "mongodb://localhost:27017", nombreBD = "UniTrivia" ) {
    cliente = new MongoClient.connect(url,{poolSize: 10, tls: false});
    bd = cliente.db(nombreBD);
}
function terminar() {
    cliente.close();
}

/***
 * Función para validar el login de un usuario en el sistema.
 *
 * @param username Nombre de usuario a logear.
 * @param password Contraseña del usuario a logear.
 * @returns {integer} 0 si se valida correctamente el login, 1 si la contraseña o el usuario son incorrectos
 *          ,2 si el usuario no existe y 3 si se produce un error en la bd.
 */
function logear(username, password){
    usuarios = bd.collection("usuarios");
    var ok = 0;
    usuarios.findOne({ _id:username }, function(err, user) {
        if(err){
            logger.error("Error login: error en la BD.",err);
            return 3;
        }
        if(!user) {
            logger.error("Error login: no existe el usuario.",err);
            return 2;
        }

        // Valida que la contraseña escrita por el usuario, sea la almacenada en la db
        if (!bcrypt.compareSync(password, user.password)) {
            logger.error("Error login: usuario o contraseña incorrectos.",err);
            return 1;
        }
    });

    return ok;
}

module.exports = {iniciar, terminar, logear};