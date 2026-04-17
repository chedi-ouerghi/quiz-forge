import { db } from '../config/database.js';
import { quizzes } from '../db/schema/quizzes.js';
import { questions } from '../db/schema/questions.js';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { Difficulty } from '../types/index.js';

type SeedQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type SeedQuiz = {
  title: string;
  category: string;
  difficulty: Difficulty;
  description: string;
  icon: string;
  color: string;
  xpReward: number;
  order: number;
  questions: SeedQuestion[];
};

const DEFAULT_QUIZ_CATALOG: SeedQuiz[] = [
  {
    title: 'JavaScript Foundations',
    category: 'Programming',
    difficulty: 'beginner',
    description: 'Variables, types, conditions, loops, and basic functions.',
    icon: 'code',
    color: '#F59E0B',
    xpReward: 120,
    order: 1,
    questions: [
      { question: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'const', 'both let and const'], correctIndex: 3, explanation: 'Both let and const are block-scoped in JavaScript.' },
      { question: 'What is the result type of typeof null?', options: ['null', 'undefined', 'object', 'boolean'], correctIndex: 2, explanation: 'typeof null returns "object" due to a historical JavaScript quirk.' },
      { question: 'Which operator checks strict equality?', options: ['==', '===', '=', '!='], correctIndex: 1, explanation: '=== compares value and type.' },
      { question: 'How do you write a single-line comment?', options: ['# comment', '// comment', '/* comment */', '-- comment'], correctIndex: 1, explanation: 'Single-line comments use // in JavaScript.' },
      { question: 'Which method adds an element to the end of an array?', options: ['shift()', 'push()', 'pop()', 'unshift()'], correctIndex: 1, explanation: 'push() appends one or more elements to an array.' },
      { question: 'What is returned by Boolean(0)?', options: ['true', 'false', '0', 'undefined'], correctIndex: 1, explanation: '0 is a falsy value in JavaScript.' },
      { question: 'Which loop is best when you know iteration count?', options: ['while', 'for', 'do...while', 'for...in'], correctIndex: 1, explanation: 'for is commonly used when iteration count is known.' },
      { question: 'What does NaN stand for?', options: ['Not a Number', 'No assigned Number', 'Null and None', 'New assigned Number'], correctIndex: 0, explanation: 'NaN means "Not a Number".' },
      { question: 'Which statement stops a loop immediately?', options: ['continue', 'stop', 'break', 'return'], correctIndex: 2, explanation: 'break exits the loop directly.' },
      { question: 'What is the default value of an uninitialized variable declared with let?', options: ['null', '0', 'undefined', 'false'], correctIndex: 2, explanation: 'Uninitialized variables are undefined.' },
    ],
  },
  {
    title: 'Web Basics (HTML/CSS)',
    category: 'Frontend',
    difficulty: 'beginner',
    description: 'Core HTML semantics and CSS layout fundamentals.',
    icon: 'web',
    color: '#06B6D4',
    xpReward: 130,
    order: 2,
    questions: [
      { question: 'Which HTML tag is used for the largest heading?', options: ['<heading>', '<h6>', '<h1>', '<title>'], correctIndex: 2, explanation: '<h1> is the largest heading level.' },
      { question: 'Which CSS property changes text color?', options: ['font-color', 'text-style', 'color', 'foreground'], correctIndex: 2, explanation: 'The standard CSS property is color.' },
      { question: 'What does CSS stand for?', options: ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Syntax', 'Colorful Style Sheets'], correctIndex: 1, explanation: 'CSS means Cascading Style Sheets.' },
      { question: 'Which display value creates a flex container?', options: ['display: flex', 'display: block', 'position: flex', 'layout: flex'], correctIndex: 0, explanation: 'display: flex enables Flexbox layout.' },
      { question: 'Which tag creates a hyperlink?', options: ['<a>', '<link>', '<href>', '<url>'], correctIndex: 0, explanation: '<a> is used for anchors and links.' },
      { question: 'Which unit is relative to root font-size?', options: ['em', 'rem', 'px', '%'], correctIndex: 1, explanation: 'rem is based on root element font-size.' },
      { question: 'Which property controls element spacing inside border?', options: ['margin', 'padding', 'gap', 'spacing'], correctIndex: 1, explanation: 'padding is space inside an element border.' },
      { question: 'What is semantic HTML?', options: ['Using only divs', 'Using tags by meaning', 'Using inline styles', 'Using JavaScript only'], correctIndex: 1, explanation: 'Semantic tags describe content meaning and improve accessibility.' },
      { question: 'Which property rounds corners?', options: ['corner-radius', 'border-round', 'border-radius', 'radius'], correctIndex: 2, explanation: 'border-radius rounds element corners.' },
      { question: 'How to make image responsive in width?', options: ['width: 100%; height: auto;', 'max-width: auto;', 'display: responsive;', 'size: fluid;'], correctIndex: 0, explanation: 'width 100% with height auto preserves ratio in many cases.' },
    ],
  },
  {
    title: 'React Core Concepts',
    category: 'Frontend',
    difficulty: 'intermediate',
    description: 'State, props, hooks, and component lifecycle thinking.',
    icon: 'layers',
    color: '#38BDF8',
    xpReward: 180,
    order: 1,
    questions: [
      { question: 'Which hook manages local component state?', options: ['useEffect', 'useMemo', 'useState', 'useRef'], correctIndex: 2, explanation: 'useState creates state variables in function components.' },
      { question: 'What triggers a re-render?', options: ['Changing local variable', 'State/props change', 'Calling console.log', 'Importing file'], correctIndex: 1, explanation: 'React re-renders when state or props change.' },
      { question: 'Purpose of useEffect?', options: ['Styling', 'Side effects', 'State creation', 'Routing'], correctIndex: 1, explanation: 'useEffect handles side effects like fetch and subscriptions.' },
      { question: 'Why use key in list rendering?', options: ['For CSS', 'For faster JSX parsing', 'Stable identity between renders', 'For type checking'], correctIndex: 2, explanation: 'Keys help React track list items efficiently.' },
      { question: 'Which hook memoizes expensive computed values?', options: ['useCallback', 'useState', 'useMemo', 'useReducer'], correctIndex: 2, explanation: 'useMemo caches computed values based on dependencies.' },
      { question: 'What does lifting state up mean?', options: ['Move state to parent', 'Use Redux', 'Store in localStorage', 'Convert class to function'], correctIndex: 0, explanation: 'Shared state should be moved to the nearest common ancestor.' },
      { question: 'When should useCallback be considered?', options: ['Always', 'Never', 'When passing callbacks to memoized children', 'Only for API calls'], correctIndex: 2, explanation: 'useCallback helps avoid unnecessary child re-renders in specific cases.' },
      { question: 'Which statement about props is true?', options: ['Props are mutable', 'Props are read-only', 'Props store side effects', 'Props replace state always'], correctIndex: 1, explanation: 'Props are immutable from the child perspective.' },
      { question: 'What causes infinite effect loops often?', options: ['Empty dependency array', 'Missing dependency array with state set inside effect', 'Using useRef', 'Using fragments'], correctIndex: 1, explanation: 'Effect without controlled dependencies can loop if it updates state.' },
      { question: 'Main benefit of component composition?', options: ['Less code splitting', 'Reusable UI and clearer architecture', 'No props needed', 'No testing needed'], correctIndex: 1, explanation: 'Composition improves reuse, maintainability, and scalability.' },
    ],
  },
  {
    title: 'SQL and Data Modeling',
    category: 'Database',
    difficulty: 'intermediate',
    description: 'Queries, joins, indexing, and relational thinking.',
    icon: 'storage',
    color: '#10B981',
    xpReward: 190,
    order: 2,
    questions: [
      { question: 'Which SQL clause filters rows?', options: ['ORDER BY', 'WHERE', 'GROUP BY', 'HAVING'], correctIndex: 1, explanation: 'WHERE filters rows before grouping.' },
      { question: 'Which join returns matching rows from both tables only?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], correctIndex: 2, explanation: 'INNER JOIN keeps only matched rows.' },
      { question: 'Primary key purpose?', options: ['Sort rows', 'Uniquely identify each row', 'Encrypt row', 'Compress table'], correctIndex: 1, explanation: 'Primary key uniquely identifies each row.' },
      { question: 'What does COUNT(*) do?', options: ['Counts non-null in one column', 'Counts rows', 'Counts distinct rows only', 'Counts indexes'], correctIndex: 1, explanation: 'COUNT(*) counts rows in result set.' },
      { question: 'Index mainly improves?', options: ['INSERT speed', 'SELECT lookup speed', 'Network latency', 'Disk size'], correctIndex: 1, explanation: 'Indexes speed up reads/lookups, often at write cost.' },
      { question: 'Which normal form removes repeating groups?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctIndex: 0, explanation: '1NF enforces atomic values and no repeating groups.' },
      { question: 'HAVING is used with?', options: ['Aggregations', 'INSERT', 'UPDATE only', 'UNION only'], correctIndex: 0, explanation: 'HAVING filters grouped/aggregated results.' },
      { question: 'Foreign key ensures?', options: ['Faster sort', 'Referential integrity', 'Automatic backup', 'Column encryption'], correctIndex: 1, explanation: 'Foreign keys keep references valid across tables.' },
      { question: 'Best type for variable text in MySQL?', options: ['INT', 'VARCHAR', 'BOOLEAN', 'DATE'], correctIndex: 1, explanation: 'VARCHAR is suitable for variable-length text.' },
      { question: 'What does transaction rollback do?', options: ['Deletes table', 'Undo changes in transaction', 'Creates backup', 'Resets index'], correctIndex: 1, explanation: 'Rollback reverts uncommitted transaction operations.' },
    ],
  },
  {
    title: 'Node.js Architecture',
    category: 'Backend',
    difficulty: 'advanced',
    description: 'Event loop, async patterns, performance, and clean service design.',
    icon: 'hub',
    color: '#22C55E',
    xpReward: 260,
    order: 1,
    questions: [
      { question: 'Node.js is best described as?', options: ['Multi-threaded by default', 'Single-threaded event loop with async I/O', 'Synchronous runtime only', 'Browser-only runtime'], correctIndex: 1, explanation: 'Node runs JS on a single main thread with non-blocking I/O.' },
      { question: 'What blocks the event loop?', options: ['await fetch()', 'CPU-heavy synchronous computation', 'Promise.then()', 'setTimeout()'], correctIndex: 1, explanation: 'Long synchronous CPU tasks block event loop progress.' },
      { question: 'Main purpose of worker threads?', options: ['Serve HTTP faster by default', 'Run CPU-intensive jobs in parallel', 'Replace all async I/O', 'Store sessions'], correctIndex: 1, explanation: 'Worker threads offload heavy CPU tasks from main thread.' },
      { question: 'A memory leak often comes from?', options: ['Uncleared intervals/listeners', 'Using const', 'Using async/await', 'Using TypeScript'], correctIndex: 0, explanation: 'Leaked listeners/timers and retained refs are common causes.' },
      { question: 'Which middleware concern should run early?', options: ['404 handler', 'Auth parser/body parser', 'Final error renderer only', 'Business service layer'], correctIndex: 1, explanation: 'Request parsing/security middleware should run before routes.' },
      { question: 'Best pattern for service reliability?', options: ['No retries', 'Retry with backoff and timeouts', 'Infinite loop retries', 'Silent failures'], correctIndex: 1, explanation: 'Backoff+timeout prevents overload and improves resilience.' },
      { question: 'Why use schema validation for request body?', options: ['Improve CSS', 'Prevent invalid/unsafe input', 'Speed up DB writes', 'Replace auth'], correctIndex: 1, explanation: 'Validation ensures data integrity and security.' },
      { question: 'What does idempotency mean for API?', options: ['Always writes twice', 'Same request can be repeated safely', 'Only GET methods', 'Requires GraphQL'], correctIndex: 1, explanation: 'Idempotent operations have same effect when repeated.' },
      { question: 'Centralized error middleware helps with?', options: ['Randomizing responses', 'Consistent error handling/logging', 'Removing need for try/catch', 'Replacing monitoring'], correctIndex: 1, explanation: 'It standardizes error structure and observability.' },
      { question: 'Which metric is key for backend performance?', options: ['Latency percentiles', 'File size', 'Number of comments', 'Theme colors'], correctIndex: 0, explanation: 'P95/P99 latency is critical for real user performance.' },
    ],
  },
  {
    title: 'API Security and Auth',
    category: 'Security',
    difficulty: 'advanced',
    description: 'Authentication flows, authorization, and API hardening.',
    icon: 'security',
    color: '#EF4444',
    xpReward: 280,
    order: 2,
    questions: [
      { question: 'HTTP status for unauthorized (not authenticated)?', options: ['401', '403', '404', '409'], correctIndex: 0, explanation: '401 indicates authentication is required or invalid.' },
      { question: 'HTTP status for authenticated but forbidden?', options: ['401', '403', '422', '500'], correctIndex: 1, explanation: '403 means user is authenticated but lacks permission.' },
      { question: 'Why hash passwords?', options: ['Faster login UI', 'Prevent storing raw credentials', 'Improve routing', 'Reduce bandwidth'], correctIndex: 1, explanation: 'Passwords should be salted and hashed, never stored plain text.' },
      { question: 'JWT should generally be validated for?', options: ['Signature and expiration', 'Color and icon', 'Only username', 'Request body length'], correctIndex: 0, explanation: 'Signature and exp are mandatory checks.' },
      { question: 'Best defense against brute-force login?', options: ['Bigger fonts', 'Rate limiting + lockout strategy', 'Disable logs', 'Expose debug mode'], correctIndex: 1, explanation: 'Rate limiting and progressive lockout mitigate brute-force attacks.' },
      { question: 'What mitigates SQL injection effectively?', options: ['String concatenation', 'Prepared statements/ORM parameters', 'Minifying JS', 'Longer URLs'], correctIndex: 1, explanation: 'Parameterized queries prevent injection payload execution.' },
      { question: 'CORS should be configured as?', options: ['Allow all origins always in prod', 'Allow trusted origins only', 'Disable browser security', 'Ignore credentials'], correctIndex: 1, explanation: 'Restrict origins in production to trusted clients.' },
      { question: 'Why rotate refresh tokens?', options: ['For aesthetics', 'Reduce replay attack window', 'Avoid HTTPS', 'Increase DB size'], correctIndex: 1, explanation: 'Rotation reduces risk if token is leaked.' },
      { question: 'Sensitive secrets should be stored in?', options: ['Source code', '.env / secret manager', 'Client local storage', 'Public repo'], correctIndex: 1, explanation: 'Use env vars or dedicated secret management.' },
      { question: 'What is principle of least privilege?', options: ['Give admin rights by default', 'Grant minimal required permissions', 'Disable auth', 'Always use root DB account'], correctIndex: 1, explanation: 'Users/services should get only required permissions.' },
    ],
  },
  {
    title: 'System Design Essentials',
    category: 'Architecture',
    difficulty: 'expert',
    description: 'Scalability, consistency, caching, and production trade-offs.',
    icon: 'account-tree',
    color: '#8B5CF6',
    xpReward: 340,
    order: 1,
    questions: [
      { question: 'Horizontal scaling means?', options: ['Bigger single server', 'More servers/nodes', 'Less RAM', 'Only faster CPU'], correctIndex: 1, explanation: 'Horizontal scaling adds nodes rather than upgrading one machine.' },
      { question: 'CAP theorem trade-off in distributed systems concerns?', options: ['Cost, API, Process', 'Consistency, Availability, Partition tolerance', 'Cache, API, Performance', 'CPU, Access, Power'], correctIndex: 1, explanation: 'CAP describes trade-offs during network partitions.' },
      { question: 'Cache stampede mitigation includes?', options: ['No expiration', 'Jittered TTL / request coalescing', 'Disable cache', 'Only client cache'], correctIndex: 1, explanation: 'Jitter and coalescing prevent many simultaneous cache misses.' },
      { question: 'Eventual consistency means?', options: ['Never consistent', 'Becomes consistent over time', 'Always strongly consistent', 'Only for SQL'], correctIndex: 1, explanation: 'Replicas converge over time under eventual consistency.' },
      { question: 'Read replica main benefit?', options: ['Write faster always', 'Offload read traffic', 'Encrypt DB', 'Replace backups'], correctIndex: 1, explanation: 'Replicas scale read workloads.' },
      { question: 'Idempotency key is useful for?', options: ['Prevent duplicate request effects', 'Increase payload size', 'Sort records', 'Build UI themes'], correctIndex: 0, explanation: 'It prevents duplicate processing for retries.' },
      { question: 'Circuit breaker pattern purpose?', options: ['Retry forever', 'Stop cascading failures', 'Compress logs', 'Speed up CSS'], correctIndex: 1, explanation: 'Circuit breakers isolate failing dependencies.' },
      { question: 'Sharding is?', options: ['Vertical split by columns only', 'Partitioning data across multiple databases', 'A cache algorithm', 'A hash encryption'], correctIndex: 1, explanation: 'Sharding distributes data across separate nodes.' },
      { question: 'P99 latency is?', options: ['Median latency', 'Worst-case always', 'Latency under which 99% requests complete', 'Average latency'], correctIndex: 2, explanation: 'P99 captures tail latency performance.' },
      { question: 'SLO represents?', options: ['Source log output', 'Service level objective target', 'Security login object', 'Storage layer operation'], correctIndex: 1, explanation: 'SLO defines target reliability/performance objectives.' },
    ],
  },
  {
    title: 'Advanced Algorithms',
    category: 'Computer Science',
    difficulty: 'expert',
    description: 'Complexity analysis, graph algorithms, and optimization patterns.',
    icon: 'functions',
    color: '#A855F7',
    xpReward: 360,
    order: 2,
    questions: [
      { question: 'Time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctIndex: 1, explanation: 'Binary search halves the search space each step.' },
      { question: 'Dijkstra algorithm requires edge weights?', options: ['Any including negative', 'Non-negative weights', 'Only 0/1', 'Only integers'], correctIndex: 1, explanation: 'Classic Dijkstra assumes non-negative edges.' },
      { question: 'Big-O describes?', options: ['Exact runtime on one machine', 'Asymptotic upper bound growth', 'Memory address', 'Compiler optimization'], correctIndex: 1, explanation: 'Big-O expresses growth rate upper bound with input size.' },
      { question: 'Which structure supports FIFO?', options: ['Stack', 'Queue', 'Heap', 'Set'], correctIndex: 1, explanation: 'Queue follows First-In First-Out ordering.' },
      { question: 'Topological sort applies to?', options: ['Undirected cyclic graph', 'Directed acyclic graph (DAG)', 'Weighted tree only', 'Any graph with cycles'], correctIndex: 1, explanation: 'Topological order exists only for DAGs.' },
      { question: 'Memoization primarily optimizes?', options: ['I/O bandwidth', 'Repeated subproblem computation', 'Network retries', 'UI rendering'], correctIndex: 1, explanation: 'Memoization caches results for repeated inputs.' },
      { question: 'Average complexity of hash table lookup?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], correctIndex: 0, explanation: 'Average-case lookup in hash table is O(1).' },
      { question: 'A min-heap guarantees?', options: ['Sorted array', 'Smallest element at root', 'Balanced tree always', 'O(1) insertion'], correctIndex: 1, explanation: 'Min-heap keeps minimum at root.' },
      { question: 'Dynamic programming is useful when?', options: ['No overlap in subproblems', 'Overlapping subproblems + optimal substructure', 'Only recursion forbidden', 'Only for sorting'], correctIndex: 1, explanation: 'DP relies on overlapping subproblems and optimal substructure.' },
      { question: 'Space complexity of merge sort (typical implementation)?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], correctIndex: 2, explanation: 'Merge sort commonly needs O(n) auxiliary space.' },
    ],
  },
];

export async function ensureDefaultQuizzesExist() {
  try {
    const existingQuizzes = await db.select({ count: sql<number>`count(*)` }).from(quizzes);
    const count = Number(existingQuizzes[0].count);

    if (count === 0) {
      logger.info(`Initializing curated quiz catalog (${DEFAULT_QUIZ_CATALOG.length} quizzes)...`);

      for (const quizData of DEFAULT_QUIZ_CATALOG) {
        const quizId = crypto.randomUUID();
        logger.info(`Seeding quiz: ${quizData.title}`);

        await db.insert(quizzes).values({
          id: quizId,
          title: quizData.title,
          category: quizData.category,
          difficulty: quizData.difficulty,
          description: quizData.description,
          icon: quizData.icon,
          color: quizData.color,
          xpReward: quizData.xpReward,
          order: quizData.order
        } as any);

        const questionsToInsert = quizData.questions.map((q, idx) => ({
          id: crypto.randomUUID(),
          quizId,
          category: quizData.category,
          difficulty: quizData.difficulty,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          order: idx
        }));

        await db.insert(questions).values(questionsToInsert);
      }

      logger.info(`Successfully initialized ${DEFAULT_QUIZ_CATALOG.length} curated quizzes.`);
    } else {
      logger.info(`Database already contains ${count} quizzes. Skipping initialization.`);
    }
  } catch (error) {
    logger.error('Error during quiz initialization:', error);
  }
}
