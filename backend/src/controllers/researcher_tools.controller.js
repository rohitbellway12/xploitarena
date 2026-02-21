const prisma = require('../utils/prisma');

/**
 * Toggle bookmark for a program
 */
exports.toggleBookmark = async (req, res) => {
  try {
    const { programId } = req.body;
    const userId = req.user.id;

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_programId: { userId, programId }
      }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });
      return res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      await prisma.bookmark.create({
        data: { userId, programId }
      });
      return res.json({ bookmarked: true, message: 'Program bookmarked' });
    }
  } catch (error) {
    console.error('Toggle Bookmark Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get bookmarked programs
 */
exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        program: true
      }
    });
    res.json(bookmarks);
  } catch (error) {
    console.error('Get Bookmarks Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Advanced Scope Checker Tool
 * Checks if a given URL or domain is within the program's defined scope.
 */
exports.checkScope = async (req, res) => {
  try {
    const { programId, asset } = req.body;

    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { scope: true }
    });

    if (!program) return res.status(404).json({ message: 'Program not found' });

    // Basic logic: check if asset string is mentioned in scope text
    // In a real app, you'd parse scope JSON or use regex
    const inScope = program.scope.toLowerCase().includes(asset.toLowerCase());

    res.json({
      asset,
      inScope,
      message: inScope ? 'Asset appears to be in scope.' : 'Asset not found in registered scope.'
    });
  } catch (error) {
    console.error('Scope Checker Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
