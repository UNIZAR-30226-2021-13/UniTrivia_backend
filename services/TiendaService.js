/* eslint-disable no-unused-vars */
const Service = require('./Service');
const logger = require("../logger");
const Tienda = require("../model/Tienda");

/**
* Se le pasa comos parámetros el tipo de imágenes que se quieren recuperar  Devuelve una lista con los nombre de las imágenes del tipo correspondiente. 
*
* tipo String 
* returns List
* */
const catalogo = ({ tipo }) => new Promise(
  async (resolve, reject) => {
    try {
        const {code, data} = await Tienda.recuperarCatalogo(tipo);
        switch(code){
            case 0:
                resolve(Service.successResponse(data, 200));
                break;
            case 1:
                reject(Service.rejectResponse({code: 1, message: "No existen imagenes del tipo indicado"},400));
                break;
            case 2:
                reject(Service.rejectResponse({code: 2, message: "Error en la BD"},400));
                break;
            default:
                reject(Service.rejectResponse({code: -1, message: "Error desconocido"},500));

        }
    } catch (e) {
        reject(Service.rejectResponse(
            {code: -1, message: "Error desconocido"},500
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
          const result = await Tienda.comprarItem(jwt, nombre);
          switch(result){
              case 0:
                  resolve(Service.successResponse("OK", 200));
                  break;
              case 1:
                  reject(Service.rejectResponse({code: 1, message: "Error en la BD"},400));
                  break;
              case 2:
                  reject(Service.rejectResponse({code: 2, message: "Usuario no identificado"},400));
                  break;
              case 3:
                  reject(Service.rejectResponse({code: 3, message: "Item no existe"},400));
                  break;
              default:
                  reject(Service.rejectResponse({code: -1, message: "Error desconocido"},500));

          }
      } catch (e) {
          reject(Service.rejectResponse(
              {code: -1, message: "Error desconocido"},500
          ));
      }
  },
);

module.exports = {
  catalogo,
  comprar,
};
