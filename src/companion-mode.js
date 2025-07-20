import chalk from 'chalk';
import readline from 'readline';
import { EventEmitter } from 'events';
import { EntertainmentMode } from './entertainment-mode.js';
import { ProductivityCompanion, DailyStandup, focusTips } from './productivity-companion.js';
import { WellnessCompanion, ergonomicTips } from './wellness-companion.js';
import { RubberDuckMode, debuggingWisdom } from './rubber-duck-mode.js';

export class CompanionMode extends EventEmitter {
  constructor(projectPath) {
    super();
    this.projectPath = projectPath;
    
    // Initialize all companion features
    this.entertainment = new EntertainmentMode();
    this.productivity = new ProductivityCompanion();
    this.wellness = new WellnessCompanion();
    this.rubberDuck = new RubberDuckMode();
    this.dailyStandup = new DailyStandup();
    
    // User preferences and state
    this.userProfile = {
      name: 'Developer',
      preferredDuck: 'classic',
      focusGoal: 4, // pomodoros per day
      wellnessEnabled: true,
      theme: 'default',
      personality: 'friendly',
      xp: 0,
      level: 1,
      achievements: [],
      dailyStreak: 0
    };
    
    // Daily stats
    this.dailyStats = {
      date: new Date().toDateString(),
      pomodorosCompleted: 0,
      xpEarned: 0,
      achievementsUnlocked: [],
      moodCheckins: 0,
      wellnessScore: 100
    };
    
    // Set up readline interface
    this.rl = null;
    this.currentMode = 'menu';
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Productivity events
    this.productivity.on('pomodoro-completed', (data) => {
      this.handlePomodoroComplete(data);
    });
    
    this.productivity.on('tick', (data) => {
      if (data.mode === 'work' && data.timeRemaining % 300 === 0) { // Every 5 minutes
        this.showEncouragement();
      }
    });
    
    // Wellness events
    this.wellness.on('reminder', (data) => {
      this.showWellnessReminder(data);
    });
    
    this.wellness.on('wellness-alert', (data) => {
      this.showUrgentWellnessAlert(data);
    });
    
    // Duck events
    this.rubberDuck.on('session-ended', (data) => {
      if (data.breakthroughCount > 0) {
        this.awardXP(50, 'Rubber Duck Breakthrough!');
      }
    });
  }

  async start() {
    this.clearScreen();
    this.showWelcomeScreen();
    
    // Start background services
    if (this.userProfile.wellnessEnabled) {
      this.wellness.startWellnessReminders();
    }
    
    // Set up interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt()
    });
    
    // Show main menu
    await this.showMainMenu();
  }

  showWelcomeScreen() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    
    console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════╗
