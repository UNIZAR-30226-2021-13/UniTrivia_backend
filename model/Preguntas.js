const db = require('../utils/DatabaseConnection.js');
const logger = require("../logger");

async function recuperarPregunta(cat){
    let code = 3;

    try {
        const preguntas = db.getBD().collection("preguntas");
        const preg = await preguntas.aggregate([{
            $match: {categoria: cat},
            $sample: {size: 1}
        }]);
        if (!preg) {
            logger.error("Error recuperarPreguntas: no hay preguntas de la categoria " + cat);
            code = 2;
        } else {
            code = 0;
        }
        return {code: code, preg: preg};

    } catch(e) {
        logger.error("Error login: error desconocido.", e);
        return {code: code, preg: null};
    }
}

module.exports = {recuperarPregunta};