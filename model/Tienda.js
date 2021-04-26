const db = require('../utils/DatabaseConnection.js');
const jwt = require('../utils/JWT.js');
const logger = require("../logger");

/**
 * Recupera todas las imagenes del tipo especificado de la base de datos
 *
 * @param tipo Tipo de las imagenes (formFicha, avatar o banner)
 * @returns {Promise<{code: number, data: []}>}
 */
async function recuperarCatalogo(tipo){
    let code = 2;
    let id = "Error en la BD";
    let array = [];

    try {
        const imagenes = db.getBD().collection("imagenes");
        const imgs = await imagenes.find({tipo: tipo}).toArray();
        if (!imgs) {
            logger.error("Error recuperarCatalogo: no hay imagenes del tipo.");
            code = 1;
            id = "Error recuperarCatalogo: no hay imagenes del tipo.";
        } else {
            for(let i = 0; imgs.length ; i++){
                array.push(imgs[i].data);
            }
            code = 0;
        }
        return {code: code, data: array};

    } catch(e) {
        logger.error("Error recuperarCatalogo: error desconocido.", e);
        return {code: code, data: []};
    }

}

/**
 * Actualiza la base de datos con el nombre del ítem comprado si este existe
 *
 * @param jwt JWT del usuario
 * @param nombre Nombre del ítem comprado
 * @returns {Promise<number>}
 */
async function comprarItem(jwt, nombre){
    try {
        const imagenes = db.getBD().collection("imagenes");
        const usuarios = db.getBD().collection("imagenes");
        const obj = jwt.validarToken(token);
        if(obj) {
            const exists = await imagenes.findOne({_id: nombre});
            if(!exists) logger.error("Error comprarItem: ítem no existe"); return 3;

            const result = await usuarios.updateOne({_id: obj.user}, {$push: {rfs: nombre}});
            return 0;

        }else{
            logger.error("Error comprarItem: usuario no identificado");
            return 2;
        }

    } catch(e) {
        logger.error("Error comprarItem: error en la BD.", e);
        return 1;
    }

}

module.exports = {recuperarCatalogo, comprarItem};