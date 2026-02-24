const prisma = require('../utils/prisma');

class SettingService {
  async get(key, defaultValue = null) {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key } });
      return setting ? JSON.parse(setting.value) : defaultValue;
    } catch (error) {
      console.error(`Error fetching system setting ${key}:`, error);
      return defaultValue;
    }
  }

  async set(key, value) {
    try {
      const stringValue = JSON.stringify(value);
      return await prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue }
      });
    } catch (error) {
      console.error(`Error setting system setting ${key}:`, error);
      throw error;
    }
  }

  async getAll() {
    try {
      const settings = await prisma.systemSetting.findMany();
      return settings.reduce((acc, curr) => {
        acc[curr.key] = JSON.parse(curr.value);
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching all system settings:', error);
      return {};
    }
  }
}

module.exports = new SettingService();
