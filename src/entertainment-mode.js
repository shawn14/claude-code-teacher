import chalk from 'chalk';
import readline from 'readline';

export class EntertainmentMode {
  constructor() {
    this.score = 0;
    this.streak = 0;
    this.triviaQuestions = this.loadTriviaQuestions();
    this.jokes = this.loadJokes();
    this.asciiAnimations = this.loadAsciiAnimations();
    this.currentActivity = null;
  }

  loadTriviaQuestions() {
    return [
      {
        question: "What does 'DRY' stand for in programming?",
        options: ["A) Don't Repeat Yourself", "B) Debug Run Yearly", "C) Data Retrieval Yield", "D) Direct Response Yes"],
        answer: 0,
        explanation: "DRY (Don't Repeat Yourself) is a principle aimed at reducing repetition in code."
      },
      {
        question: "What year was JavaScript created?",
        options: ["A) 1991", "B) 1995", "C) 1999", "D) 2001"],
        answer: 1,
        explanation: "JavaScript was created by Brendan Eich in 1995 in just 10 days!"
      },
      {
        question: "What is the time complexity of binary search?",
        options: ["A) O(n)", "B) O(n²)", "C) O(log n)", "D) O(1)"],
        answer: 2,
        explanation: "Binary search has O(log n) time complexity because it halves the search space with each iteration."
      },
      {
        question: "Which of these is NOT a JavaScript framework?",
        options: ["A) React", "B) Angular", "C) Django", "D) Vue"],
        answer: 2,
        explanation: "Django is a Python web framework, not JavaScript!"
      },
      {
        question: "What does SQL stand for?",
        options: ["A) Structured Query Language", "B) Simple Question Language", "C) System Query Logic", "D) Sequential Query List"],
        answer: 0,
        explanation: "SQL (Structured Query Language) is used for managing relational databases."
      },
      {
        question: "In Git, what does 'HEAD' refer to?",
        options: ["A) The first commit", "B) The latest commit on current branch", "C) The main branch", "D) A merge conflict"],
        answer: 1,
        explanation: "HEAD is a pointer to the latest commit on your current branch."
      },
      {
        question: "What is the difference between '==' and '===' in JavaScript?",
        options: ["A) No difference", "B) === checks type and value", "C) == is faster", "D) === only works with numbers"],
        answer: 1,
        explanation: "=== (strict equality) checks both type and value, while == allows type coercion."
      },
      {
        question: "What does API stand for?",
        options: ["A) Application Programming Interface", "B) Advanced Program Integration", "C) Automated Process Inquiry", "D) Active Program Instance"],
        answer: 0,
        explanation: "API allows different software applications to communicate with each other."
      },
      {
        question: "Which sorting algorithm has the best average case complexity?",
        options: ["A) Bubble Sort", "B) Quick Sort", "C) Selection Sort", "D) Insertion Sort"],
        answer: 1,
        explanation: "Quick Sort has an average case complexity of O(n log n), making it very efficient."
      },
      {
        question: "What is a closure in programming?",
        options: ["A) A syntax error", "B) A function that has access to outer scope", "C) A way to close files", "D) A type of loop"],
        answer: 1,
        explanation: "A closure is a function that retains access to variables from its outer scope."
      }
    ];
  }

  loadJokes() {
    return [
      {
        setup: "Why do programmers prefer dark mode?",
        punchline: "Because light attracts bugs! 🐛"
      },
      {
        setup: "How many programmers does it take to change a light bulb?",
        punchline: "None. It's a hardware problem! 💡"
      },
      {
        setup: "Why do Java developers wear glasses?",
        punchline: "Because they don't C#! 👓"
      },
      {
        setup: "What's a programmer's favorite place to hang out?",
        punchline: "The Foo Bar! 🍺"
      },
      {
        setup: "Why did the developer go broke?",
        punchline: "Because he used up all his cache! 💸"
      },
      {
        setup: "What do you call a programmer from Finland?",
        punchline: "Nerdic! 🇫🇮"
      },
      {
        setup: "Why do programmers always mix up Christmas and Halloween?",
        punchline: "Because Oct 31 == Dec 25! 🎃🎄"
      },
      {
        setup: "What's the object-oriented way to become wealthy?",
        punchline: "Inheritance! 💰"
      },
      {
        setup: "Why was the JavaScript developer sad?",
        punchline: "Because he didn't Node how to Express himself! 😢"
      },
      {
        setup: "A SQL query walks into a bar...",
        punchline: "Walks up to two tables and asks: 'Can I join you?' 🍻"
      }
    ];
  }

