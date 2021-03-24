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

/***
 * Función para crear un usuario en la base de datos inicializada anteriormente.
 *
 * @param username Nombre de usuario a crear.
 * @param hash Hash de la contraseña del usuario a crear.
 * @param email Email del usuario a crear
 * @param pregunta Pregunta de seguridad del usuario a crear.
 * @param respuesta Respuesta a la pregunta de seguridad para el usuario que se va a crear.
 * @returns {number} 0 si ha podido insertar al usuario, 1 si existe el username y 2 error en la bd.
 */
function registrar(username, hash, email, pregunta, respuesta){
    const usuario = {
        _id: username,
        mail: email,
        hash: hash,
        preg: pregunta,
        res: respuesta
    }
    let ok = 0;
    try{
        if(bd === null){
            logger.error("bd is null");
            return 2
        }
        const usuarios = bd.collection("usuarios");
        res = usuarios.find({_id:username});
        res.count(true, {limit: 1}, function(err, count){
            if(err){
                ok = 2;
                logger.error("Error creando un usuario.",err);
            }else{
                if(count === 0){
                    usuarios.insertOne(usuario, function(err, res){
                        if(err){
                            ok = false;
                            logger.error("Error creando un usuario.",err);
                        }
                        logger.info("Usuario "+username+" creado correctamente");
                    });
                }else{
                    ok = 1;
                }
            }
        });
    }catch (err){
        logger.error("Unknown error", err);
        return 2;
    }
    return ok;
}

module.exports = {iniciar, terminar,registrar};