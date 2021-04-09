const db = require('../utils/DatabaseConnection.js')
const logger = require("../logger");
const JWT = require('jsonwebtoken');
const config = require('../config');
const bcrypt = require('bcrypt');
const {ObjectID} = require('mongodb');


/**
 * Función para validar un token.
 *
 * @param token JWT a validar
 * @returns {null|object} Objeto con la información contenida del token si es válido
 *          y si no devuelve null
 */
function validarToken(token) {
    try {
        return JWT.verify(token, config.JWT_KEY);
    } catch(err){
        logger.error("Token no válido", err);
        return null;
    }

}

/***
 * Función para crear un token.
 *
 * @param username Nombre de usuario a crear.
 * @param guest True si el usuario es invitado y false en caso contrario.
 * @returns {null|string} token o null si error
 */
function crearToken(username, guest) {
    try {
        const payload = {user: username, guest: guest};
        return JWT.sign(payload, config.JWT_KEY, {expiresIn: '20h'});
    } catch(err){
        logger.error("Error creando token", err);
        return null;
    }

}


/***
 * Función para crear un usuario en la base de datos inicializada anteriormente.
 *
 * @param username Nombre de usuario a crear.
 * @param password Contraseña del usuario a crear.
 * @param email Email del usuario a crear
 * @param pregunta Pregunta de seguridad del usuario a crear.
 * @param respuesta Respuesta a la pregunta de seguridad para el usuario que se va a crear.
 * @returns {number} 0 si ha podido insertar al usuario, 1 si existe el username y 2 error en la bd.
 */
