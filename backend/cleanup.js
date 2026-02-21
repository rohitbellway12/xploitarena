const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'rohitbellway12@gmail.com';

  try {
    console.log(`Starting cleanup process. Preserving user: ${adminEmail}...\n`);

    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      console.error(`ERROR: The admin user with email ${adminEmail} was not found.`);
      process.exit(1);
    }
    console.log(`Admin user found with ID: ${adminUser.id}\n`);

    // The MOST reliable way to clear data with foreign key constraints in Prisma 
    // is to start from the leaves of the dependency tree and work backwards
    
    console.log("1. Deleting Notifications...");
    await prisma.notification.deleteMany();
    
    console.log("2. Deleting Audit Logs...");
    await prisma.auditLog.deleteMany();
    
    console.log("3. Deleting Files...");
    await prisma.file.deleteMany();
    
    console.log("4. Deleting Comments...");
    await prisma.comment.deleteMany();
    
    console.log("5. Deleting Bookmarks...");
    await prisma.bookmark.deleteMany();
    
    console.log("6. Deleting Researcher Team Members...");
    await prisma.researcherTeamMember.deleteMany();
    
    console.log("7. Deleting Reports...");
    await prisma.report.deleteMany();
    
    console.log("8. Deleting Researcher Teams...");
    await prisma.researcherTeam.deleteMany();
    
    console.log("9. Deleting Programs...");
    await prisma.program.deleteMany();
    
    console.log("10. Deleting Company Members...");
    await prisma.companyMember.deleteMany();
    
    console.log("11. Deleting Refresh Tokens...");
    await prisma.refreshToken.deleteMany();
    
    console.log("12. Deleting Invitations...");
    await prisma.invitation.deleteMany();
    
    console.log("13. Deleting Events...");
    await prisma.event.deleteMany();

    // FINALLY, delete all users EXCEPT the admin
    console.log("14. Deleting Non-Admin Users...");
    const deleteUsers = await prisma.user.deleteMany({
      where: {
        id: {
          not: adminUser.id
        }
      }
    });

    console.log(`\nSUCCESS! Database cleaned. Kept admin user. Removed ${deleteUsers.count} other users.`);

  } catch (error) {
    console.error('An error occurred during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
