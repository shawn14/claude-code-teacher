import chalk from 'chalk';
import { EventEmitter } from 'events';

export class RubberDuckMode extends EventEmitter {
  constructor() {
    super();
    
    this.duckPersonalities = {
      classic: {
        name: "Classic Duck",
        emoji: "🦆",
        style: "patient and methodical",
        responses: {
          greeting: "Quack! I'm here to listen. Tell me about your problem.",
          listening: ["Mmm-hmm...", "I see...", "Go on...", "Interesting..."],
          clarifying: ["Can you explain that part again?", "What do you mean by that?", "How does that work?"],
          encouraging: ["You're getting somewhere!", "That's a good observation!", "Keep going!"],
          breakthrough: ["Aha! You figured it out!", "There it is!", "Excellent reasoning!"]
        }
      },
      
      detective: {
        name: "Detective Duck",
        emoji: "🕵️",
        style: "investigative and thorough",
        responses: {
          greeting: "Let's solve this mystery together. What's the case?",
          listening: ["Hmm, suspicious...", "The plot thickens...", "Curious..."],
          clarifying: ["What's the evidence?", "When did this start happening?", "Any error messages?"],
          encouraging: ["Good detective work!", "You're on the right track!", "Elementary!"],
          breakthrough: ["Case closed!", "Mystery solved!", "Brilliant deduction!"]
        }
      },
      
      zen: {
        name: "Zen Duck",
        emoji: "🧘",
        style: "calm and philosophical",
        responses: {
          greeting: "Welcome. Empty your mind of assumptions. What troubles you?",
          listening: ["*peaceful silence*", "Contemplate...", "Be one with the code..."],
          clarifying: ["What is the essence of the problem?", "Look deeper...", "Question your assumptions..."],
          encouraging: ["The path reveals itself...", "Wisdom comes from within...", "Trust the process..."],
          breakthrough: ["Enlightenment!", "The way is clear!", "You have found balance!"]
        }
      },
      
      pirate: {
        name: "Pirate Duck",
        emoji: "🏴‍☠️",
        style: "adventurous and bold",
        responses: {
          greeting: "Ahoy matey! What be troublin' ye code?",
          listening: ["Arr...", "Shiver me timbers...", "Aye, I be followin'..."],
          clarifying: ["What be that error sayin'?", "Where be the treasure... er, bug?", "Explain that again, savvy?"],
          encouraging: ["Hoist the colors!", "Ye be close to the treasure!", "Fair winds, sailor!"],
          breakthrough: ["X marks the spot!", "Treasure found!", "Victory be yours!"]
        }
      },
      
      scientist: {
        name: "Professor Duck",
        emoji: "🔬",
        style: "analytical and precise",
        responses: {
          greeting: "Let's approach this scientifically. State your hypothesis.",
          listening: ["Fascinating...", "Data noted...", "Hypothesis forming..."],
          clarifying: ["What variables are involved?", "Can you reproduce it?", "What's your test case?"],
          encouraging: ["Excellent methodology!", "Your logic is sound!", "Good experimental design!"],
          breakthrough: ["Eureka!", "Theory confirmed!", "Peer review approved!"]
        }
      }
    };
    
    this.currentDuck = this.duckPersonalities.classic;
    this.sessionData = {
      startTime: null,
      problemStatement: '',
      thoughtProcess: [],
      breakthroughs: [],
      duration: 0
    };
    
    this.problemCategories = [
      "Bug/Error",
      "Performance Issue",
      "Design Decision",
      "Logic Problem",
      "Integration Issue",
      "Other"
    ];
  }

  selectDuck(personality) {
    if (this.duckPersonalities[personality]) {
      this.currentDuck = this.duckPersonalities[personality];
      return {
        success: true,
        message: `${this.currentDuck.emoji} ${this.currentDuck.name} is ready to help!`,
        style: this.currentDuck.style
      };
    }
    return {
      success: false,
      message: "Unknown duck personality"
    };
  }

  startSession(problemCategory = "General") {
    this.sessionData = {
      startTime: Date.now(),
      problemStatement: '',
      category: problemCategory,
      thoughtProcess: [],
      breakthroughs: [],
      duration: 0
    };
    
    this.emit('session-started', {
      duck: this.currentDuck.name,
      category: problemCategory
    });
    
    return {
      greeting: this.currentDuck.responses.greeting,
      tips: this.getRubberDuckTips(),
      ascii: this.getDuckAscii()
    };
  }

