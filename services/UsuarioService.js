/* eslint-disable no-unused-vars */
const Service = require('./Service');
const logger = require("../logger");
const modelo = require("../model");

/**
* No es necesario el paso de ningún parámetro.  Devuelve el identificador temporal con el que identificar todas las operaciones relacionadas con el invitado. 
*
* returns String
* */
const logAsGuest = () => new Promise(
  async (resolve, reject) => {
    try {
      const {code, id} = await modelo.Usuarios.invitado();
      switch (code){
          case 0:
              resolve(Service.successResponse(id, 200));
          default:
              reject(Service.rejectResponse(
                  {code: -1, message: "Error desconocido"},500
              ));
      }
    } catch (e) {
      reject(Service.rejectResponse(
          {code: -1, message: "Error desconocido"},500
      ));
    }
  },
);
/**
* Se le pasa como parámetros el nombre de usuario y la contraseña en texto plano.  Devuelve el identificador temporal con el que identificar todas las operaciones relacionadas con el usuario y un error en caso de no poder identificarlo. 
*
* username String 
* password String 
* returns String
* */
const login = ({ username, password }) => new Promise(
  async (resolve, reject) => {
    try {
        const {code, id} = await modelo.Usuarios.logear(username, password);
        switch(code){
            case 0:
                console.log("Entra 0")
                resolve(Service.successResponse(id, 200));
                break;
            case 1:
                console.log("Entra 1")
                reject(Service.rejectResponse({code: 1, message: "Usuario o contraseña incorrectos"},400));
                break;
            case 2:
                console.log("Entra 2")
                reject(Service.rejectResponse({code: 2, message: "No existe el usuario"},400));
                break;
            case 3:
                console.log("Entra 3")
                reject(Service.rejectResponse({code: 3, message: "Error en la BD"},400));
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
* Se le pasa comos parámetros el identificador que se ha asociado a dicho usuario en el login y el id del nuevo avatar que quiere usar el usuario en cuestión, este útimo debe pertenecer a su lista de comprados.  Devuelve un mensaje de confirmación en caso de poder modificar el avatar. Devuelve un mensaje de error en caso contrario. 
*
* jwt String 
* idavatar Integer 
* returns String
* */
const modifyAvatar = ({ jwt, idavatar }) => new Promise(
  async (resolve, reject) => {
    try {
        const result = await modelo.Usuarios.modificar_avatar(jwt, idavatar);
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
* Se le pasa comos parámetros el identificador que se ha asociado a dicho usuario en el login y el id del nuevo banner que quiere usar el usuario en cuestión, este útimo debe pertenecer a su lista de comprados.  Devuelve un mensaje de confirmación en caso de poder modificar el banner. Devuelve un mensaje de error en caso contrario. 
*
* jwt String 
* idbanner Integer 
* returns String
* */
const modifyBanner = ({ jwt, idbanner }) => new Promise(
  async (resolve, reject) => {
    try {
        const result = await modelo.Usuarios.modificar_banner(jwt, idbanner);
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
* Se le pasa comos parámetros el identificador que se ha asociado a dicho usuario en el login y el id de la nueva forma de ficha que quiere usar el usuario en cuestión, este útimo debe pertenecer a su lista de comprados.  Devuelve un mensaje de confirmación en caso de poder modificar la forma de ficha. Devuelve un mensaje de error en caso contrario. 
*
* jwt String 
* idformficha Integer 
* returns String
* */
const modifyFormFicha = ({ jwt, idformficha }) => new Promise(
  async (resolve, reject) => {
    try {
        const result = await modelo.Usuarios.modificar_ficha(jwt, idformficha);
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
* Se le pasa comos parámetros el nombre de usuario, la contraseña nueva en texto plano y la contraseña vieja o actual en texto plano  Devuelve un mensaje de confirmación de caso de poder modificar la contraseña y un error en caso de error. 
*
* jwt String 
* newpassword String 
* oldpassword String 
* returns String
* */
const modifyPassword = ({ jwt, newpassword, oldpassword }) => new Promise(
  async (resolve, reject) => {
    try {
        const code = await modelo.Usuarios.modificar_pass(jwt, newpassword, oldpassword);
        switch (code) {
            case 0:
                logger.info("CAMBIO CONTRASEÑA: OK");
                resolve(Service.successResponse("OK", 200));
                break;
            case 1:
                logger.info("CAMBIO CONTRASEÑA: INPUT ERRONEO");
                reject(Service.rejectResponse({code: 1, message: "Usuario o contraseña incorrectos"},400));
                break;
            case 2:
                logger.info("CAMBIO CONTRASEÑA: NO USUARIO");
                reject(Service.rejectResponse({code: 2, message: "No existe el usuario"},400));
                break;
            default:
                logger.error("CAMBIO CONTRASEÑA: NI IDEA");
                reject(Service.rejectResponse({code: -1, message: "Error desconocido"},500));
                break;
        }
    } catch (e) {
      reject(Service.rejectResponse(
          {code: -1, message: "Error desconocido"},500
      ));
    }
  },
);
/**
* Elimina la información del usuario de la base de datos 
*
* jwt String 
* returns String
* */
const profileDELETE = ({ jwt }) => new Promise(
  async (resolve, reject) => {
    try {
        const obj = await modelo.Usuarios.deletePerfil(jwt);
        switch (obj){
            case 0: // OK
                resolve(Service.successResponse("OK", 200));
                break;
            case 1: //NO AUTH
                reject(Service.rejectResponse({code: 1, message: "Usuario o contraseña incorrectos"},400));
                break;
            case 2: //NO EXISTE LA CUENTA
                reject(Service.rejectResponse({code: 2, message: "No existe el usuario"},500));
                break;
        }
    } catch (e) {
      reject(Service.rejectResponse(
          {code: -1, message: "Error desconocido"},500
      ));
    }
  },
);
/**
* Obtiene toda la información del usuario: nombre de usuario, email, pregunta de seguridad,   respuesta de seguridad, lista de objectos comprados, estadísticas del jugador, opciones   de personalización y cantidad de monedas. 
*
* jwt String 
* returns Usuario
* */
const profileGET = ({ jwt }) => new Promise(
  async (resolve, reject) => {
    try {
      const obj = await modelo.Usuarios.getPerfil(jwt);
      switch (obj['code']){
          case 0: // OK
            resolve(Service.successResponse(obj['data'], 200));
            break;
          case 1: //NO AUTH
            reject(Service.rejectResponse({code: 1, message: "Usuario o contraseña incorrectos"},400));
            break;
          case 2: //ERROR BD
            reject(Service.rejectResponse({code: -1, message: "Error desconocido"},500));
            break;
      }
    } catch (e) {
      reject(Service.rejectResponse(
          {code: -1, message: "Error desconocido"},500
      ));
    }
  },
);
/**
* Se le pasa comos parámetros el nombre de usuario, la respuesta a la pregunta de seguridad y la contraseña nueva en texto plano.  Devuelve un mensaje de confirmación de caso de que la respuesta coincida con la proporcionda y se ha podido poder modificar la contraseña. Devuelve error en caso contrario. 
*
* username String 
* res String 
* newpassword String
* returns String
* */
const recoverPassword = ({ username, res, newpassword }) => new Promise(
  async (resolve, reject) => {
    try {
      const code = await modelo.Usuarios.validar_respuesta(username,res,newpassword);
      switch (code){
          case 0:
              logger.info("RECUPERACIÓN DE PASSWORD: OK");
              resolve(Service.successResponse("OK",200));
              break;

          case 1:
              logger.info("RECUPERACIÓN DE PASSWORD: respuesta incorrecta");
              reject(Service.rejectResponse({code: 1, message:"Respuesta incorrecta"},400));
              break;

          case 2:
              logger.info("RECUPERACIÓN DE PASSWORD: error en bd");
              reject(Service.rejectResponse({code: 1, message:"Error en bd"},400));
              break;

          case 3:
              logger.info("RECUPERACIÓN DE PASSWORD: usuario no identificado");
              reject(Service.rejectResponse({code: 1, message:"Usuario no identificado"},400));
              break;

          case 4:
              logger.info("RECUPERACIÓN DE PASSWORD: error al cambiar la contraseña");
              reject(Service.rejectResponse({code: 1, message:"Error al cambiar la contraseña"},400));
              break;
      }
    } catch (e) {
      reject(Service.rejectResponse(
          {code: -1, message: "Error desconocido"},500
      ));
    }
  },
);



const recoverQuestion = ({ username }) => new Promise(
    async (resolve, reject) => {
        try {
            const obj = await modelo.Usuarios.recoverQuestion(username);
            switch (obj['code']){
                case 0: // OK
                    resolve(Service.successResponse(obj['data'], 200));
                    break;
                case 1: //ERROR NO USUARIO
                    reject(Service.rejectResponse({code: 2, message: "No existe el usuario"},500));
                    break;
                default: //ERROR BD
                    reject(Service.rejectResponse({code: -1, message: "Error desconocido"},500));
                    break;
            }
        } catch (e) {
            reject(Service.rejectResponse(
                {code: -1, message: "Error desconocido"},500
            ));
        }
    },
);

/**
* Se le pasa comos parámetros el nombre de usuario, la contraseña en texto plano, el email la pregunta de seguridad y la respuesta a dicha presgunta.  Devuelve un mensaje de confirmación de caso de poder crear el usuario y un error en caso de no poder crearlo. 
*
* username String 
* password String 
* email String 
* preg String 
* res String 
* returns String
* */
const register = ({ username, password, email, preg, res }) => new Promise(
  async (resolve, reject) => {
    try {
        const num = await modelo.Usuarios.registrar(username,password,email,preg, res);
        if(num === 0){
            resolve(Service.successResponse("OK", 200));
        }else if(num === 1){
            reject(Service.rejectResponse({code: 1, message: "Usuario ya existente"},400));
        }else{
            reject(Service.rejectResponse({code: 0, message: "Error desconocido"},500));
        }
    } catch (e) {
      reject(Service.rejectResponse(
          {code: -1, message: "Error desconocido"},500
      ));
    }
  },
);

module.exports = {
  logAsGuest,
  login,
  modifyAvatar,
  modifyBanner,
  modifyFormFicha,
  modifyPassword,
  profileDELETE,
  profileGET,
  recoverPassword,
  recoverQuestion,
  register,
};
