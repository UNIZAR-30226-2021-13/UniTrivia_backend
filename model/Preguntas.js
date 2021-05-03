const db = require('../utils/DatabaseConnection.js');
const logger = require("../logger");

async function recuperarPregunta(cat){
    let code = 3;
    console.log(cat)

    try {
        const preguntas = db.getBD().collection("preguntas");
        const cursor = preguntas.aggregate([
            {$match: {categoria: cat}},
            {$sample: {size: 1}}
            ]);

        const preg = await cursor.next();

        if (!preg) {
            logger.error("Error recuperarPreguntas: no hay preguntas de la categoria " + cat);
            code = 2;
        } else {
            code = 0;
        }
        return {code: code, preg: preg};

    } catch(e) {
        logger.error("Error recuperarPreguntas: error desconocido.", e);
        return {code: code, preg: null};
    }
}

module.exports = {recuperarPregunta};