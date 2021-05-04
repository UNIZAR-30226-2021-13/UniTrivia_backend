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
        if (imgs.length === 0) {
            logger.error("Error recuperarCatalogo: no hay imagenes del tipo.");
            code = 1;
            id = "Error recuperarCatalogo: no hay imagenes del tipo.";
        } else {
            for(let i = 0; i < imgs.length ; i++){
                array.push({nombre: imgs[i]._id, precio: imgs[i].precio});
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
async function comprarItem(token, nombre){
    try {
        const imagenes = db.getBD().collection("imagenes");
        const usuarios = db.getBD().collection("usuarios");
        const obj = jwt.validarToken(token);
        if(obj) {
            const exists = await imagenes.findOne({_id: nombre});
            console.log(exists);
            if(!exists) {
                logger.error("Error comprarItem: ítem no existe");
                return 3;
            }

            const precio = exists['precio'];
            const user = await usuarios.findOne({_id: obj.user});
            console.log(user);
            if(!user){
                logger.error("Error comprarItem: usuario no existe");
                return 4;
            }

            if(exists['precio'] > user['cns']){
                logger.error("Error comprarItem: no tiene suficiente dinero");
                return 5;
            }

            if(user['rfs'].includes(nombre)){
                logger.error("Error comprarItem: ítem ya comprado");
                return 6;
            }

            const result = await usuarios.updateOne({_id: obj.user},
                {$push: {rfs: nombre}}, {$inc: {cns: (- exists['precio']) }});
            if(result['modifiedCount'] === 1){
                return 0;

            }else{
                logger.error("Error comprarItem: error en la BD.");
                return 1;
            }

        }else{
            logger.error("Error comprarItem: usuario no identificado");
            return 2;
        }

    } catch(e) {
        logger.error("Error comprarItem: error en la BD.", e);
        return 1;
    }

}

async function insertarMonedas(cantidad, token){
    try{
        const usuarios = db.getBD().collection("usuarios");
        const obj = jwt.validarToken(token);
        if(cantidad <= 0){
            return 3;
        }
        if(obj) {
            const result = await usuarios.updateOne(
                { _id: obj.user},
                {$inc: {cns: cantidad}}
            ); //$inc crea el campo si no existe y le pone de valor <cantidad>

            if(result['modifiedCount'] === 1){
                return 0
            }else{
                return 1;
            }

        }else{
            logger.error("Error insertarMonedas: usuario no identificado");
            return 2;
        }
    }catch (e) {
        logger.error("Error insertarMonedas: error en la BD.", e);
        return 1;
    }
}

module.exports = {recuperarCatalogo, comprarItem, insertarMonedas};