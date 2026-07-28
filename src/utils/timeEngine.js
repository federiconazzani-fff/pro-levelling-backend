/**
 * Time Engine for Page Targets & Performance Rings
 * Handles saving and retrieving targets and tracked time from localStorage.
 */

const TARGETS_KEY = "elite_pro_weekly_targets";
const LOGS_KEY = "elite_pro_daily_logs";

/**
 * Gets the current week's targets.
 */
export const getWeeklyTargets = () => {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(TARGETS_KEY);
  return data ? JSON.parse(data) : {};
};

/**
 * Saves the week's targets.
 * @param {Object} targets - Format: { [dayOfWeek]: { [category]: { target: Number, microAreas: [{ name, target }] } } }
 */
export const saveWeeklyTargets = (targets) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
};

/**
 * Gets the logs for a specific date (YYYY-MM-DD). If no date provided, gets today.
 */
export const getDailyLogs = (dateStr = new Date().toISOString().split('T')[0]) => {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(LOGS_KEY);
  const allLogs = data ? JSON.parse(data) : {};
  return allLogs[dateStr] || {};
};

/**
 * Helper to save a specific day's logs.
 */
const saveDailyLogs = (dateStr, dayLogs) => {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(LOGS_KEY);
  const allLogs = data ? JSON.parse(data) : {};
  allLogs[dateStr] = dayLogs;
  localStorage.setItem(LOGS_KEY, JSON.stringify(allLogs));
};

/**
 * Logs time for a category and optionally a micro-area.
 * Supports Method A (Video) and Method B (Action).
 * @param {String} category - e.g., 'tecnica', 'ssg'
 * @param {Number} minutes - Duration in minutes
 * @param {String} microArea - (Optional) The specific micro-area if applicable
 */
export const logTime = (category, minutes, microArea = null, dateStr = null) => {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const logs = getDailyLogs(targetDate);

  if (!logs[category]) {
    logs[category] = { total: 0, microAreas: {} };
  }

  // Sum total time (ensuring it doesn't go below 0)
  logs[category].total = Math.max(0, logs[category].total + minutes);

  // Sum micro-area time if specified
  if (microArea) {
    if (!logs[category].microAreas) {
      logs[category].microAreas = {};
    }
    if (!logs[category].microAreas[microArea]) {
      logs[category].microAreas[microArea] = 0;
    }
    logs[category].microAreas[microArea] = Math.max(0, logs[category].microAreas[microArea] + minutes);
  }

  saveDailyLogs(targetDate, logs);
  
  // Dispatch custom event to trigger reactivity in components
  if (typeof window !== 'undefined') {
     window.dispatchEvent(new Event('elite_time_logged'));
  }
};

/**
 * Logs Team Training completion (Method C).
 * Sets the time equal to what was targeted for today.
 */
export const logTeamTraining = (didTrain) => {
  const today = new Date();
  const dayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  const targets = getWeeklyTargets();
  const todayTarget = targets[dayOfWeek]?.team_training?.target || 0;

  if (todayTarget > 0) {
    const logs = getDailyLogs(dayStr);
    logs['team_training'] = { completed: didTrain, total: didTrain ? todayTarget : 0 };
    saveDailyLogs(dayStr, logs);
    
    if (typeof window !== 'undefined') {
       window.dispatchEvent(new Event('elite_time_logged'));
    }
  }
};

/**
 * Checks if the team training notification has been answered today.
 */
export const hasAnsweredTeamTrainingToday = () => {
  const today = new Date().toISOString().split('T')[0];
  const logs = getDailyLogs(today);
  return logs['team_training'] !== undefined;
};
