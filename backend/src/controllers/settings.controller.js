const settingService = require('../services/setting.service');
const auditService = require('../services/audit.service');

exports.getSettings = async (req, res) => {
  try {
    const settings = await settingService.getAll();
    res.json(settings);
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ message: 'Setting key is required' });
    }

    await settingService.set(key, value);

    await auditService.record({
      action: 'SYSTEM_SETTING_UPDATED',
      details: { key, value: typeof value === 'object' ? 'SECRET_CONFIG' : value },
      userId: req.user.id,
      ipAddress: req.ip
    });

    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update Setting Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of { key, value }
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings array is required' });
    }

    for (const item of settings) {
      await settingService.set(item.key, item.value);
    }

    await auditService.record({
      action: 'SYSTEM_SETTINGS_BULK_UPDATED',
      details: { count: settings.length },
      userId: req.user.id,
      ipAddress: req.ip
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Bulk Update Settings Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
