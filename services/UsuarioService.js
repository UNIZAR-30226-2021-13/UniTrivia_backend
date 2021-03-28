/* eslint-disable no-unused-vars */
const Service = require('./Service');
const bcrypt = require('bcrypt')
const modelo = require("../model");

/**
* No es necesario el paso de ningún parámetro.  Devuelve el identificador temporal con el que identificar todas las operaciones relacionadas con el invitado. 
*
* returns String
* */
const log_as_guest = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
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
* Se le pasa como parámetros el nombre de usuario y la contraseña en texto plano.
 * Devuelve el identificadortemporal con el que identificar todas las operaciones relacionadas con el usuario
 * y un error en caso de no poder identificarlo.
*
* username String 
* password String 
* returns String
* */
const login = ({ username, password }) => new Promise(
  async (resolve, reject) => {
      console.log("Entry")
    try {
        const {code, id} = await modelo.Usuarios.logear(username, password);
        console.log(code)
        console.log(id)
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
        console.log("Entry pocho")
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Se le pasa comos parámetros el identificador que se ha asociado a dicho usuario en el login y el id del nuevo avatar que quiere usar el usuario en cuestión, este útimo debe pertenecer a su lista de comprados.  Devuelve un mensaje de confirmación en caso de poder modificar el avatar. Devuelve un mensaje de error en caso contrario. 
*
* username String 
* idUnderscoreavatar Integer 
* returns String
* */
const modify_avatar = ({ username, idUnderscoreavatar }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        username,
        idUnderscoreavatar,
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
* Se le pasa comos parámetros el identificador que se ha asociado a dicho usuario en el login y el id del nuevo banner que quiere usar el usuario en cuestión, este útimo debe pertenecer a su lista de comprados.  Devuelve un mensaje de confirmación en caso de poder modificar el banner. Devuelve un mensaje de error en caso contrario. 
*
* username String 
* idUnderscorebanner Integer 
* returns String
* */
const modify_banner = ({ username, idUnderscorebanner }) => new Promise(
  async (resolve, reject) => {
    try {
        const result = await modelo.Usuarios.modificar_banner(username, idUnderscorebanner);
        switch(result){
            case 0:
                resolve(Service.successResponse("OK", 200));
                break;
            case 1:
                reject(Service.rejectResponse({code: 1, message: "Error en la BD"},400));
                break;
            default:
                reject(Service.rejectResponse({code: -1, message: "Error desconocido"},500));

        }
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Se le pasa comos parámetros el identificador que se ha asociado a dicho usuario en el login y el id de la nueva forma de ficha que quiere usar el usuario en cuestión, este útimo debe pertenecer a su lista de comprados.  Devuelve un mensaje de confirmación en caso de poder modificar la forma de ficha. Devuelve un mensaje de error en caso contrario. 
*
* username String 
* idUnderscoreformFicha Integer 
* returns String
* */
const modify_formFicha = ({ username, idUnderscoreformFicha }) => new Promise(
  async (resolve, reject) => {
    try {
        const result = await modelo.Usuarios.modificar_ficha(username, idUnderscoreformFicha);
        switch(result){
            case 0:
                resolve(Service.successResponse("OK", 200));
                break;
            case 1:
                reject(Service.rejectResponse({code: 1, message: "Error en la BD"},400));
                break;
            default:
                reject(Service.rejectResponse({code: -1, message: "Error desconocido"},500));

        }
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Se le pasa comos parámetros el nombre de usuario, la contraseña nueva en texto plano y la contraseña vieja o actual en texto plano  Devuelve un mensaje de confirmación de caso de poder modificar la contraseña y un error en caso de error. 
*
* username String 
* newUnderscorepassword String 
* oldUnderscorepassword String 
* returns String
* */
const modify_password = ({ username, newUnderscorepassword, oldUnderscorepassword }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        username,
        newUnderscorepassword,
        oldUnderscorepassword,
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
* Se le pasa como parámetros el identificador que se ha asociado a dicho usuario en el login.  Devuelve una lista con los objetos comprados por dicho usuario. Devuelve un mensaje de error si  hay algún probema al recuperar dicha lista. 
*
* username String 
* returns List
* */
const post_listaComprados = ({ username }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        username,
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
* Se le pasa comos parámetros el nombre de usuario, la respuesta a la pregunta de seguridad y la contraseña nueva en texto plano.  Devuelve un mensaje de confirmación de caso de que la respuesta coincida con la proporcionda y se ha podido poder modificar la contraseña. Devuelve error en caso contrario. 
*
* username String 
* res String 
* newUnderscorepassword String 
* returns String
* */
const recover_password = ({ username, res, newUnderscorepassword }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        username,
        res,
        newUnderscorepassword,
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
* Se le pasa como parámetro el nombre de usuario.  Devuelve la pregunta de seguridad del usuario. Devuelve error en caso de no poder recuperar la pregunta. 
*
* username String 
* returns String
* */
const recover_preg = ({ username }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        username,
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
      console.log("Entry")
      try {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);

          const num = modelo.Usuarios.registrar(username,hash,email,preg, res);
          if(num === 0){
              resolve(Service.successResponse("OK", 200));
          }else if(num === 1){
              reject(Service.rejectResponse({code: 1, message: "Usuario ya existente"},400));
          }else{
              reject(Service.rejectResponse({code: 0, message: "Error desconocido"},500));
          }
      } catch (e) {
          reject(Service.rejectResponse(
              e.message || 'Invalid input',
              e.status || 405,
          ));
      }
  },
);

module.exports = {
  log_as_guest,
  login,
  modify_avatar,
  modify_banner,
  modify_formFicha,
  modify_password,
  post_listaComprados,
  recover_password,
  recover_preg,
  register,
};
