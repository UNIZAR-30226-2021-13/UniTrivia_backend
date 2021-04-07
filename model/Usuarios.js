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

module.exports = {registrar, obtener_Pregunta, lista_comprados, validar_respuesta}