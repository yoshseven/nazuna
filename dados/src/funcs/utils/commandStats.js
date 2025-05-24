/**
 * Utility functions for tracking command usage statistics
 * @module commandStats
 * @author Hiudy
 */

const fs = require('fs');
const pathz = require('path');

// Path to the command stats database file
const STATS_FILE = pathz.join(__dirname, '../../../database/commandStats.json');

/**
 * Ensures the command stats file exists
 * @returns {Object} The command stats data
 */
function ensureStatsFile() {
  try {
    if (!fs.existsSync(STATS_FILE)) {
      // Create directory if it doesn't exist
      const dir = pathz.dirname(STATS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create default stats file
      const defaultStats = {
        commands: {},
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(STATS_FILE, JSON.stringify(defaultStats, null, 2));
      return defaultStats;
    }
    
    return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error ensuring stats file:', error);
    return { commands: {}, lastUpdated: new Date().toISOString() };
  }
}

/**
 * Increments the usage count for a command
 * @param {string} command - The command name
 * @param {string} userId - The user ID who executed the command
 * @returns {boolean} True if successful
 */
function trackCommandUsage(command, userId) {
  try {
    const stats = ensureStatsFile();
    
    // Initialize command entry if it doesn't exist
    if (!stats.commands[command]) {
      stats.commands[command] = {
        count: 0,
        users: {},
        lastUsed: new Date().toISOString()
      };
    }
    
    // Increment total count
    stats.commands[command].count++;
    
    // Track user usage
    if (!stats.commands[command].users[userId]) {
      stats.commands[command].users[userId] = 0;
    }
    stats.commands[command].users[userId]++;
    
    // Update timestamps
    stats.commands[command].lastUsed = new Date().toISOString();
    stats.lastUpdated = new Date().toISOString();
    
    // Save to file
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    return true;
  } catch (error) {
    console.error('Error tracking command usage:', error);
    return false;
  }
}

/**
 * Gets the most used commands
 * @param {number} [limit=10] - Maximum number of commands to return
 * @returns {Array} Array of command objects sorted by usage count
 */
function getMostUsedCommands(limit = 10) {
  try {
    const stats = ensureStatsFile();
    
    // Convert commands object to array and sort by count
    const commandsArray = Object.entries(stats.commands).map(([name, data]) => ({
      name,
      count: data.count,
      lastUsed: data.lastUsed,
      uniqueUsers: Object.keys(data.users).length
    }));
    
    // Sort by usage count (descending)
    commandsArray.sort((a, b) => b.count - a.count);
    
    // Return limited number of commands
    return commandsArray.slice(0, limit);
  } catch (error) {
    console.error('Error getting most used commands:', error);
    return [];
  }
}

/**
 * Gets usage statistics for a specific command
 * @param {string} command - The command name
 * @returns {Object|null} Command statistics or null if not found
 */
function getCommandStats(command) {
  try {
    const stats = ensureStatsFile();
    
    if (!stats.commands[command]) {
      return null;
    }
    
    const commandStats = stats.commands[command];
    
    // Get top users for this command
    const topUsers = Object.entries(commandStats.users)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      name: command,
      count: commandStats.count,
      lastUsed: commandStats.lastUsed,
      uniqueUsers: Object.keys(commandStats.users).length,
      topUsers
    };
  } catch (error) {
    console.error('Error getting command stats:', error);
    return null;
  }
}

module.exports = {
  trackCommandUsage,
  getMostUsedCommands,
  getCommandStats
}; 