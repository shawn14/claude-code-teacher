import chalk from 'chalk';
import { EventEmitter } from 'events';

export class ProductivityCompanion extends EventEmitter {
  constructor() {
    super();
    this.pomodoroSettings = {
      workDuration: 25 * 60, // 25 minutes in seconds
      shortBreak: 5 * 60,    // 5 minutes
      longBreak: 15 * 60,    // 15 minutes
      sessionsUntilLong: 4
    };
    
    this.state = {
      mode: 'idle', // idle, work, short-break, long-break
      timeRemaining: 0,
      sessionsCompleted: 0,
      totalFocusTime: 0,
      dailyGoal: 4 * 25 * 60, // 4 pomodoros
      startTime: null
    };
    
    this.timer = null;
    this.focusMode = false;
    this.dailyStats = this.loadDailyStats();
  }

  loadDailyStats() {
    const today = new Date().toDateString();
    return {
      date: today,
      pomodorosCompleted: 0,
      totalFocusMinutes: 0,
      breaksTaken: 0,
      distractions: 0,
      mood: null,
      notes: []
    };
  }

  startPomodoro() {
    if (this.state.mode !== 'idle') {
      return { success: false, message: 'Timer already running!' };
    }
    
    this.state.mode = 'work';
    this.state.timeRemaining = this.pomodoroSettings.workDuration;
    this.state.startTime = Date.now();
    
    this.emit('pomodoro-started', {
      duration: this.pomodoroSettings.workDuration,
      session: this.state.sessionsCompleted + 1
    });
    
    this.startTimer();
    return { success: true, message: 'Pomodoro started! Focus time! 🍅' };
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.state.timeRemaining--;
      
      if (this.state.timeRemaining <= 0) {
        this.completeSession();
      } else {
        this.emit('tick', {
          mode: this.state.mode,
          timeRemaining: this.state.timeRemaining,
          progress: this.getProgress()
        });
      }
    }, 1000);
  }

  completeSession() {
    clearInterval(this.timer);
    this.timer = null;
    
    const sessionType = this.state.mode;
    
    if (sessionType === 'work') {
      this.state.sessionsCompleted++;
      this.state.totalFocusTime += this.pomodoroSettings.workDuration;
      this.dailyStats.pomodorosCompleted++;
      this.dailyStats.totalFocusMinutes += this.pomodoroSettings.workDuration / 60;
      
      this.emit('pomodoro-completed', {
        session: this.state.sessionsCompleted,
        totalToday: this.dailyStats.pomodorosCompleted
      });
      
      // Determine next break type
      if (this.state.sessionsCompleted % this.pomodoroSettings.sessionsUntilLong === 0) {
        this.suggestLongBreak();
      } else {
        this.suggestShortBreak();
      }
    } else {
      this.dailyStats.breaksTaken++;
      this.emit('break-completed', { type: sessionType });
      this.suggestNextPomodoro();
    }
    
    this.state.mode = 'idle';
  }

  suggestShortBreak() {
    this.emit('suggestion', {
      type: 'short-break',
      message: '🎉 Great work! Time for a 5-minute break. Stretch, breathe, or grab water!',
      duration: this.pomodoroSettings.shortBreak
    });
  }

  suggestLongBreak() {
    this.emit('suggestion', {
      type: 'long-break',
      message: '🌟 Excellent! You\'ve completed 4 pomodoros. Take a 15-minute break!',
      duration: this.pomodoroSettings.longBreak
    });
  }

  suggestNextPomodoro() {
    this.emit('suggestion', {
      type: 'next-pomodoro',
      message: '💪 Break\'s over! Ready for another productive session?',
      duration: this.pomodoroSettings.workDuration
    });
  }

  pause() {
    if (this.timer && this.state.mode !== 'idle') {
      clearInterval(this.timer);
      this.timer = null;
      this.emit('paused', { mode: this.state.mode, timeRemaining: this.state.timeRemaining });
      return { success: true, message: 'Timer paused' };
    }
    return { success: false, message: 'No active timer to pause' };
  }

  resume() {
    if (!this.timer && this.state.mode !== 'idle' && this.state.timeRemaining > 0) {
      this.startTimer();
      this.emit('resumed', { mode: this.state.mode, timeRemaining: this.state.timeRemaining });
      return { success: true, message: 'Timer resumed' };
    }
    return { success: false, message: 'No paused timer to resume' };
  }

  skip() {
    if (this.state.mode !== 'idle') {
      clearInterval(this.timer);
      this.timer = null;
      const skippedMode = this.state.mode;
      this.state.mode = 'idle';
      this.emit('skipped', { mode: skippedMode });
      return { success: true, message: `${skippedMode} skipped` };
    }
    return { success: false, message: 'No active session to skip' };
  }

  getProgress() {
    if (this.state.mode === 'idle') return 0;
    
    const totalDuration = this.state.mode === 'work' 
      ? this.pomodoroSettings.workDuration
      : this.state.mode === 'short-break' 
        ? this.pomodoroSettings.shortBreak
        : this.pomodoroSettings.longBreak;
    
    return ((totalDuration - this.state.timeRemaining) / totalDuration) * 100;
  }

  getTimeDisplay() {
    const minutes = Math.floor(this.state.timeRemaining / 60);
    const seconds = this.state.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getStatusDisplay() {
    if (this.state.mode === 'idle') {
      return chalk.gray('🍅 Pomodoro Timer - Ready to start');
    }
    
    const time = this.getTimeDisplay();
    const progress = Math.floor(this.getProgress());
    const progressBar = this.createProgressBar(progress);
    
    const modeColors = {
      'work': chalk.red,
      'short-break': chalk.green,
      'long-break': chalk.blue
    };
    
    const modeEmojis = {
      'work': '🍅',
      'short-break': '☕',
      'long-break': '🌴'
    };
    
    const color = modeColors[this.state.mode];
    const emoji = modeEmojis[this.state.mode];
    
    return color(`${emoji} ${time} ${progressBar} ${progress}%`);
  }

  createProgressBar(percentage) {
    const width = 20;
    const filled = Math.floor(width * percentage / 100);
    const empty = width - filled;
    return `[${chalk.green('█'.repeat(filled))}${chalk.gray('░'.repeat(empty))}]`;
  }

  getDailyStats() {
    const focusHours = Math.floor(this.dailyStats.totalFocusMinutes / 60);
    const focusMinutes = this.dailyStats.totalFocusMinutes % 60;
    
    return {
      summary: `📊 Today: ${this.dailyStats.pomodorosCompleted} 🍅 completed | ${focusHours}h ${focusMinutes}m focused`,
      details: this.dailyStats,
      progress: (this.dailyStats.totalFocusMinutes * 60 / this.state.dailyGoal) * 100
    };
  }

  enterFocusMode() {
    this.focusMode = true;
    this.emit('focus-mode-entered');
    return {
      success: true,
      message: '🎯 Focus Mode activated! Notifications minimized, distractions blocked.',
      tips: [
        'Close unnecessary tabs',
        'Put phone on silent',
        'Clear your desk',
        'Take a deep breath'
      ]
    };
  }

  exitFocusMode() {
    this.focusMode = false;
    this.emit('focus-mode-exited');
    return {
      success: true,
      message: '✅ Focus Mode deactivated. Great session!'
    };
  }

  recordMood(mood) {
    const moods = ['😫', '😕', '😐', '🙂', '😊'];
    if (mood >= 1 && mood <= 5) {
      this.dailyStats.mood = moods[mood - 1];
      return { success: true, message: `Mood recorded: ${moods[mood - 1]}` };
    }
    return { success: false, message: 'Please rate mood from 1-5' };
  }

  addNote(note) {
    this.dailyStats.notes.push({
      time: new Date().toLocaleTimeString(),
      text: note
    });
    return { success: true, message: 'Note added to daily log' };
  }

  recordDistraction() {
    this.dailyStats.distractions++;
    this.emit('distraction-recorded', { total: this.dailyStats.distractions });
    return { 
      success: true, 
      message: `Distraction noted. Total today: ${this.dailyStats.distractions}. Stay strong! 💪` 
    };
  }
}

