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

/***
 * Función para obtener la pregunta de seguridad de un usuario
 *
 *
 * @param username Nombre del usuario del cual recuperar la pregunta
 * @returns {string} devuelve la pregunta si esta se ha obtenido exitosamente y la cadena
 * vacia en caso contrario
 *
 */
function obtener_Pregunta(username){

    let pregunta = "";

    try{
        if(bd === null){
            logger.error("bd is null");
            return pregunta;
        }
        const usuarios = bd.collection("usuarios");
        usuarios.findOne({ _id:username }, function(err, user){
            if( err ){
                logger.error("Error obtener_Pregunta: error en la BD.", err);
                return "";
            }
            if( !user ){
                logger.error("Error obtener_Pregunta: no existe el usuario.", err);
                return "";
            }

            pregunta = user.preg;

        });

    }catch (err){
        logger.error("Unknown error", err);
        return 2;
    }

    return pregunta;
}

/**
 * Función para obtener la lista de ids de los objetos comprados del usuario en cuestión
 *
 * @param  username Nombre del usuario del cual recuperar la lista de objetos comprados
 * @return {number[]} devuelve la lista de objetos en caso correcto, [-1] en caso de error en la bd y
 *             [-2] si no existe el usuario
 */
function lista_comprados(username){
    let list = [];

    try{
        if(bd === null){
            logger.error("bd is null");
            return [-1];
        }
        const usuarios = bd.collection("usuarios");
        usuarios.findOne({ _id:username }, function(err, user){
            if( err ){
                logger.error("Error lista_comprados: error en la BD.", err);
                return [-1];
            }
            if( !user ){
                logger.error("Error lista_comprados: no existe el usuario.", err);
                return [-2];
            }

            list = user.rfs;
        });

    }catch (err){
        logger.error("Unknown error", err);
        return [-1];
    }

    return list;
}


/**
 * Función para validar la respuesta dada del usuario en cuestion
 *
 * @param username Nombre del usuario
 * @param res Respuesta dada
 * @return {number} 0 si la respuesta es correcta, 1 si es incorrecta y 2 si error
 *          en la base de datos
 */
function validar_respuesta(username, res){
    let ok = 0;

    try{
        if(bd === null){
            logger.error("bd is null");
            return 2;
        }
        const usuarios = bd.collection("usuarios");
        usuarios.findOne({ _id:username }, function(err, user){
            if( err ){
                logger.error("Error validar_respuesta: error en la BD.", err);
                return 2;
            }
            if( !user ){
                logger.error("Error validar_respuesta: no existe el usuario.", err);
                return 2;
            }

            if( res.toUpperCase() === user.res.toUpperCase() ){
                ok = 0;
            }else{
                ok = 1;
            }
        });

    }catch (err){
        logger.error("Unknown error", err);
        return 2;
    }

    return ok;
}

module.exports = {iniciar, terminar, getBD, obtener_Pregunta, lista_comprados, validar_respuesta};