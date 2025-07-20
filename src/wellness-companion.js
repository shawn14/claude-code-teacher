import chalk from 'chalk';
import { EventEmitter } from 'events';

export class WellnessCompanion extends EventEmitter {
  constructor() {
    super();
    
    this.reminders = {
      hydration: {
        interval: 30 * 60 * 1000, // 30 minutes
        lastReminder: Date.now(),
        messages: [
          "💧 Time for a water break! Staying hydrated boosts brain function.",
          "🚰 Hydration check! A glass of water will help you focus better.",
          "💦 Your brain is 75% water - keep it happy with a drink!",
          "🥤 Dehydration can cause fatigue. Grab some water!",
          "💧 Pro tip: Keep a water bottle at your desk for easy hydration."
        ]
      },
      
      eyeCare: {
        interval: 20 * 60 * 1000, // 20 minutes
        lastReminder: Date.now(),
        messages: [
          "👀 20-20-20 rule: Look at something 20 feet away for 20 seconds!",
          "👁️ Give your eyes a break - look out the window for a moment.",
          "🌟 Blink! Staring at screens reduces blinking by 60%.",
          "😌 Close your eyes for 30 seconds - let them rest.",
          "🖥️ Check your screen brightness - too bright or too dim?"
        ]
      },
      
      posture: {
        interval: 45 * 60 * 1000, // 45 minutes
        lastReminder: Date.now(),
        messages: [
          "🪑 Posture check! Sit up straight, shoulders back.",
          "🦴 Align your spine - your future self will thank you!",
          "📐 Feet flat on floor, screen at eye level - perfect posture!",
          "🧘 Roll your shoulders back 3 times to release tension.",
          "💺 Is your chair at the right height? Elbows should be at 90°."
        ]
      },
      
      stretch: {
        interval: 60 * 60 * 1000, // 1 hour
        lastReminder: Date.now(),
        messages: [
          "🤸 Time to stretch! Stand up and reach for the sky.",
          "🦵 Get up and walk around for 2 minutes - boost circulation!",
          "🙆 Neck rolls: Gently roll your head in circles.",
          "✋ Wrist stretches prevent carpal tunnel - flex and extend!",
          "🚶 Take a quick walk - movement sparks creativity!"
        ]
      },
      
      mentalHealth: {
        interval: 2 * 60 * 60 * 1000, // 2 hours
        lastReminder: Date.now(),
        messages: [
          "🧠 Mental health check: How are you feeling?",
          "😊 Take 3 deep breaths. In... and out...",
          "🌈 Remember: It's okay to take breaks when you need them.",
          "💚 You're doing great! Programming is challenging - be kind to yourself.",
          "🎯 Stuck on a problem? Sometimes a break brings the solution!"
        ]
      }
    };
    
    this.exercises = this.loadExercises();
    this.timers = {};
    this.wellnessScore = 100;
    this.dailyStats = {
      waterIntake: 0,
      stretches: 0,
      breaks: 0,
      exercises: 0,
      mood: []
    };
  }

