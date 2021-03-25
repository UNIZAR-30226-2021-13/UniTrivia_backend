/**
 * The UsuarioController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/UsuarioService');
const log_as_guest = async (request, response) => {
  await Controller.handleRequest(request, response, service.log_as_guest);
};

const login = async (request, response) => {
  await Controller.handleRequest(request, response, service.login);
};

const modify_avatar = async (request, response) => {
  await Controller.handleRequest(request, response, service.modify_avatar);
};

const modify_banner = async (request, response) => {
  await Controller.handleRequest(request, response, service.modify_banner);
};

const modify_formFicha = async (request, response) => {
  await Controller.handleRequest(request, response, service.modify_formFicha);
};

const modify_password = async (request, response) => {
  await Controller.handleRequest(request, response, service.modify_password);
};

const post_listaComprados = async (request, response) => {
  await Controller.handleRequest(request, response, service.post_listaComprados);
};

const recover_password = async (request, response) => {
  await Controller.handleRequest(request, response, service.recover_password);
};

const recover_preg = async (request, response) => {
  await Controller.handleRequest(request, response, service.recover_preg);
};

const register = async (request, response) => {
  await Controller.handleRequest(request, response, service.register);
};


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
