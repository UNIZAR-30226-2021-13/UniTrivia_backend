const db = require('../utils/DatabaseConnection.js')
const logger = require("../logger");
const bcrypt = require('bcrypt');
const {ObjectId} = require('mongodb');

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
async function registrar(username, hash, email, pregunta, respuesta){
    const usuario = {
        _id: username,
        mail: email,
        hash: hash,
        preg: pregunta,
        res: respuesta
    }
    let ok = 2;
    const bd = db.getBD();
    try{
        if(bd === null){
            logger.error("bd is null");
            return 2
        }
        const usuarios = bd.collection("usuarios");
        const user = await usuarios.findOne({_id: username});
        if (!user) {
            let res = await usuarios.insertOne(usuario);
            if(res['insertedCount'] === 1){
                ok = 0;
                logger.info("Usuario "+username+" creado correctamente");
            }else{
                ok = 2;
                logger.error("Error creando un usuario.",err);
            }
        } else {
            ok = 1;
            logger.info("Usuario ya existente");
        }
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
/*
function logear(username, password){
    const usuarios = db.getBD().collection("usuarios");
    let code = -1;
    let id = "Error desconocido";

    const result = ({ username, password }) => new Promise(
        async (resolve, reject) => {
            usuarios.findOne({_id: username})
                .then( user => {
                    if (!user) {
                        logger.error("Error login: no existe el usuario.");
                        code = 2;
                        id = "Error login: no existe el usuario.";
                    } else if (!bcrypt.compareSync(password, user.hash)) {
                        logger.error("Error login: usuario o contraseña incorrectos.");
                        code = 1;
                        id = "Error login: usuario o contraseña incorrectos.";
                    } else {
                        code = 0;
                        id = user._id;
                    }
                    console.log({code: code, id: id})
                    resolve({code: code, id: id});
                },
                err => logger.error("Error login: error en la BD.", err))
                .catch(e => logger.error("Error login: error desconocido.", e));
        });

    console.log(result);
    if(!result){
        return {code: code, id: id};
    } else{
        return result;
    }

}
*/

async function logear(username, password){
    let code = 3;
    let id = "Error en la BD";

    try {
        const usuarios = db.getBD().collection("usuarios");
        const user = await usuarios.findOne({_id: username});
        if (!user) {
            logger.error("Error login: no existe el usuario.");
            code = 2;
            id = "Error login: no existe el usuario.";
        } else if (!bcrypt.compareSync(password, user.hash)) {
            logger.error("Error login: usuario o contraseña incorrectos.");
            code = 1;
            id = "Error login: usuario o contraseña incorrectos.";
        } else {
            code = 0;
            id = user._id;
        }
        console.log({code: code, id: id})
        return {code: code, id: id};

    } catch(e) {
        logger.error("Error login: error desconocido.", e);
        return {code: code, id: id};
    }

}

/***
 * Función para modificar el banner de un usuario.
 *
 * @param username Nombre de usuario a modificar sus datos.
 * @param id_banner Identificador del bannera asociar al usuario.
 * @returns {number} 0 si actualiza el banner, 1 en caso de error en la BD
 */
async function modificar_banner(username, id_banner){
    try {
        const usuarios = db.getBD().collection("usuarios");
        const result = await usuarios.updateOne({ _id:username }, {$set: {bnr: ObjectId(id_banner)}});
        return 0;

    } catch(e) {
        logger.error("Error update banner: error en la BD.", e);
        return 1;
    }

}


/***
 * Función para modificar la forma de ficha de un usuario.
 *
 * @param username Nombre de usuario a modificar sus datos.
 * @param id_ficha Identificador de la forma de ficha a asociar al usuario.
 * @returns {number} 0 si actualiza la forma de la ficha, 1 en caso de error en la BD
 */
async function modificar_ficha(username, id_ficha){
    try {
        const usuarios = db.getBD().collection("usuarios");
        const result = await usuarios.updateOne({ _id:username }, {$set: {fich: ObjectId(id_ficha)}});
        return 0;

    } catch(e) {
        logger.error("Error update forma de la ficha: error en la BD.", e);
        return 1;
    }
}

module.exports = {registrar, logear, modificar_ficha, modificar_banner}