  loadExercises() {
    return {
      desk: [
        {
          name: "Neck Rolls",
          duration: 30,
          instructions: [
            "Sit up straight",
            "Slowly roll your head clockwise 5 times",
            "Roll counter-clockwise 5 times",
            "Keep movements gentle and smooth"
          ],
          benefits: "Relieves neck tension from looking at screens"
        },
        {
          name: "Shoulder Shrugs",
          duration: 20,
          instructions: [
            "Lift shoulders up towards ears",
            "Hold for 3 seconds",
            "Release and roll backwards",
            "Repeat 10 times"
          ],
          benefits: "Releases shoulder and upper back tension"
        },
        {
          name: "Wrist Stretches",
          duration: 40,
          instructions: [
            "Extend arm forward, palm up",
            "With other hand, gently pull fingers back",
            "Hold for 15 seconds each hand",
            "Then make fists and rotate wrists"
          ],
          benefits: "Prevents carpal tunnel and RSI"
        },
        {
          name: "Seated Spinal Twist",
          duration: 30,
          instructions: [
            "Sit sideways in chair",
            "Hold back of chair with both hands",
            "Gently twist torso towards chair back",
            "Hold 15 seconds each side"
          ],
          benefits: "Improves spine flexibility and reduces back pain"
        },
        {
          name: "Eye Exercises",
          duration: 60,
          instructions: [
            "Look up and down 10 times",
            "Look left and right 10 times",
            "Focus on finger, move it closer/farther",
            "Look at distant object for 20 seconds"
          ],
          benefits: "Reduces eye strain and improves focus"
        }
      ],
      
      standing: [
        {
          name: "Standing Desk Pushups",
          duration: 30,
          instructions: [
            "Place hands on desk edge",
            "Step back to 45° angle",
            "Do 10-15 desk pushups",
            "Keep core engaged"
          ],
          benefits: "Strengthens arms and improves circulation"
        },
        {
          name: "Calf Raises",
          duration: 30,
          instructions: [
            "Stand behind chair for balance",
            "Rise up on toes",
            "Hold for 2 seconds",
            "Lower slowly, repeat 15 times"
          ],
          benefits: "Improves circulation in legs"
        },
        {
          name: "Hip Circles",
          duration: 30,
          instructions: [
            "Hands on hips",
            "Circle hips clockwise 10 times",
            "Circle counter-clockwise 10 times",
            "Keep upper body still"
          ],
          benefits: "Loosens hip flexors tight from sitting"
        },
        {
          name: "Quad Stretch",
          duration: 40,
          instructions: [
            "Hold desk for balance",
            "Bend knee, grab ankle behind you",
            "Pull heel towards glutes",
            "Hold 20 seconds each leg"
          ],
          benefits: "Stretches front of thighs"
        },
        {
          name: "Side Bends",
          duration: 30,
          instructions: [
            "Stand with feet hip-width apart",
            "Reach one arm overhead",
            "Lean to opposite side",
            "Hold 10 seconds, switch sides"
          ],
          benefits: "Stretches obliques and improves flexibility"
        }
      ],
      
      breathing: [
        {
          name: "4-7-8 Breathing",
          duration: 60,
          instructions: [
            "Breathe in for 4 counts",
            "Hold for 7 counts",
            "Exhale for 8 counts",
            "Repeat 3-4 times"
          ],
          benefits: "Reduces stress and anxiety quickly"
        },
        {
          name: "Box Breathing",
          duration: 60,
          instructions: [
            "Inhale for 4 counts",
            "Hold for 4 counts",
            "Exhale for 4 counts",
            "Hold empty for 4 counts"
          ],
          benefits: "Improves focus and calms the mind"
        },
        {
          name: "Belly Breathing",
          duration: 90,
          instructions: [
            "Place hand on belly",
            "Breathe deeply into belly",
            "Feel hand rise with inhale",
            "Slow exhale, repeat 10 times"
          ],
          benefits: "Activates relaxation response"
        }
      ]
    };
  }

  startWellnessReminders() {
    Object.entries(this.reminders).forEach(([type, config]) => {
      this.timers[type] = setInterval(() => {
        this.sendReminder(type);
      }, config.interval);
    });
    
    this.emit('wellness-started');
    return { success: true, message: '🌟 Wellness reminders activated! I\'ll help you stay healthy.' };
  }

  stopWellnessReminders() {
    Object.keys(this.timers).forEach(type => {
      clearInterval(this.timers[type]);
    });
    this.timers = {};
    
    this.emit('wellness-stopped');
    return { success: true, message: 'Wellness reminders paused.' };
  }

  sendReminder(type) {
    const reminder = this.reminders[type];
    const message = reminder.messages[Math.floor(Math.random() * reminder.messages.length)];
    
    reminder.lastReminder = Date.now();
    
    this.emit('reminder', {
      type,
      message,
      priority: this.getPriority(type),
      actions: this.getSuggestedActions(type)
    });
  }

  getPriority(type) {
    const timeSinceLast = Date.now() - this.reminders[type].lastReminder;
    const overdue = timeSinceLast / this.reminders[type].interval;
    
    if (overdue > 2) return 'high';
    if (overdue > 1.5) return 'medium';
    return 'low';
  }

  getSuggestedActions(type) {
    const actions = {
      hydration: ['drink-water', 'log-intake'],
      eyeCare: ['look-away', 'eye-exercise'],
      posture: ['adjust-position', 'stand-up'],
      stretch: ['quick-stretch', 'full-routine'],
      mentalHealth: ['deep-breath', 'take-break', 'mood-check']
    };
    
    return actions[type] || [];
  }

  logWaterIntake(amount = 250) {
    this.dailyStats.waterIntake += amount;
    this.updateWellnessScore(5);
    
    const totalLiters = (this.dailyStats.waterIntake / 1000).toFixed(1);
    const goal = 2; // 2 liters per day
    const percentage = Math.min(100, (this.dailyStats.waterIntake / (goal * 1000)) * 100);
    
    return {
      success: true,
      message: `💧 Great! You've had ${totalLiters}L today (${percentage.toFixed(0)}% of daily goal)`,
      stats: {
        total: this.dailyStats.waterIntake,
        percentage,
        remaining: Math.max(0, goal * 1000 - this.dailyStats.waterIntake)
      }
    };
  }

