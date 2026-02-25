const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const files = await prisma.file.findMany();
        console.log("FILES:\n", files);
        
        const settings = await prisma.settings.findMany();
        console.log("BRANDING CONFIG:\n", settings.find(s => s.key === 'branding_config'));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