  loadAsciiAnimations() {
    return {
      loading: [
        "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"
      ],
      progress: [
        "[          ]",
        "[■         ]",
        "[■■        ]",
        "[■■■       ]",
        "[■■■■      ]",
        "[■■■■■     ]",
        "[■■■■■■    ]",
        "[■■■■■■■   ]",
        "[■■■■■■■■  ]",
        "[■■■■■■■■■ ]",
        "[■■■■■■■■■■]"
      ],
      rocket: [
        "     🚀     ",
        "    🚀      ",
        "   🚀       ",
        "  🚀        ",
        " 🚀         ",
        "🚀          ",
        " 🚀         ",
        "  🚀        ",
        "   🚀       ",
        "    🚀      ",
        "     🚀     "
      ],
      dance: [
        "♪┏(・o･)┛♪",
        "♪┗(･o･)┓♪",
        "♪┏(･o･)┛♪",
        "♪┗(･o･)┓♪"
      ],
      coffee: [
        "   ))  \n  ((   \n c[_]  ",
        "  ))   \n ((    \n c[_]  ",
        " ))    \n((     \n c[_]  ",
        "))     \n((     \n c[_]  "
      ]
    };
  }

  async startTrivia() {
    console.clear();
    console.log(chalk.bold.cyan('🎯 Developer Trivia Time!'));
    console.log(chalk.gray('Test your programming knowledge\n'));
    
    const question = this.triviaQuestions[Math.floor(Math.random() * this.triviaQuestions.length)];
    
    console.log(chalk.yellow(question.question + '\n'));
    question.options.forEach((option, index) => {
      console.log(chalk.white(option));
    });
    
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question(chalk.cyan('\nYour answer (A/B/C/D): '), (answer) => {
        const answerIndex = answer.toUpperCase().charCodeAt(0) - 65;
        
        if (answerIndex === question.answer) {
          this.score += 10;
          this.streak++;
          console.log(chalk.green(`\n✅ Correct! ${question.explanation}`));
          console.log(chalk.green(`Score: ${this.score} | Streak: ${this.streak}`));
        } else {
          this.streak = 0;
          console.log(chalk.red(`\n❌ Wrong! The correct answer was ${String.fromCharCode(65 + question.answer)}`));
          console.log(chalk.yellow(question.explanation));
          console.log(chalk.gray(`Score: ${this.score} | Streak: ${this.streak}`));
        }
        
        rl.close();
        resolve();
      });
    });
  }

  tellJoke() {
    const joke = this.jokes[Math.floor(Math.random() * this.jokes.length)];
    console.log('\n' + chalk.bold.yellow('😄 Developer Joke:'));
    console.log(chalk.cyan(joke.setup));
    
    setTimeout(() => {
      console.log(chalk.green(joke.punchline));
      console.log(chalk.gray('\nPress any key to continue...'));
    }, 2000);
  }

  async playAnimation(animationType = 'loading') {
    const animation = this.asciiAnimations[animationType];
    if (!animation) return;
    
    console.log('\n');
    for (let i = 0; i < animation.length * 3; i++) {
      process.stdout.write('\r' + animation[i % animation.length]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('\n');
  }

  async showDailyQuote() {
    const quotes = [
      { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
      { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
      { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
      { text: "Fix the cause, not the symptom.", author: "Steve Maguire" },
      { text: "Optimism is an occupational hazard of programming: feedback is the treatment.", author: "Kent Beck" },
      { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
      { text: "Clean code always looks like it was written by someone who cares.", author: "Robert C. Martin" },
      { text: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine" },
      { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
      { text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", author: "Dan Salomon" }
    ];
    
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    
    console.log('\n' + chalk.bold.magenta('💭 Daily Developer Quote:'));
    console.log(chalk.italic.cyan(`"${quote.text}"`));
    console.log(chalk.gray(`- ${quote.author}`));
  }

  async startCodeGolf() {
    const challenges = [
      {
        task: "Write a function that reverses a string",
        example: "reverse('hello') => 'olleh'",
        solution: "s=>s.split('').reverse().join('')"
      },
      {
        task: "Check if a number is even",
        example: "isEven(4) => true, isEven(3) => false",
        solution: "n=>n%2==0"
      },
      {
        task: "Find the maximum of two numbers without using Math.max",
        example: "max(5, 3) => 5",
        solution: "(a,b)=>a>b?a:b"
      },
      {
        task: "Count vowels in a string",
        example: "countVowels('hello') => 2",
        solution: "s=>s.match(/[aeiou]/gi)?.length||0"
      },
      {
        task: "Check if a string is a palindrome",
        example: "isPalindrome('racecar') => true",
        solution: "s=>s==s.split('').reverse().join('')"
      }
    ];
    
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    console.clear();
    console.log(chalk.bold.green('⛳ Code Golf Challenge!'));
    console.log(chalk.gray('Write the shortest solution possible\n'));
    
    console.log(chalk.yellow('Task: ') + challenge.task);
    console.log(chalk.gray('Example: ') + challenge.example);
    console.log(chalk.gray('\nPress Enter to see the solution...'));
    
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', () => {
        console.log(chalk.green('\nShortest solution: ') + chalk.cyan(challenge.solution));
        console.log(chalk.gray(`Characters: ${challenge.solution.length}`));
        rl.close();
        resolve();
      });
    });
  }

  async showFunFact() {
    const facts = [
      "The first computer bug was an actual bug - a moth trapped in Harvard Mark II computer in 1947!",
      "The term 'debugging' predates the moth incident and was already used in engineering.",
      "The first programming language was Fortran, created in 1957.",
      "There are over 700 programming languages, but only about 20-50 are widely used.",
      "The average developer drinks 2-3 cups of coffee per day. ☕",
      "Git was created by Linus Torvalds in just 2 weeks!",
      "The first 1GB hard drive weighed 550 pounds and cost $40,000 in 1980.",
      "Python is named after Monty Python, not the snake! 🐍",
      "The term 'cookie' comes from 'magic cookie,' a term used by Unix programmers.",
      "Stack Overflow saves developers an estimated 30-90 minutes per day."
    ];
    
    const fact = facts[Math.floor(Math.random() * facts.length)];
    
    console.log('\n' + chalk.bold.blue('🤓 Fun Programming Fact:'));
    console.log(chalk.cyan(fact));
  }

  getMenu() {
    return {
      title: '🎮 Entertainment Mode',
      options: [
        { name: '🎯 Play Trivia', value: 'trivia' },
        { name: '😄 Tell Me a Joke', value: 'joke' },
        { name: '💭 Daily Quote', value: 'quote' },
        { name: '⛳ Code Golf Challenge', value: 'golf' },
        { name: '🤓 Fun Fact', value: 'fact' },
        { name: '🎬 Play Animation', value: 'animation' },
        { name: '↩️  Back to Main', value: 'back' }
      ]
    };
  }
}

// ASCII art for special occasions
export const specialAsciiArt = {
  welcome: `
    ╔═══════════════════════════════════════╗
    ║   Welcome to Claude Code Teacher! 🎓   ║
    ║   Your AI Coding Companion            ║
    ╚═══════════════════════════════════════╝
  `,
  
  achievement: `
    🏆 Achievement Unlocked! 🏆
    ╔═══════════════════════╗
    ║   Coding Streak: 7    ║
    ║   Days in a Row!      ║
    ╚═══════════════════════╝
  `,
  
  levelUp: `
        🌟 LEVEL UP! 🌟
    ╔═══════════════════════╗
    ║   You reached         ║
    ║   Level 10!           ║
    ║   XP: 1000/1000       ║
    ╚═══════════════════════╝
  `
};