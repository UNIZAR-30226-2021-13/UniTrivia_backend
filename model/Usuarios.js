const db = require('../utils/DatabaseConnection.js')
const logger = require("../logger");
const bcrypt = require('bcrypt');

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
    const bd = db.getBD();
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

/***
 * Función para validar el login de un usuario en el sistema.
 *
 * @param username Nombre de usuario a logear.
 * @param password Contraseña del usuario a logear.
 * @returns {code: numbre, id: string} 0 si se valida correctamente el login, 1 si la contraseña o el
 *          usuario son incorrectos ,2 si el usuario no existe y 3 si se produce un error en la bd.
 */
function logear(username, password){
    const usuarios = db.getBD().collection("usuarios");
    let code = -1;
    let id = "Error desconocido";

    try {
        usuarios.findOne({_id: username}, function (err, user) {
            if (err) {

            } else if (!user) {
                logger.error("Error login: no existe el usuario.", err);
                code = 2;
                id = "Error login: no existe el usuario.";
            } else if (!bcrypt.compareSync(password, user.hash)) {
                logger.error("Error login: usuario o contraseña incorrectos.", err);
                code = 1;
                id = "Error login: usuario o contraseña incorrectos.";
            } else {
                code = 0;
                id = user._id;
            }
        });
    } catch(e){
        logger.error("Error login: error en la BD.", err);
        code = 3;
        id = "Error login: error en la BD.";
    }

    return {code: code, id: id};

}

/***
 * Función para modificar el banner de un usuario.
 *
 * @param username Nombre de usuario a modificar sus datos.
 * @param id_banner Identificador del bannera asociar al usuario.
 * @returns {number} 0 si actualiza el banner, 1 en caso de error en la BD
 */
function modificar_banner(username, id_banner){
    const usuarios = db.getBD().collection("usuarios");
    usuarios.updateOne({ _id:username }, {$set: {bnr: id_banner}}, function(err, result) {
        if(err){
            logger.error("Error update banner: error en la BD.", err);
            return 1;
        }

    });

    return 0;
}


/***
 * Función para modificar la forma de ficha de un usuario.
 *
 * @param username Nombre de usuario a modificar sus datos.
 * @param id_ficha Identificador de la forma de ficha a asociar al usuario.
 * @returns {number} 0 si actualiza la forma de la ficha, 1 en caso de error en la BD
 */
function modificar_ficha(username, id_ficha){
    const usuarios = db.getBD().collection("usuarios");
    usuarios.updateOne({ _id:username }, {$set: {fich: id_ficha}}, function(err, result) {
        if (err) {
            logger.error("Error update forma de la ficha: error en la BD.", err);
            return 1;
        }

    });

    return 0;
}

module.exports = {registrar, logear, modificar_ficha, modificar_banner}