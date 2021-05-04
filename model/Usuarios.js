const db = require('../utils/DatabaseConnection.js');
const jwt = require('../utils/JWT.js');
const logger = require("../logger");
const {ObjectID} = require('mongodb');
const bcrypt = require('bcrypt');

//Origen: https://stackoverflow.com/a/1349426
function randString(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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
                res: respuesta,
                avtr: "avatar0",
                bnr: "banner0",
                fich: "ficha0",
                rfs: ["avatar0","banner0","ficha0"]
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
            id = jwt.crearToken(user._id, false);
        }
        console.log({code: code, id: id})
        return {code: code, id: id};

    } catch(e) {
        logger.error("Error login: error desconocido.", e);
        return {code: code, id: id};
    }

}

/**
 * Función para crear una sesión como invitado
 *
 * @returns {Promise<{code: number, id: string}>}
 */
async function invitado(){
    try {
        const username = "Guest_" + randString(10);
        const id = jwt.crearToken(username, true);
        console.log({code: 0, id: id})
        return {code: 0, id: id};

    } catch(e) {
        logger.error("Error login: error desconocido.", e);
        return {code: 1, id: ""};
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
        const obj = jwt.validarToken(token);
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
        const obj = jwt.validarToken(token);
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
        const obj = jwt.validarToken(token);
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
        const obj = jwt.validarToken(token);
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
    const obj = jwt.validarToken(token);
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
                avtr: "avatar0",
                bnr: "banner0",
                fich: "ficha0",
                rfs: ["avatar0","banner0","ficha0"]
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
    const obj = jwt.validarToken(token);
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
 * @param username Nombre del usuario
 * @param res Respuesta dada
 * @param newpassword Nueva contraseña que se establecerá si coincide la respuesta
 * @return {number} 0 si la respuesta es correcta y consigue cambiar la contraseña, 1 si es incorrecta, 2 si error
 *          en la base de datos, 3 si acceso no autorizado y 4 si respuesta correcta pero no se ha podido cambiar
 *          la contraseña
 */
async function validar_respuesta(username, res, newpassword){
    let ok = 0;

    try{
        const usuarios = db.getBD().collection("usuarios");
        const user = await usuarios.findOne({_id: username});


        if( res.toUpperCase() === user.res.toUpperCase() ){
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(newpassword,salt);
            const res = await usuarios.updateOne({_id: username}, {$set: {hash: hash}});
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
    }catch(e){
        logger.error("Error al validar respuesta: error en la BD.", e);
        ok = 2;
    }

    return ok;
}


/**
 *
 * @param username Nombre de usuario del que obtener la respuesta de seguridad
 * @returns {Promise<{code: number, data: *}|{code: number, data: null}>}
 *              Devuelve 0 si ok, 1 si no existe, 2 si error bd.
 *              Si es 0, devuelve la pregunta de seguridad del usuario, si no null.
 */
async function recoverQuestion(username) {
    const usuarios = db.getBD().collection("usuarios");
    try {
        const usr = await usuarios.findOne({_id: username});
        if (usr) {
            return {code: 0, data: usr['preg']};
        } else {
            return {code: 1, data: null};
        }
    }catch (e) {
        return {code: 2, data: null};
    }
}

async function anyadirPartida(usuario, ganada){
    let que = {nj: 1};
    if(ganada === true){
        que["ng"] = 1;
    }
    const result = await usuarios.updateOne(
        { _id: usuario},
        {$inc: que}
    );

    return result["modifiedCount"];
}

module.exports = {registrar, logear, invitado, modificar_ficha, modificar_banner,
                    modificar_avatar, modificar_pass,getPerfil, deletePerfil,
                    validar_respuesta, recoverQuestion, anyadirPartida}
