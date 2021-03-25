const db = require('../utils/DatabaseConnection.js');
const logger = require("../logger");
const JWT = require("jsonwebtoken");
const config = require("../config");
const bcrypt = require("bcrypt");
const {ObjectId} = require("mongodb");

/* Simplemente hay que copiar esta función en el modelo global */
/**
 * Función para validar la respuesta dada del usuario en cuestion
 *
 * @param token Token de sesión del usuario
 * @param res Respuesta dada
 * @return {number} 0 si la respuesta es correcta, 1 si es incorrecta, 2 si error
 *          en la base de datos y 3 si acceso no autorizado
 */
async function validar_respuesta(token, res){
    let ok = 0;

    try{
        const usuarios = db.getBD().collection("usuarios");
        const obj = validarToken(token);
        if( obj ){
            const user = await usuarios.findOne({_id: obj.user});


            if( res.toUpperCase() === user.res.toUpperCase() ){
                ok = 0;
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
    /*let ok = 0;

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

    return ok;*/
}

module.exports = {registrar, obtener_Pregunta, lista_comprados, validar_respuesta}