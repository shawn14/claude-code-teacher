// Test file for Vibe Code insights
import { InsightEngine } from './src/insight-engine.js';

const engine = new InsightEngine();

// Test different types of changes
const testCases = [
  {
    name: "React State Update",
    context: {
      filename: "UserProfile.js",
      diff: `@@ -10,5 +10,8 @@
-  const [user, setUser] = useState(null);
+  const [user, setUser] = useState(null);
+  const [loading, setLoading] = useState(false);
+  
+  useEffect(() => {
+    fetchUserData();
+  }, []);`,
      content: "React component with hooks"
    }
  },
  {
    name: "Security Fix",
    context: {
      filename: "auth-service.js",
      diff: `@@ -15,3 +15,5 @@
-  const token = req.body.token;
+  const token = sanitize(req.body.token);
+  if (!validateToken(token)) {
+    throw new Error('Invalid token');
+  }`,
      content: "Authentication service"
    }
  },
  {
    name: "Performance Optimization",
    context: {
      filename: "data-processor.js",
      diff: `@@ -20,4 +20,6 @@
-  const results = data.map(item => processItem(item));
+  const results = useMemo(() => {
+    return data.map(item => processItem(item));
+  }, [data]);`,
      content: "Data processing component"
    }
  }
];

console.log('🧪 Testing Vibe Code Insight Engine\n');

testCases.forEach(test => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Test: ${test.name}`);
  console.log(`File: ${test.context.filename}`);
  console.log(`${'='.repeat(60)}`);
  
  const analysisContext = {
    ...test.context,
    patterns: engine.detectPatterns(test.context),
    category: engine.detectChangeCategory(test.context),
    complexity: engine.calculateComplexity(test.context)
  };
  
  const insights = engine.analyzeChange(analysisContext);
  console.log(insights);
});