  getExercise(category = 'desk') {
    const exercises = this.exercises[category] || this.exercises.desk;
    return exercises[Math.floor(Math.random() * exercises.length)];
  }

  completeExercise(exerciseName) {
    this.dailyStats.exercises++;
    this.updateWellnessScore(10);
    
    return {
      success: true,
      message: `✅ Great job! ${exerciseName} completed.`,
      stats: {
        exercisesToday: this.dailyStats.exercises,
        wellnessScore: this.wellnessScore
      }
    };
  }

  checkMood(mood) {
    const moodEmojis = {
      stressed: '😰',
      tired: '😴',
      focused: '🎯',
      happy: '😊',
      frustrated: '😤'
    };
    
    this.dailyStats.mood.push({
      time: new Date().toLocaleTimeString(),
      mood,
      emoji: moodEmojis[mood] || '😐'
    });
    
    // Provide mood-specific advice
    const advice = this.getMoodAdvice(mood);
    
    return {
      success: true,
      message: `Mood logged: ${moodEmojis[mood]} ${mood}`,
      advice
    };
  }

  getMoodAdvice(mood) {
    const advice = {
      stressed: [
        "Try the 4-7-8 breathing exercise",
        "Take a 5-minute walk",
        "Break your task into smaller pieces",
        "Remember: This too shall pass"
      ],
      tired: [
        "Consider a 20-minute power nap",
        "Do some light stretches to boost energy",
        "Check if you're dehydrated",
        "Maybe it's time to call it a day?"
      ],
      focused: [
        "Great! Ride this wave of productivity",
        "Remember to still take breaks",
        "Document your progress",
        "Keep up the good work!"
      ],
      happy: [
        "Wonderful! Coding is more fun when happy",
        "Share your joy with a teammate",
        "This is a great time for creative work",
        "Your positive energy is contagious!"
      ],
      frustrated: [
        "Take a step back and breathe",
        "Try explaining the problem out loud",
        "A fresh perspective after a break helps",
        "Every developer faces this - you're not alone"
      ]
    };
    
    const moodAdvice = advice[mood] || ["Take care of yourself!"];
    return moodAdvice[Math.floor(Math.random() * moodAdvice.length)];
  }

  updateWellnessScore(points) {
    this.wellnessScore = Math.min(100, Math.max(0, this.wellnessScore + points));
    
    if (this.wellnessScore < 30) {
      this.emit('wellness-alert', {
        level: 'critical',
        message: '⚠️ Your wellness score is low. Time for self-care!'
      });
    }
  }

  getDailyReport() {
    const score = this.wellnessScore;
    const scoreEmoji = score > 80 ? '🌟' : score > 60 ? '😊' : score > 40 ? '😐' : '😟';
    
    return {
      score,
      scoreEmoji,
      summary: `${scoreEmoji} Wellness Score: ${score}/100`,
      stats: this.dailyStats,
      recommendations: this.getRecommendations()
    };
  }

  getRecommendations() {
    const recs = [];
    
    if (this.dailyStats.waterIntake < 1500) {
      recs.push("💧 Increase water intake - aim for 2L daily");
    }
    if (this.dailyStats.stretches < 3) {
      recs.push("🤸 Do more stretches throughout the day");
    }
    if (this.dailyStats.exercises < 2) {
      recs.push("🏃 Try to fit in more movement breaks");
    }
    if (this.wellnessScore < 60) {
      recs.push("🌟 Focus on self-care - your health matters!");
    }
    
    return recs;
  }
}

// Ergonomic tips
export const ergonomicTips = [
  "🖥️ Top of monitor should be at or below eye level",
  "⌨️ Keyboard should allow elbows to be at 90° angle",
  "🪑 Chair height: feet flat on floor, thighs parallel to ground",
  "🖱️ Mouse should be at same height as keyboard",
  "💡 Reduce glare with proper lighting placement",
  "📏 Monitor should be arm's length away (20-26 inches)",
  "🦶 Use a footrest if feet don't reach the floor",
  "📱 Avoid cradling phone between ear and shoulder",
  "⌨️ Consider ergonomic keyboard/mouse for heavy use",
  "🧍 Alternate between sitting and standing if possible"
];