async function registrar(username, password, email, pregunta, respuesta){
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
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            const usuario = {
                _id: username,
                mail: email,
                hash: hash,
                preg: pregunta,
                res: respuesta
            };
            let res = await usuarios.insertOne(usuario);
            if(res['insertedCount'] === 1){
                ok = 0;
                logger.info("Usuario "+username+" creado correctamente");
            }else{
                ok = 2;
                logger.error("Error creando un usuario.");
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
 * @returns {object} 0 si se valida correctamente el login, 1 si la contraseña o el
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
            id = crearToken(user._id, false);
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
 * @param token Token de sesión del usuario.
 * @param id_banner Identificador del bannera asociar al usuario.
 * @returns {number} 0 si actualiza el banner, 1 en caso de error en la BD, 2 acceso no autorizado
 */
async function modificar_banner(token, id_banner){
    try {
        const usuarios = db.getBD().collection("usuarios");
        const obj = validarToken(token);
        if(obj) {
            //const result = await usuarios.updateOne({ _id:username }, {$set: {bnr: ObjectId(id_banner)}});
            const result = await usuarios.updateOne({_id: obj.user}, {$set: {bnr: id_banner}});
            return 0;
        }else{
            logger.error("Usuario no identificado");
            return 2;
        }

    } catch(e) {
        logger.error("Error update banner: error en la BD.", e);
        return 1;
    }

}


/***
 * Función para modificar la forma de ficha de un usuario.
 *
 * @param token Token de sesión del usuario.
 * @param id_formFicha Identificador de la forma de ficha a asociar al usuario.
 * @returns {number} 0 si actualiza la forma de la ficha, 1 en caso de error en la BD
 */
async function modificar_ficha(token, id_formFicha){
    try {
        const usuarios = db.getBD().collection("usuarios");
        const obj = validarToken(token);
        //const result = await usuarios.updateOne({ _id:username }, {$set: {fich: ObjectId(id_ficha)}});
        console.log(typeof id_formFicha);
        console.log(id_formFicha);
        console.log(typeof obj.user);
        if(obj){
            const result = await usuarios.updateOne({ _id:obj.user }, {$set: {fich: id_formFicha}});
            return 0;
        }else{
            return 2;
        }

    } catch(e) {
        logger.error("Error update forma de la ficha: error en la BD.", e);
        return 1;
    }
}

/***
 * Función para modificar eñ avatar del usuario.
 *
 * @param token Token de sesión del usuario.
 * @param id_avatar Identificador de la forma de ficha a asociar al usuario.
 * @returns {number} 0 si actualiza la forma de la ficha, 1 en caso de error en la BD
 */
async function modificar_avatar(token, id_avatar){
    try {
        const usuarios = db.getBD().collection("usuarios");
        const obj = validarToken(token);
        if(obj) {
            const result = await usuarios.updateOne({_id: obj.user}, {$set: {avtr: ObjectId(id_avatar)}});
            if (result) {
                logger.info("AVATAR: ok");
                return 0;
            } else {
                logger.info("AVATAR: err");
                return 1;
            }
        }else{
            return 2;
        }
    } catch(e) {
        logger.error("AVATAR: err", e);
        return 1;
    }
}

/**
 * Dado un token de sesión válido, la contraseña actual y la nueva contraseña.
 * cambia la contraseña del usuario.
 *
 * @param token Token de sesión del usuario.
 * @param oldPass Contraseña anterior
 * @param newPass Nueva contraseña
 * @returns {Promise<number>}
 */
async function modificar_pass(token, newPass, oldPass){
    let ok = -1;

    try {
        const usuarios = db.getBD().collection("usuarios");
        const obj = validarToken(token);
        if(obj) {
            const user = await usuarios.findOne({_id: obj.user});
            console.log(obj.user)
            console.log(oldPass)
            console.log(newPass)
            console.log(user)
            if (!user) {
                logger.error("Error cambiar contraseña: no existe el usuario.");
                ok = 2;
            } else if (!bcrypt.compareSync(oldPass, user['hash'])) {
                logger.error("Error cambiar contraseña: usuario o contraseña incorrectos.");
                ok = 1;
            } else {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(newPass, salt);
                const res = await usuarios.updateOne({_id: obj.user}, {$set: {hash: hash}});
                if (res) {
                    ok = 0;
                } else {
                    ok = -1;
                }
            }
        }else{
            ok = 1;
        }
    }catch(err){
        logger.error("Error cambiar contraseña: error desconocido.", err);
        return -1;
    }
    return ok
}

/**
 *
 * @param token Token de identificación del usuario
 * @returns {Promise<{code: number, data: *}|{code: number, data: null}>}
 *              Devuelve 0 si ok, 1 si no autorizado, 2 si error bd.
 *              Si es 0, devuelve la información del usuario, sino null.
 */
async function getPerfil(token) {
    const usuarios = db.getBD().collection("usuarios");
    const obj = validarToken(token);
    if (obj && !obj['guest']) {
        const usr = await usuarios.findOne({_id: obj.user});
        if (usr) {
            const base = {
                _id: "",
                mail: "",
                preg: "",
                res: "",
                cns: 0,
                nj: 0,
                ng: 0,
                avtr: new ObjectID.createFromHexString("606b2b15adc9cc1846fe1500"), //TODO: HAY QUE CAMBIAR EL VALOR POR UN DEFAULT
                bnr: new ObjectID.createFromHexString("606b2b15adc9cc1846fe1500"), //TODO: HAY QUE CAMBIAR EL VALOR POR UN DEFAULT
                fich: new ObjectID.createFromHexString("606b2b15adc9cc1846fe1500"), //TODO: HAY QUE CAMBIAR EL VALOR POR UN DEFAULT
                rfs: []
            };
            delete usr.hash;
            return {code: 0, data: {...base, ...usr}};
        } else {
            return {code: 2, data: null};
        }
    //}else if(obj && !obj['guest']){
    }else{
        return {code: 1, data: null};
    }
}

async function deletePerfil(token){
    const usuarios = db.getBD().collection("usuarios");
    const obj = validarToken(token);
    if(obj && !obj['guest']) {
        const res = await usuarios.deleteOne({_id: obj.user});
        if(res['deletedCount'] > 0){
            return 0
        }else{
            return 2;
        }
    //}else if(obj && !obj['guest']){
    }else{
        return 1;
    }
}

/**
 * Función para validar la respuesta dada del usuario en cuestion
 *
 * @param token Token de sesión del usuario
 * @param res Respuesta dada
 * @param newpassword Nueva contraseña que se establecerá si coincide la respuesta
 * @return {number} 0 si la respuesta es correcta y consigue cambiar la contraseña, 1 si es incorrecta, 2 si error
 *          en la base de datos, 3 si acceso no autorizado y 4 si respuesta correcta pero no se ha podido cambiar
 *          la contraseña
 */
async function validar_respuesta(token, res, newpassword){
    let ok = 0;

    try{
        const usuarios = db.getBD().collection("usuarios");
        const obj = validarToken(token);
        if( obj ){
            const user = await usuarios.findOne({_id: obj.user});


            if( res.toUpperCase() === user.res.toUpperCase() ){
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(newpassword,salt);
                const res = await usuarios.updateOne({_id: obj.user}, {$set: {hash: hash}});
                if(res) {
                    ok = 0;
                }
                else {
                    logger.error("Respuesta correcta, pero no se ha podido cambiar contrasenya");
                    ok = 4;
                }
            }else{
                ok = 1;
            }
        }else{
            logger.error("Usuario no identificado");
            ok = 3;
        }
    }catch(e){
        logger.error("Error al validar respuesta: error en la BD.", e);
        ok = 2;
    }

    return ok;
}

module.exports = {registrar, logear, modificar_ficha, modificar_banner,
                    modificar_avatar, modificar_pass,getPerfil, deletePerfil, validar_respuesta}
