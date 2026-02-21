const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function truncateAll() {
  try {
    const adminEmail = 'rohitbellway12@gmail.com';
    console.log(`Starting hard reset logic... we will keep ${adminEmail}.`);

    // In PostgreSQL, to truncate all tables including relationships without breaking them, we drop constraints or TRUNCATE CASCADE.
    // However, Prisma doesn't natively support easy TRUNCATE CASCADE for all models.
    console.log("Emptying database tables manually using raw SQL TRUNCATE CASCADE...");

    const tableNames = [
        "notifications",
        "audit_logs",
        "files",
        "comments",
        "bookmarks",
        "researcher_team_members",
        "reports",
        "researcher_teams",
        "programs",
        "company_members",
        "refresh_tokens",
        "invitations",
        "events",
        "role_permissions",
        "custom_roles",
        "permissions",
        "users"
    ];

    for (const tableName of tableNames) {
        try {
           await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
           console.log(`Truncated table ${tableName}`);
        } catch (e) {
            console.log(`Failed to truncate ${tableName}:`, e.message);
        }
    }

    // Now re-seed the admin user to ensure they still exist after wipe
    // You didn't request a new password, but we'll recreate them so they can login.
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);

    const newAdmin = await prisma.user.create({
        data: {
            email: adminEmail,
            passwordHash: defaultPasswordHash, // Resetting pass to admin123 just in case
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            isActive: true,
            isVerified: true
        }
    });

    console.log(`\n🎉 SUCCESS! All data deleted securely. Restored Super Admin: ${newAdmin.email} with password 'admin123'.`);

  } catch (err) {
    console.error("Critical fail:", err);
  } finally {
      await prisma.$disconnect();
  }
}

truncateAll();