  getDuckAscii() {
    const duckArt = {
      classic: `
         __
       <(o )___
        ( ._> /
         \`---'   `,
      
      detective: `
         __  🔍
       <(ò )___
        ( ._> /
         \`---'   `,
      
      zen: `
         _☮_
       <(- -)___
        ( ._> /
         \`---'   `,
         
      pirate: `
         _⚓_
       <(x )___
        ( ._> /
         \`---'   `,
         
      scientist: `
         _🧪_
       <(◉ )___
        ( ._> /
         \`---'   `
    };
    
    return duckArt[Object.keys(this.duckPersonalities).find(key => 
      this.duckPersonalities[key] === this.currentDuck
    )] || duckArt.classic;
  }

  getRubberDuckTips() {
    return [
      "🦆 Explain your problem out loud, step by step",
      "🦆 Don't skip details - the duck needs context",
      "🦆 Question your assumptions as you explain",
      "🦆 If stuck, start from the beginning",
      "🦆 The duck is patient - take your time"
    ];
  }

  processProblemStatement(statement) {
    this.sessionData.problemStatement = statement;
    this.sessionData.thoughtProcess.push({
      time: Date.now(),
      type: 'problem',
      content: statement
    });
    
    // Analyze the problem for keywords
    const analysis = this.analyzeProblem(statement);
    
    return {
      response: this.getDuckResponse('listening'),
      analysis,
      suggestions: this.getSuggestions(analysis)
    };
  }

  analyzeProblem(statement) {
    const keywords = {
      error: ['error', 'exception', 'crash', 'fail', 'undefined', 'null'],
      logic: ['if', 'else', 'loop', 'condition', 'flow', 'order'],
      performance: ['slow', 'lag', 'memory', 'timeout', 'optimize'],
      syntax: ['syntax', 'parse', 'compile', 'token', 'bracket'],
      async: ['async', 'await', 'promise', 'callback', 'then']
    };
    
    const found = {};
    Object.entries(keywords).forEach(([category, words]) => {
      words.forEach(word => {
        if (statement.toLowerCase().includes(word)) {
          found[category] = (found[category] || 0) + 1;
        }
      });
    });
    
    return found;
  }

  getSuggestions(analysis) {
    const suggestions = [];
    
    if (analysis.error) {
      suggestions.push("🔍 Check the exact error message and line number");
      suggestions.push("📊 Verify all variables are defined before use");
    }
    
    if (analysis.logic) {
      suggestions.push("📝 Trace through the logic step by step");
      suggestions.push("🧪 Add console.logs to verify flow");
    }
    
    if (analysis.performance) {
      suggestions.push("⏱️ Profile to find bottlenecks");
      suggestions.push("🔄 Check for unnecessary loops or operations");
    }
    
    if (analysis.async) {
      suggestions.push("⏳ Ensure all promises are handled");
      suggestions.push("🔄 Check for race conditions");
    }
    
    return suggestions;
  }

  processThought(thought) {
    this.sessionData.thoughtProcess.push({
      time: Date.now(),
      type: 'thought',
      content: thought
    });
    
    // Check for breakthrough indicators
    const breakthroughKeywords = [
      'wait', 'oh', 'aha', 'got it', 'found it', 'i see', 'of course',
      'that\'s it', 'now i understand', 'the problem is', 'realized'
    ];
    
    const isBreakthrough = breakthroughKeywords.some(keyword => 
      thought.toLowerCase().includes(keyword)
    );
    
    if (isBreakthrough) {
      this.sessionData.breakthroughs.push({
        time: Date.now(),
        thought
      });
      
      return {
        response: this.getDuckResponse('breakthrough'),
        type: 'breakthrough',
        celebration: this.celebrate()
      };
    }
    
    // Determine response type
    const isQuestion = thought.includes('?');
    const responseType = isQuestion ? 'clarifying' : 'encouraging';
    
    return {
      response: this.getDuckResponse(responseType),
      type: responseType
    };
  }

