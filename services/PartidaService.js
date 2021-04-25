const Service = require('./Service');
const logger = require("../logger");
const cache = require("../utils/ServerCache");
const JWT = require("../utils/JWT");


const reconexion = ({jwt}) => new Promise(
    async (resolve, reject) => {
        const usuario = JWT.validarToken(jwt);
        if(usuario){
            const ok = cache.salaDelUsuario(usuario['user']);
            console.log(usuario);
            console.log(ok);
            if(ok['code'] === 0){
                resolve(Service.successResponse(ok['sala'], 200));
            }else{
                reject(Service.rejectResponse({code: 2, message: "Error desconocido"},400));

            }
        }else{
            reject(Service.rejectResponse({code: 1, message: "Usuario no identificado"},400));
        }
    },
);

module.exports = {
    reconexion,
};