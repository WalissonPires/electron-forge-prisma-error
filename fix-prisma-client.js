const path = require('path');
const fs = require('fs');

console.log('Aplicando correções no cliente Prisma...');

setTimeout(() => {
    replaceCode();
    replaceCode2();

    console.log('Correções aplicadas com sucesso!');
}, 1000);


function replaceCode() {

    const orignalCode = `const regularDirname = hasDirname && fs.existsSync(path.join(__dirname, 'schema.prisma')) && __dirname`;
    const newCode =
    `const schemaFilename  = hasDirname && path.join(__dirname, 'schema.prisma')
     const regularDirname = hasDirname && fs.existsSync(schemaFilename) && path.resolve(schemaFilename, '..')`;

    const prismaClientIndexFilename = path.join(__dirname, 'node_modules', '.prisma', 'client', 'index.js');
    if (!fs.existsSync(prismaClientIndexFilename)) {
        console.log('[1] Não foi possível encontrar o ' + prismaClientIndexFilename);
        process.exit(1);
    }


    let prismaClientIndexFileContent = fs.readFileSync(prismaClientIndexFilename, 'utf8');

    if (prismaClientIndexFileContent.indexOf(orignalCode) === -1) {
        console.log('[1] Não foi possível encontrar o código a ser substituído.');
        process.exit(1);
    }

    prismaClientIndexFileContent = prismaClientIndexFileContent.replace(orignalCode, newCode);

    fs.writeFileSync(prismaClientIndexFilename, prismaClientIndexFileContent, 'utf8');
}

function replaceCode2() {

    const orignalCode = `searchLocations.push(this.config.dirname);`;
    const newCode =
    `searchLocations.push(this.config.dirname);
     searchLocations.push(import_path3.default.join(this.config.dirname, 'client'));`;

    const prismaClientIndexFilename = path.join(__dirname, 'node_modules', '@prisma', 'client', 'runtime', 'index.js');
    if (!fs.existsSync(prismaClientIndexFilename)) {
        console.log('[2] Não foi possível encontrar o ' + prismaClientIndexFilename);
        process.exit(1);
    }

    let prismaClientIndexFileContent = fs.readFileSync(prismaClientIndexFilename, 'utf8');

    if (prismaClientIndexFileContent.indexOf(orignalCode) === -1) {
        console.log('[2] Não foi possível encontrar o código a ser substituído.');
        process.exit(1);
    }

    if (prismaClientIndexFileContent.indexOf('import_path3.default') === -1) {

        console.log('[2] Não foi encontrado a importação do modulo path');
        process.exit(1);
    }

    prismaClientIndexFileContent = prismaClientIndexFileContent.replace(orignalCode, newCode);

    fs.writeFileSync(prismaClientIndexFilename, prismaClientIndexFileContent, 'utf8');
}