  getDuckResponse(type) {
    const responses = this.currentDuck.responses[type] || this.currentDuck.responses.listening;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  celebrate() {
    const celebrations = [
      "🎉 Brilliant work!",
      "🌟 You solved it yourself!",
      "🏆 Debugging champion!",
      "✨ The power of rubber duck debugging!",
      "🎊 Problem solved!"
    ];
    
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }

  askClarifyingQuestion() {
    const questions = [
      "What have you tried so far?",
      "When did this problem start?",
      "What's the expected behavior?",
      "What's actually happening?",
      "Have you seen this error before?",
      "What changed recently?",
      "Can you isolate the problem?",
      "What are your assumptions?"
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }

  endSession() {
    const duration = Date.now() - this.sessionData.startTime;
    this.sessionData.duration = duration;
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    const summary = {
      duration: `${minutes}m ${seconds}s`,
      thoughtCount: this.sessionData.thoughtProcess.length,
      breakthroughCount: this.sessionData.breakthroughs.length,
      effectiveness: this.calculateEffectiveness(),
      insights: this.generateInsights()
    };
    
    this.emit('session-ended', summary);
    
    return {
      summary,
      farewell: `${this.currentDuck.emoji} Happy to help! Remember, the answer was inside you all along.`
    };
  }

  calculateEffectiveness() {
    if (this.sessionData.breakthroughs.length > 0) {
      const timeToFirstBreakthrough = this.sessionData.breakthroughs[0].time - this.sessionData.startTime;
      const minutes = timeToFirstBreakthrough / 60000;
      
      if (minutes < 5) return "Highly Effective! 🌟";
      if (minutes < 10) return "Very Effective! ⭐";
      if (minutes < 20) return "Effective! ✅";
      return "Good Session! 👍";
    }
    
    return "Keep trying! The duck believes in you! 🦆";
  }

  generateInsights() {
    const insights = [];
    
    if (this.sessionData.thoughtProcess.length > 20) {
      insights.push("Complex problem - good job working through it!");
    }
    
    if (this.sessionData.breakthroughs.length > 1) {
      insights.push("Multiple insights gained - excellent problem solving!");
    }
    
    const questions = this.sessionData.thoughtProcess.filter(t => 
      t.content.includes('?')
    ).length;
    
    if (questions > 5) {
      insights.push("Asking good questions - key to debugging!");
    }
    
    return insights;
  }

  getDebugChecklist(problemType) {
    const checklists = {
      error: [
        "✓ Read the full error message",
        "✓ Check the line number",
        "✓ Verify variable names",
        "✓ Check for typos",
        "✓ Confirm all imports/requires",
        "✓ Test with simple input"
      ],
      
      logic: [
        "✓ Trace execution path",
        "✓ Check all conditions",
        "✓ Verify loop boundaries",
        "✓ Test edge cases",
        "✓ Add debug logging",
        "✓ Simplify complex conditions"
      ],
      
      performance: [
        "✓ Identify bottlenecks",
        "✓ Check for nested loops",
        "✓ Review data structures",
        "✓ Consider caching",
        "✓ Profile the code",
        "✓ Check network calls"
      ],
      
      general: [
        "✓ Reproduce the issue",
        "✓ Isolate the problem",
        "✓ Check recent changes",
        "✓ Read documentation",
        "✓ Search for similar issues",
        "✓ Take a break and return"
      ]
    };
    
    return checklists[problemType] || checklists.general;
  }
}

// Debugging wisdom
export const debuggingWisdom = [
  "🧠 The bug is not moving around in your code trying to trick you. It's just there.",
  "🔍 Read the error message. Then read it again. It's usually telling you exactly what's wrong.",
  "🦆 Explaining to a duck works because it forces you to slow down and think clearly.",
  "💡 If you're stuck for more than 30 minutes, take a break. Fresh eyes see more.",
  "📝 The code you're debugging is not malicious. It's doing exactly what you told it to.",
  "🎯 Start with the simplest possible test case that reproduces the issue.",
  "🔄 'It worked yesterday' means something changed. Find what changed.",
  "🧪 Test your assumptions. Half of debugging is discovering wrong assumptions.",
  "📚 Sometimes the documentation has the answer. Really.",
  "☕ Some bugs are best solved after coffee. Or sleep. Or both."
];