// Focus Mode Tips
export const focusTips = [
  "🎯 Single-tasking beats multi-tasking every time",
  "🧠 Your brain needs 23 minutes to fully refocus after a distraction",
  "💧 Dehydration reduces cognitive performance by up to 20%",
  "🌱 Plants in your workspace can increase productivity by 15%",
  "🎵 Instrumental music can boost focus, lyrics can distract",
  "📱 Put your phone in another room - out of sight, out of mind",
  "🪟 Natural light improves mood and energy levels",
  "🧘 A 1-minute breathing exercise can reset your focus",
  "📝 Writing down distracting thoughts helps clear your mind",
  "⏰ Work with your natural energy rhythms - are you a morning or night person?"
];

// Daily Standup Helper
export class DailyStandup {
  constructor() {
    this.questions = [
      "What did you accomplish yesterday?",
      "What are you working on today?",
      "Any blockers or challenges?"
    ];
    this.responses = {};
  }

  async conduct() {
    console.clear();
    console.log(chalk.bold.cyan('📋 Daily Standup'));
    console.log(chalk.gray(new Date().toLocaleDateString()));
    console.log(chalk.gray('─'.repeat(40)));
    
    // This would be integrated with readline for actual input
    return {
      date: new Date().toLocaleDateString(),
      responses: this.responses,
      mood: null,
      focusGoal: 4 // pomodoros
    };
  }

  generateSummary(responses) {
    return `
${chalk.bold('📅 Daily Standup Summary')}
${chalk.gray('─'.repeat(40))}

${chalk.yellow('Yesterday:')}
${responses.yesterday || 'No response'}

${chalk.green('Today:')}
${responses.today || 'No response'}

${chalk.red('Blockers:')}
${responses.blockers || 'None reported'}

${chalk.gray('─'.repeat(40))}
${chalk.cyan('Have a productive day! 🚀')}
    `;
  }
}