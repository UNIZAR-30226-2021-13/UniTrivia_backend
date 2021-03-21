db = new Mongo().getDB("UniTrivia")
try{
db.createCollection("usuarios",{
	validator: {
		$jsonSchema: {
			bsonType: "object",
			required: ["_id", "mail", "hash", "preg", "res"],
			properties: {
				_id: {
					bsonType: "string",
					description: "Nombre de Usuario único. String y Obligatorio"
				},
				mail: {
					bsonType: "string",
					description: "Correo electrónico del usuario. String y Obligatorio"
				},
				hash: {
					bsonType: "string",
					description: "Contraseña del usuario en hash"
				},
				preg: {
					bsonType: "string",
					description: "Pregunta de Seguridad para recuperar la contraseña"
				},
				res: {
					bsonType: "string",
					description: "Respuesta de segurar para recuperar la contraseña"
				},
				cns: {
					bsonType: "int",
					minimum: 0,
					description: "Monedas que tiene el jugador en el momento actual"
				},
				nj: {
					bsonType: "int",
					minimum: 0,
					description: "Número de partidas jugadas"
				},
				ng: {
					bsonType: "int",
					minimum: 0,
					description: "Número de partidas ganadas"
				},
				avtr: {
					bsonType: "int",
					description: "Id del avatar"
				},
				bnr: {
					bsonType: "int",
					description: "Id del banner"
				},
				fich: {
					bsonType: "int",
					description: "Id de la forma de ficha del usuario"
				},
				rfs: {
					bsonType: ["int"],
					description: "Ids de todos los objetos comprados por el usuario"
				}
			}
		}
	},
	validationAction: "error"
})
print("Exito creando la coleccion usuarios.")
}catch (err){
	print("Error creando la coleccion usuarios.")
	print(err)
}

try{
db.createCollection("preguntas",{
	validator: {
		$jsonSchema: {
			bsonType: "object",
			required: ["_id", "pregunta", "categoria", "resp_c", "resps_inc"],
			properties: {
				_id: {
					bsonType: "ObjectId",
					description: "Identificador único de la pregunta. Entero y Obligatorio"
				},
				pregunta: {
					bsonType: "string",
					description: "Cadena que contiene la pregunta en sí. String y Obligatorio"
				},
				categoria: {
					bsonType: "string",
					description: "Categoría a la que pertenece la pregunta. String y Obligatorio"
				},
				resp_c: {
					bsonType: "string",
					description: "Cadena que representa la respuesta correcta a la pregunta. String y Obligatorio"
				},
				resps_inc: {
					bsonType: "array",
					minItems: 1,
					maxItems: 3,
					items: {
						bsonType: "string",
					},
					description: "Array de cadenas que representan las respuestas incorrectas. String y Obligatorio"
				}
			}
		}
	},
	validationAction: "error"
})
print("Exito creando la coleccion preguntas.")
}catch (err){
	print("Error creando la coleccion preguntas.")
	print(err)
}

try{
db.createCollection("imagenes",{
	validator: {
		$jsonSchema: {
			bsonType: "object",
			required: ["_id", "tipo"],
			properties: {
				_id: {
					bsonType: "ObjectId",
					description: "Identificador único de la imagen. Id y Obligatorio"
				},
				tipo: {
					enum: [ "Avatar", "Banner", "Ficha", null ],
					description: "Cadena que contiene el tipo de imagen. Enumeración y Obligatorio"
				},
				img: {
                			bsonType: "binData",
                			description: "Datos binarios de la imagen"
                		}
			}
		}
	},
	validationAction: "error"
})
print("Exito creando la coleccion imagenes.")
}catch (err){
	print("Error creando la coleccion imagenes.")
	print(err)
}

try{
	res = db.usuarios.insert({
			_id:  "usuario_prueba",
			mail: "aaa@example.com",
			hash: "not hashed",
			preg: "hola",
			res:  "mundo"
		})
	if(res.nInserted != 1){
		print("Error escribiendo la entrada usuario: ".concat(res))
	}else{
		print("Escritura Correcta de un usuario.")
	}
}catch (err){
	print("Error creando una entrada en usuario.")
	print(err)
}
try{
	res = db.preguntas.insert({
			pregunta: "¿Como se llama el juego?",
			categoria: "Vario",
			resp_c: "UniTrivia",
			resps_inc: ["Trivial Pursuit", "Preguntados", "Saber y Ganar"]
		})
	if(res.nInserted != 1){
		print("Error escribiendo la entrada pregunta: ".concat(res))
	}else{
		print("Escritura Correcta de una pregunta.")
	}
}catch (err){
	print("Error creando una entrada en preguntas.")
	print(err)
}

try{
	res = db.imagenes.insert({
			tipo: "Avatar"
		})
	if(res.nInserted != 1){
		print("Error escribiendo la entrada imagen: ".concat(res))
	}else{
		print("Escritura Correcta de un imagen.")
	}
}catch (err){
	print("Error creando una entrada en imagen.")
	print(err)
}

print("USUARIOS: ")
res = db.usuarios.find()
while(res.hasNext()){print(tojson(res.next()));}
print("\n\n\n")
print("PREGUNTAS: ")
res = db.preguntas.find()
while(res.hasNext()){print(tojson(res.next()));}
print("\n\n\n")
print("IMAGENES")
res = db.imagenes.find()
while(res.hasNext()){print(tojson(res.next()));}


db.usuarios.remove({})
db.preguntas.remove({})
db.imagenes.remove({})
