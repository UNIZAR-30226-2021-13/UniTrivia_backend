/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Se le pasa comos parámetros el tipo de imágenes que se quieren recuperar  Devuelve una lista con los nombre de las imágenes del tipo correspondiente. 
*
* tipo String 
* returns List
* */
const catalogo = ({ tipo }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        tipo,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Se le pasa el nombre de la imagen comprada  Actualiza la base de datos del usuario para incorporar la imagen comprada a su lista de imágenes disponibles. 
*
* nombre String 
* returns String
* */
const comprar = ({ nombre }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        nombre,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  catalogo,
  comprar,
};