║      🎓 Claude Code Teacher - Companion Mode       ║
║         Your AI Coding Companion & Friend          ║
╚═══════════════════════════════════════════════════╝
    `));
    
    console.log(chalk.yellow(`${greeting}, ${this.userProfile.name}! 👋`));
    console.log(chalk.gray(`Level ${this.userProfile.level} • ${this.userProfile.xp} XP • ${this.userProfile.dailyStreak} day streak\n`));
    
    // Show daily tip
    this.showDailyTip();
  }

  showDailyTip() {
    const tips = [
      "💡 Did you know? Taking regular breaks increases productivity by 40%!",
      "🧠 Your brain can only focus for 90-120 minutes at a time.",
      "💧 Staying hydrated improves cognitive function by 14%.",
      "🌱 Indoor plants can increase productivity by up to 15%.",
      "😴 Developers who sleep 7-8 hours write 20% fewer bugs.",
      "🎵 Listening to instrumental music can boost focus.",
      "☕ Coffee is most effective 30-45 minutes after consumption.",
      "🚶 A 5-minute walk every hour reduces fatigue significantly.",
      "🧘 Just 10 minutes of meditation improves focus for hours.",
      "📝 Writing down tasks frees up mental RAM."
    ];
    
    const tip = tips[new Date().getDate() % tips.length];
    console.log(chalk.cyan(`\n📌 Daily Tip: ${tip}\n`));
  }

  async showMainMenu() {
    const choices = [
      { name: '🍅 Pomodoro Timer', value: 'pomodoro' },
      { name: '🎮 Entertainment', value: 'entertainment' },
      { name: '🦆 Rubber Duck Debugging', value: 'duck' },
      { name: '💪 Wellness Check', value: 'wellness' },
      { name: '📊 Daily Standup', value: 'standup' },
      { name: '🎯 Focus Mode', value: 'focus' },
      { name: '📈 View Stats', value: 'stats' },
      { name: '⚙️  Settings', value: 'settings' },
      { name: '🚪 Exit', value: 'exit' }
    ];
    
    console.log(chalk.bold.yellow('\n🎯 What would you like to do?\n'));
    
    choices.forEach((choice, index) => {
      console.log(chalk.white(`${index + 1}. ${choice.name}`));
    });
    
    this.rl.question(chalk.cyan('\nChoice (1-9): '), async (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < choices.length) {
        await this.handleMenuChoice(choices[index].value);
      } else {
        console.log(chalk.red('Invalid choice. Please try again.'));
        await this.showMainMenu();
      }
    });
  }

  async handleMenuChoice(choice) {
    switch (choice) {
      case 'pomodoro':
        await this.startPomodoroSession();
        break;
      case 'entertainment':
        await this.showEntertainmentMenu();
        break;
      case 'duck':
        await this.startRubberDuckSession();
        break;
      case 'wellness':
        await this.showWellnessMenu();
        break;
      case 'standup':
        await this.conductDailyStandup();
        break;
      case 'focus':
        await this.enterFocusMode();
        break;
      case 'stats':
        await this.showStats();
        break;
      case 'settings':
        await this.showSettings();
        break;
      case 'exit':
        this.exit();
        break;
    }
  }

  async startPomodoroSession() {
    console.clear();
    console.log(chalk.bold.red('🍅 Pomodoro Timer'));
    console.log(chalk.gray('25 minutes of focused work\n'));
    
    const result = this.productivity.startPomodoro();
    console.log(result.message);
    
    // Show timer updates
    const timerInterval = setInterval(() => {
      process.stdout.write('\r' + this.productivity.getStatusDisplay());
      
      if (this.productivity.state.mode === 'idle') {
        clearInterval(timerInterval);
        console.log('\n');
        this.rl.question(chalk.yellow('\nPress Enter to continue...'), () => {
          this.showMainMenu();
        });
      }
    }, 1000);
  }

  async showEntertainmentMenu() {
    console.clear();
    const menu = this.entertainment.getMenu();
    
    console.log(chalk.bold.yellow(menu.title + '\n'));
    
    menu.options.forEach((option, index) => {
      console.log(`${index + 1}. ${option.name}`);
    });
    
    this.rl.question(chalk.cyan('\nChoice: '), async (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < menu.options.length) {
        const choice = menu.options[index].value;
        
        if (choice === 'back') {
          await this.showMainMenu();
          return;
        }
        
        await this.handleEntertainmentChoice(choice);
      }
    });
  }

  async handleEntertainmentChoice(choice) {
    switch (choice) {
      case 'trivia':
        await this.entertainment.startTrivia();
        this.awardXP(10, 'Trivia participation!');
        break;
      case 'joke':
        this.entertainment.tellJoke();
        break;
      case 'quote':
        await this.entertainment.showDailyQuote();
        break;
      case 'golf':
        await this.entertainment.startCodeGolf();
        this.awardXP(15, 'Code Golf challenge!');
        break;
      case 'fact':
        await this.entertainment.showFunFact();
        break;
      case 'animation':
        await this.entertainment.playAnimation('coffee');
        break;
    }
    
    setTimeout(() => {
      this.rl.question(chalk.gray('\nPress Enter to continue...'), () => {
        this.showEntertainmentMenu();
      });
    }, 2000);
  }

  async startRubberDuckSession() {
    console.clear();
    console.log(chalk.bold.yellow('🦆 Rubber Duck Debugging\n'));
    
    // Select duck personality
    console.log('Choose your duck:\n');
    const ducks = ['classic', 'detective', 'zen', 'pirate', 'scientist'];
    ducks.forEach((duck, index) => {
      console.log(`${index + 1}. ${duck.charAt(0).toUpperCase() + duck.slice(1)} Duck`);
    });
    
    this.rl.question(chalk.cyan('\nChoice (1-5): '), async (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < ducks.length) {
        this.rubberDuck.selectDuck(ducks[index]);
        const session = this.rubberDuck.startSession();
        
        console.clear();
        console.log(session.ascii);
        console.log('\n' + chalk.yellow(session.greeting));
        console.log(chalk.gray('\nTips:'));
        session.tips.forEach(tip => console.log(chalk.gray(tip)));
        
        await this.conductDuckSession();
      }
    });
  }

  async conductDuckSession() {
    console.log(chalk.gray('\nType "done" when finished, "quit" to exit\n'));
    
    const askForInput = () => {
      this.rl.question(chalk.cyan('You: '), (input) => {
        if (input.toLowerCase() === 'done') {
          const summary = this.rubberDuck.endSession();
          console.log(chalk.green('\n' + summary.farewell));
          console.log(chalk.yellow('\nSession Summary:'));
          console.log(summary.summary);
          
          setTimeout(() => {
            this.rl.question(chalk.gray('\nPress Enter to continue...'), () => {
              this.showMainMenu();
            });
          }, 1000);
        } else if (input.toLowerCase() === 'quit') {
          this.showMainMenu();
        } else {
          const response = this.rubberDuck.processThought(input);
          console.log(chalk.yellow(`\n${this.rubberDuck.currentDuck.emoji}: ${response.response}\n`));
          
          if (response.type === 'breakthrough') {
            console.log(chalk.green(response.celebration + '\n'));
          }
          
          askForInput();
        }
      });
    };
    
    askForInput();
  }

  async showWellnessMenu() {
    console.clear();
    console.log(chalk.bold.green('💚 Wellness Center\n'));
    
    const report = this.wellness.getDailyReport();
    console.log(chalk.yellow(`Wellness Score: ${report.scoreEmoji} ${report.score}/100\n`));
    
    const options = [
      { name: '💧 Log Water Intake', value: 'water' },
      { name: '🤸 Do an Exercise', value: 'exercise' },
      { name: '😊 Mood Check-in', value: 'mood' },
      { name: '📊 View Wellness Stats', value: 'stats' },
      { name: '💡 Ergonomic Tips', value: 'ergonomics' },
      { name: '↩️  Back', value: 'back' }
    ];
    
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option.name}`);
    });
    
    this.rl.question(chalk.cyan('\nChoice: '), async (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < options.length) {
        await this.handleWellnessChoice(options[index].value);
      }
    });
  }

  async handleWellnessChoice(choice) {
    switch (choice) {
      case 'water':
        const waterResult = this.wellness.logWaterIntake();
        console.log(chalk.blue('\n' + waterResult.message));
        this.awardXP(5, 'Staying hydrated!');
        break;
        
      case 'exercise':
        const exercise = this.wellness.getExercise();
        console.clear();
        console.log(chalk.bold.green(`🤸 ${exercise.name}\n`));
        console.log(chalk.yellow('Instructions:'));
        exercise.instructions.forEach((step, i) => {
          console.log(`${i + 1}. ${step}`);
        });
        console.log(chalk.gray(`\nBenefits: ${exercise.benefits}`));
        console.log(chalk.cyan(`\nDuration: ${exercise.duration} seconds`));
        
        this.rl.question(chalk.green('\nPress Enter when complete...'), () => {
          this.wellness.completeExercise(exercise.name);
          this.awardXP(10, 'Exercise completed!');
          this.showWellnessMenu();
        });
        return;
        
      case 'mood':
        console.log(chalk.yellow('\nHow are you feeling?'));
        const moods = ['stressed', 'tired', 'focused', 'happy', 'frustrated'];
        moods.forEach((mood, i) => {
          console.log(`${i + 1}. ${mood}`);
        });
        
        this.rl.question(chalk.cyan('\nChoice: '), (answer) => {
          const index = parseInt(answer) - 1;
          if (index >= 0 && index < moods.length) {
            const result = this.wellness.checkMood(moods[index]);
            console.log(chalk.green(`\n${result.message}`));
            console.log(chalk.yellow(`\nAdvice: ${result.advice}`));
          }
          setTimeout(() => this.showWellnessMenu(), 2000);
        });
        return;
        
      case 'stats':
        const stats = this.wellness.getDailyReport();
        console.clear();
        console.log(chalk.bold.green('📊 Wellness Statistics\n'));
        console.log(stats.summary);
        console.log(chalk.gray('\nRecommendations:'));
        stats.recommendations.forEach(rec => {
          console.log(chalk.yellow(`• ${rec}`));
        });
        break;
        
      case 'ergonomics':
        console.clear();
        console.log(chalk.bold.green('💡 Ergonomic Tips\n'));
        ergonomicTips.forEach(tip => {
          console.log(chalk.cyan(tip));
        });
        break;
        
      case 'back':
        await this.showMainMenu();
        return;
    }
    
    setTimeout(() => {
      this.rl.question(chalk.gray('\nPress Enter to continue...'), () => {
        this.showWellnessMenu();
      });
    }, 2000);
  }

  async conductDailyStandup() {
    console.clear();
    const standup = await this.dailyStandup.conduct();
    
    // This would be interactive with actual input
    console.log(this.dailyStandup.generateSummary({
      yesterday: "Completed user authentication module",
      today: "Working on dashboard components",
      blockers: "None"
    }));
    
    this.awardXP(20, 'Daily standup completed!');
    
    setTimeout(() => {
      this.rl.question(chalk.gray('\nPress Enter to continue...'), () => {
        this.showMainMenu();
      });
    }, 2000);
  }

  async enterFocusMode() {
    const result = this.productivity.enterFocusMode();
    console.clear();
    console.log(chalk.bold.cyan('🎯 ' + result.message + '\n'));
    
    console.log(chalk.yellow('Tips for focus:'));
    result.tips.forEach(tip => console.log(chalk.gray(`• ${tip}`)));
    
    console.log(chalk.cyan('\n\nFocus tip of the day:'));
    console.log(chalk.italic(focusTips[Math.floor(Math.random() * focusTips.length)]));
    
    setTimeout(() => {
      this.rl.question(chalk.gray('\nPress Enter to continue...'), () => {
        this.showMainMenu();
      });
    }, 3000);
  }

  async showStats() {
    console.clear();
    console.log(chalk.bold.yellow('📈 Your Statistics\n'));
    
    console.log(chalk.cyan('Profile:'));
    console.log(`  Level: ${this.userProfile.level}`);
    console.log(`  XP: ${this.userProfile.xp}/${this.getXPRequired()}`);
    console.log(`  Daily Streak: ${this.userProfile.dailyStreak} days`);
    console.log(`  Achievements: ${this.userProfile.achievements.length}`);
    
    console.log(chalk.cyan('\nToday:'));
    console.log(`  Pomodoros: ${this.dailyStats.pomodorosCompleted}`);
    console.log(`  XP Earned: ${this.dailyStats.xpEarned}`);
    console.log(`  Wellness Score: ${this.wellness.wellnessScore}/100`);
    
    const productivityStats = this.productivity.getDailyStats();
    console.log(chalk.cyan('\nProductivity:'));
    console.log(`  ${productivityStats.summary}`);
    
    setTimeout(() => {
      this.rl.question(chalk.gray('\nPress Enter to continue...'), () => {
        this.showMainMenu();
      });
    }, 2000);
  }

  async showSettings() {
    console.clear();
    console.log(chalk.bold.yellow('⚙️ Settings\n'));
    
    console.log('Coming soon: Personality settings, themes, and more!');
    
    setTimeout(() => {
      this.rl.question(chalk.gray('\nPress Enter to continue...'), () => {
        this.showMainMenu();
      });
    }, 2000);
  }

  handlePomodoroComplete(data) {
    this.dailyStats.pomodorosCompleted++;
    this.awardXP(25, '🍅 Pomodoro completed!');
    
    // Check for achievements
    if (this.dailyStats.pomodorosCompleted === 4) {
      this.unlockAchievement('daily-goal', '🎯 Daily Goal', 'Complete 4 pomodoros in a day');
    }
  }

  showEncouragement() {
    const messages = [
      "Keep going! You're doing great! 💪",
      "Focus mode: ON! You've got this! 🎯",
      "Deep work happening here! 🧠",
      "In the zone! Keep it up! 🚀",
      "Productivity level: MAXIMUM! ⚡"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    console.log(chalk.green(`\n💬 ${message}\n`));
  }

  showWellnessReminder(data) {
    console.log(chalk.yellow(`\n🔔 Wellness Reminder: ${data.message}\n`));
    
    if (data.priority === 'high') {
      console.log(chalk.red('⚠️ This is important for your health!\n'));
    }
  }

  showUrgentWellnessAlert(data) {
    console.log(chalk.bold.red(`\n🚨 ${data.message}\n`));
  }

  awardXP(amount, reason) {
    this.userProfile.xp += amount;
    this.dailyStats.xpEarned += amount;
    
    console.log(chalk.green(`\n✨ +${amount} XP: ${reason}\n`));
    
    // Check for level up
    if (this.userProfile.xp >= this.getXPRequired()) {
      this.levelUp();
    }
  }

  getXPRequired() {
    return this.userProfile.level * 100;
  }

  levelUp() {
    this.userProfile.level++;
    this.userProfile.xp = this.userProfile.xp - this.getXPRequired();
    
    console.log(chalk.bold.yellow(`
🎉 LEVEL UP! 🎉
You reached Level ${this.userProfile.level}!
    `));
    
    this.unlockAchievement('level-up', '⬆️ Level Up!', `Reached level ${this.userProfile.level}`);
  }

  unlockAchievement(id, name, description) {
    if (!this.userProfile.achievements.find(a => a.id === id)) {
      this.userProfile.achievements.push({ id, name, description, date: new Date() });
      this.dailyStats.achievementsUnlocked.push(name);
      
      console.log(chalk.bold.magenta(`
🏆 Achievement Unlocked!
${name}
${description}
      `));
    }
  }

  getPrompt() {
    return chalk.cyan('🎓 > ');
  }

  clearScreen() {
    console.clear();
  }

  exit() {
    console.log(chalk.yellow('\n👋 Thanks for spending time with Claude Code Teacher!'));
    console.log(chalk.gray('See you next time! Keep coding and stay healthy!\n'));
    
    if (this.wellness.timers) {
      this.wellness.stopWellnessReminders();
    }
    
    process.exit(0);
  }
}

export async function startCompanionMode(projectPath) {
  const companion = new CompanionMode(projectPath);
  await companion.start();
  return companion;
}