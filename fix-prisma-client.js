const path = require('path');
const fs = require('fs');

console.log('Aplicando correções no cliente Prisma...');

const orignalCode = `const regularDirname = hasDirname && fs.existsSync(path.join(__dirname, 'schema.prisma')) && __dirname`;
const newCode =
`const schemaFilename  = hasDirname && path.join(__dirname, 'schema.prisma')
const regularDirname = hasDirname && fs.existsSync(schemaFilename) && path.resolve(schemaFilename, '..')
`;

setTimeout(replaceCode, 1000);


console.log('Correções aplicadas com sucesso!');


function replaceCode() {

    const prismaClientIndexFilename = path.join(__dirname, 'node_modules', '.prisma', 'client', 'index.js');

    let prismaClientIndexFileContent = fs.readFileSync(prismaClientIndexFilename, 'utf8');

    if (prismaClientIndexFileContent.indexOf(orignalCode) === -1) {
        console.log('Não foi possível encontrar o código a ser substituído.');
        process.exit(1);
    }

    prismaClientIndexFileContent = prismaClientIndexFileContent.replace(orignalCode, newCode);

    fs.writeFileSync(prismaClientIndexFilename, prismaClientIndexFileContent, 'utf8');
}