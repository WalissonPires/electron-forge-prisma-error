

Projeto para reprodução um erro na execução do prisma quando executando junto ao Electron-Forge/Webpack.

# Como o projeto foi criado?

- ```npx create-electron-app my-new-app --template=typescript-webpack```
- ```npm install prisma -D```
- ```npm install @prisma/client```

# Executar projeto (Já corrigido)

- ```npm install```
- ```npm run prisma-generate```
- ```npm start```

# O problema e como foi resolvido

Ao executar o projeto com ```npm start``` ocorre o seguinte erro:

```js
Error: ENOENT: no such file or directory, open 'C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\schema.prisma'
    at Object.openSync (node:fs:585:3)
    at Object.func [as openSync] (node:electron/js2c/asar_bundle:5:1812)
    at Object.readFileSync (node:fs:453:35)
    at Object.e.readFileSync (node:electron/js2c/asar_bundle:5:9160)
    at new LibraryEngine (C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:35648:41)
    at PrismaClient.getEngine (C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:40447:16)
    at new PrismaClient (C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:40422:29)
    at C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:45610:14
    at C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:45615:3
    at Object.<anonymous> (C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:45618:12)
```

O **schema.prisma** é copiado pelo webpack para  *.webpack/main/native_modules/schema.prisma* mas o prisma tentar usar *.webpack/main/schema.prisma*.

O prisma usa o *.webpack/main/schema.prisma* por causa dessa linha modifica pelo webpack ao fazer o bundle:

Linha original:
```js
// @filename: .prisma/client/index.js
const regularDirname = hasDirname && fs.existsSync(path.join(__dirname, 'schema.prisma')) && __dirname
```

```js
// @filename: .webpack/main/index.js
const regularDirname = hasDirname && fs.existsSync(__webpack_require__.ab + "schema.prisma") && __dirname
```

Equando **__webpack_require__.ab** é o caminho para pasta *.webpack/main/native_modules* o **__dirname** é o caminho para *.webpack/main*. Portando, a verificação da existência do schema é feita no local correto (retornando verdadeiro) mas o caminho usado é errado.

Alterar as linhas abaixo do fonte, prisma-client, gerado pelo prisma corrige o problema:

```js
// @filename: .prisma/client/index.js
const schemaFilename  = hasDirname && path.join(__dirname, 'schema.prisma');
const regularDirname = hasDirname && fs.existsSync(schemaFilename) && path.resolve(schemaFilename, '..');
```

Webpack gera:
```js
const schemaFilename  = hasDirname && __webpack_require__.ab + "schema.prisma";
const regularDirname = hasDirname && fs.existsSync(schemaFilename) && path.resolve(schemaFilename, '..');
```

Entretanto o prisma gera um novo erro:

```js
PrismaClientInitializationError:
Invalid `prisma.user.findFirst()` invocation:


  Query engine library for current platform "windows" could not be found.
You incorrectly pinned it to windows

This probably happens, because you built Prisma Client on a different platform.
(Prisma Client looked in "C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\query_engine-windows.dll.node")

Searched Locations:

  C:\Users\<user>\Desktop\.prisma\client
  C:\Users\<user>\Desktop\electron-forge-prisma\node_modules\@prisma\client
  C:\Users\<user>\Desktop\electron-forge-prisma\.webpack
  C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\native_modules
  C:\Users\<user>\Desktop\electron-forge-prisma\prisma
  /tmp/prisma-engines
  C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\native_modules


To solve this problem, add the platform "windows" to the "binaryTargets" attribute in the "generator" block in the "schema.prisma" file:
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native"]
}

Then run "prisma generate" for your changes to take effect.
Read more about deploying Prisma Client: https://pris.ly/d/client-generator
    at Object.request (C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:40005:15)
    at async PrismaClient._request (C:\Users\<user>\Desktop\electron-forge-prisma\.webpack\main\index.js:40828:18) {
  clientVersion: '3.11.1',
  errorCode: undefined
}
```

Esse problema acontece porque o webpack copia a "dll" para *.webpack/main/native_modules/client/query_engine-windows.dll.node*. Os locais onde o prisma está procurando são:

- 'C:\\Users\\<user>\\Desktop\\.prisma\\client'
- 'C:\\Users\\<user>\\Desktop\\electron-forge-prisma\\node_modules\\@prisma\\client'
- 'C:\\Users\\<user>\\Desktop\\electron-forge-prisma\\.webpack'
- 'C:\\Users\\<user>\\Desktop\\electron-forge-prisma\\.webpack\\main\\native_modules'
- 'C:\\Users\\<user>\\Desktop\\electron-forge-prisma\\prisma'
- '/tmp/prisma-engines'
- 'C:\\Users\\<user>\\Desktop\\electron-forge-prisma\\.webpack\\main\\native_modules

Corrige esse problema configurando a variável de ambiente **PRISMA_QUERY_ENGINE_LIBRARY ** antes de instância o prisma:

```js
// @filename: src/index.ts
process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(__dirname, 'native_modules', 'client', 'query_engine-windows.dll.node');

const prisma = new Prisma();
//...
```

Com isso consegui usar o prisma.