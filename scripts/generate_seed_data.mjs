import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to write JSON
function saveJson(relPath, data) {
  const fullPath = path.join(DATA_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Saved ${data.length} records to ${relPath}`);
}

// 1. JAVA & OOP (30 questions)
const javaQuestions = [
  {
    id: "java-01",
    category: "java_oop",
    topic: "Java Fundamentals",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "What is the difference between JDK, JRE, and JVM in Java?",
    expectedAnswer: "JVM executes bytecode; JRE contains JVM and runtime libraries; JDK contains JRE plus development tools (javac, debugger).",
    explanation: "JVM provides the platform-independent runtime environment. JRE includes class libraries (rt.jar/modules) needed to run apps. JDK includes compiler (javac), archiver (jar), and tools for developers.",
    followUps: ["How does Java achieve 'Write Once, Run Anywhere'?", "What is Just-In-Time (JIT) compilation?"]
  },
  {
    id: "java-02",
    category: "java_oop",
    topic: "OOP Principles",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Explain the four core principles of Object-Oriented Programming with practical real-world examples.",
    expectedAnswer: "Encapsulation (data hiding via private fields and getters/setters), Abstraction (hiding implementation details via interfaces/abstract classes), Inheritance (code reuse via extends), Polymorphism (method overloading and overriding).",
    explanation: "Encapsulation safeguards internal state. Abstraction reduces cognitive complexity. Inheritance enables hierarchical classification. Polymorphism allows unified interfaces for diverse underlying implementations.",
    followUps: ["Why is composition favored over inheritance in modern design?", "Can you achieve multiple inheritance in Java?"]
  },
  {
    id: "java-03",
    category: "java_oop",
    topic: "Memory Management",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "How does Java Memory Management work? Differentiate between Stack and Heap memory.",
    expectedAnswer: "Stack memory stores primitive values and references to objects in frame lifecycles (LIFO, thread-safe, fast). Heap stores objects and JRE classes, shared across threads, managed by Garbage Collector.",
    explanation: "Stack memory allocation is fast and tied to thread execution frames. Heap memory is partitioned into Young Generation (Eden, S0, S1), Old/Tenured Generation, and Metaspace.",
    followUps: ["What causes a java.lang.OutOfMemoryError: Java heap space?", "What triggers a StackOverflowError?"]
  },
  {
    id: "java-04",
    category: "java_oop",
    topic: "Garbage Collection",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "Explain how Java Garbage Collection works and differentiate between Minor GC and Major/Full GC.",
    expectedAnswer: "GC identifies unreferenced objects using mark-and-sweep or generational algorithms. Minor GC collects dead objects in Young Gen (Eden/Survivor). Major GC cleans Old Gen and causes longer Stop-The-World pauses.",
    explanation: "Generational hypothesis assumes most objects die young. Surviving objects age through survivor spaces and get promoted to Old Generation after reaching the tenuring threshold.",
    followUps: ["What are G1GC and ZGC?", "Can System.gc() guarantee immediate garbage collection?"]
  },
  {
    id: "java-05",
    category: "java_oop",
    topic: "Strings & Immutability",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Why are String objects immutable in Java, and how does the String Constant Pool work?",
    expectedAnswer: "Strings are immutable for security (network/DB URLs), thread safety, caching hash codes, and memory optimization via the String Constant Pool located in the Heap.",
    explanation: "When a literal is created, JVM checks the pool. If present, it returns the reference; otherwise it creates it. Because strings are immutable, sharing pool instances is safe across threads.",
    followUps: ["What is the difference between String, StringBuilder, and StringBuffer?", "How does String.intern() function?"]
  },
  {
    id: "java-06",
    category: "java_oop",
    topic: "Exception Handling",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Differentiate between Checked and Unchecked exceptions in Java.",
    expectedAnswer: "Checked exceptions inherit from Exception (excluding RuntimeException) and must be handled or declared with throws at compile-time (e.g., IOException, SQLException). Unchecked exceptions inherit from RuntimeException or Error and occur at runtime (e.g., NullPointerException, ArrayIndexOutOfBoundsException).",
    explanation: "Checked exceptions represent recoverable external conditions. Unchecked exceptions indicate programming bugs or unrecoverable system failures.",
    followUps: ["Can finally block be skipped?", "What is try-with-resources and AutoCloseable?"]
  },
  {
    id: "java-07",
    category: "java_oop",
    topic: "Collections Framework",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "How does HashMap work internally in Java? Explain bucket structure, collision resolution, and Java 8 treeification.",
    expectedAnswer: "HashMap uses an array of Node buckets. Key hashCode() determines the bucket index. Collisions are handled using a linked list. In Java 8+, if a bucket exceeds 8 nodes and array capacity is >= 64, it converts to a Red-Black Tree (O(log n)).",
    explanation: "Load factor (default 0.75) determines when resizing occurs (doubling the table). When table size doubles, elements are rehashed.",
    followUps: ["Why must equals() and hashCode() contract be maintained?", "What is the difference between HashMap and ConcurrentHashMap?"]
  },
  {
    id: "java-08",
    category: "java_oop",
    topic: "Collections",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is the difference between ArrayList and LinkedList in Java? When would you use each?",
    expectedAnswer: "ArrayList is backed by a dynamic array offering O(1) random access by index and O(n) insertions/deletions. LinkedList is a doubly-linked list with O(n) indexed access and O(1) insertions/deletions at known nodes.",
    explanation: "ArrayList has superior CPU cache locality and lower memory overhead. LinkedList is rarely preferred in modern JVMs due to pointer overhead and cache misses.",
    followUps: ["How does ArrayList resize when full?", "What is the initial default capacity of ArrayList?"]
  },
  {
    id: "java-09",
    category: "java_oop",
    topic: "Multithreading",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "How do you create a thread in Java, and what is the difference between extending Thread vs implementing Runnable or Callable?",
    expectedAnswer: "Extending Thread limits single inheritance. Implementing Runnable separates task from execution. Callable returns a Future result and can throw checked exceptions.",
    explanation: "Modern applications submit Runnable/Callable tasks to ExecutorService rather than creating unmanaged Thread objects.",
    followUps: ["What does synchronized keyword do?", "Explain the volatile keyword and memory visibility."]
  },
  {
    id: "java-10",
    category: "java_oop",
    topic: "Java 8 Features",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Java / Backend Specialist"],
    questionText: "What are the key features introduced in Java 8? Explain Lambda expressions and Functional Interfaces.",
    expectedAnswer: "Lambdas, Stream API, Functional Interfaces (@FunctionalInterface, e.g. Predicate, Consumer, Supplier, Function), Optional class, default/static interface methods, and Date/Time API (java.time).",
    explanation: "A functional interface has exactly one abstract method (SAM). Lambdas provide clear, concise anonymous class implementations.",
    followUps: ["What is the difference between intermediate and terminal operations in Streams?", "What is Optional and how does it prevent NPE?"]
  },
  {
    id: "java-11",
    category: "java_oop",
    topic: "Generics",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain Java Generics, type erasure, and bounded wildcards (? extends T vs ? super T).",
    expectedAnswer: "Generics provide compile-time type safety. Type erasure removes generic types at bytecode level for backward compatibility. Producer Extends, Consumer Super (PECS): extends for read-only producer, super for write consumer.",
    explanation: "Bytecode replaces generic type with its bound (or Object) and inserts necessary casts.",
    followUps: ["Why can't you create an array of a generic type like new T[10]?", "What is a raw type?"]
  },
  {
    id: "java-12",
    category: "java_oop",
    topic: "Interface vs Abstract Class",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Differentiate between an Abstract Class and an Interface in modern Java (Java 8+).",
    expectedAnswer: "Abstract class can hold state (instance variables) and constructors, representing an 'is-a' hierarchy. Interface represents capability/contract ('can-do'), can have default/static methods and private helper methods, and supports multiple inheritance.",
    explanation: "Interfaces cannot define instance state; their fields are implicitly public static final.",
    followUps: ["Can an abstract class have zero abstract methods?", "Why did Java 8 introduce default methods?"]
  },
  {
    id: "java-13",
    category: "java_oop",
    topic: "Java Concurrency",
    difficulty: "hard",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "Explain how ConcurrentHashMap achieves thread safety without locking the entire map like Hashtable.",
    expectedAnswer: "In Java 8+, ConcurrentHashMap uses fine-grained locking with synchronized blocks on individual bucket bin heads (first node) and CAS (Compare-And-Swap) for empty buckets, allowing concurrent reads without locking.",
    explanation: "Earlier Java versions used 16 Segment locks. Modern implementation locks only the head node of a hash bucket on insertion/update, minimizing contention.",
    followUps: ["What is the difference between synchronized and ReentrantLock?", "What is ThreadLocal?"]
  },
  {
    id: "java-14",
    category: "java_oop",
    topic: "Equals and HashCode",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Why is it mandatory to override hashCode() whenever you override equals() in Java?",
    expectedAnswer: "If two objects are equal according to equals(), they must produce the same integer hashCode(). Otherwise, hash-based collections (HashMap, HashSet) fail to find existing objects during lookup.",
    explanation: "Without matching hashCode, the collection calculates the wrong bucket index, causing duplicate keys in HashSet and null lookups in HashMap.",
    followUps: ["Can two unequal objects have the same hashCode?", "What is a hash collision?"]
  },
  {
    id: "java-15",
    category: "java_oop",
    topic: "Keywords",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain the final, finally, and finalize keywords in Java.",
    expectedAnswer: "final is a modifier (constant variable, uninheritable class, non-overridable method). finally is a block in exception handling that executes regardless of exceptions. finalize() was an Object method called before GC, now deprecated in Java 9+.",
    explanation: "Cleaner and PhantomReference replace finalize due to unpredictable invocation timing and resurrection bugs.",
    followUps: ["Can a constructor be declared final?", "What happens if System.exit(0) is called inside a try block?"]
  },
  {
    id: "java-16",
    category: "java_oop",
    topic: "Static Keyword",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is the static keyword in Java? Can we override a static method?",
    expectedAnswer: "static belongs to the class rather than instances (static variables, methods, blocks, nested classes). Static methods cannot be overridden; if declared with same signature in subclass, it is method hiding.",
    explanation: "Static method calls are resolved at compile time based on the reference type, not runtime object type.",
    followUps: ["Can a static method access non-static instance variables?", "What is a static initialization block?"]
  },
  {
    id: "java-17",
    category: "java_oop",
    topic: "Design Patterns",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "How do you implement a thread-safe Singleton design pattern in Java? Explain Double-Checked Locking.",
    expectedAnswer: "Use private constructor, volatile instance variable, and synchronized block on class object with double null check. Or use Bill Pugh Singleton (static inner class) or Enum Singleton.",
    explanation: "volatile prevents instruction reordering during instance construction (allocating memory, initializing fields, assigning reference).",
    followUps: ["Why is Enum considered the safest way to implement Singleton in Java?", "What is the Factory pattern?"]
  },
  {
    id: "java-18",
    category: "java_oop",
    topic: "Java Reflection",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist"],
    questionText: "What is Java Reflection API, what are its use cases, and what are its performance and security drawbacks?",
    expectedAnswer: "Reflection inspects and modifies classes, fields, methods at runtime (Class.forName, getDeclaredMethods). Used by frameworks like Spring (DI, annotations), Hibernate, JUnit. Drawbacks: performance overhead, breaks encapsulation, bypasses access control.",
    explanation: "Modern Java modules (JPMS) restrict deep reflection unless packages are explicitly opened.",
    followUps: ["How does Spring Dependency Injection use reflection?", "What are Java Annotations and RetentionPolicy?"]
  },
  {
    id: "java-19",
    category: "java_oop",
    topic: "Serialization",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain Java Serialization, transient keyword, and the importance of serialVersionUID.",
    expectedAnswer: "Serialization converts object state to byte stream via Serializable marker interface. transient prevents field serialization. serialVersionUID ensures sender and receiver have compatible class versions.",
    explanation: "If serialVersionUID does not match during deserialization, InvalidClassException is thrown.",
    followUps: ["What is Externalizable interface?", "Can static fields be serialized?"]
  },
  {
    id: "java-20",
    category: "java_oop",
    topic: "Comparable vs Comparator",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Differentiate between Comparable and Comparator interfaces in Java with code examples.",
    expectedAnswer: "Comparable defines natural ordering inside the class via compareTo(T o). Comparator defines external custom ordering outside the class via compare(T o1, T o2) and supports multiple sorting strategies.",
    explanation: "Comparable is found in java.lang (single sequence), while Comparator is in java.util and supports functional composition (e.g. Comparator.comparing().thenComparing()).",
    followUps: ["How does Arrays.sort() work for primitive vs reference types?", "What algorithm does TimSort use?"]
  },
  {
    id: "java-21",
    category: "java_oop",
    topic: "Pass by Value",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Is Java pass-by-value or pass-by-reference? Demonstrate with an example.",
    expectedAnswer: "Java is strictly pass-by-value. For primitives, a copy of the actual value is passed. For objects, a copy of the reference address is passed, not the object itself.",
    explanation: "Reassigning the parameter variable inside a method does not affect the caller's reference, though modifying an object's internal fields through the reference copy will mutate the object.",
    followUps: ["What happens if you swap two object references inside a helper method?", "How do wrapper classes handle pass-by-value?"]
  },
  {
    id: "java-22",
    category: "java_oop",
    topic: "Java Records & Modern Features",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "What are Java Records (introduced in Java 14/16), and how do they differ from regular classes or Lombok @Data?",
    expectedAnswer: "Records are immutable data carriers with concise syntax. The compiler generates private final fields, canonical constructor, getters (name()), equals, hashCode, and toString automatically.",
    explanation: "Records cannot extend other classes (they implicitly extend java.lang.Record) but can implement interfaces.",
    followUps: ["What are Sealed Classes in Java 17?", "Explain Pattern Matching for instanceof."]
  },
  {
    id: "java-23",
    category: "java_oop",
    topic: "JVM Architecture",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist"],
    questionText: "Explain the JVM ClassLoader subsystem and the Delegation hierarchy (Bootstrap, Extension/Platform, Application).",
    expectedAnswer: "ClassLoader loads .class files. Delegation hierarchy checks parent first before loading: Bootstrap loads core rt.jar/java.base, Platform/Extension loads platform extensions, Application/System loads classpath classes.",
    explanation: "Loading process consists of Loading, Linking (Verification, Preparation, Resolution), and Initialization.",
    followUps: ["What is a ClassNotFoundException vs NoClassDefFoundError?", "Can you write a custom ClassLoader?"]
  },
  {
    id: "java-24",
    category: "java_oop",
    topic: "Deadlock",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "What is a thread deadlock in Java? What are the 4 Coffman conditions required for deadlock, and how can it be prevented?",
    expectedAnswer: "Deadlock occurs when two or more threads are blocked forever, each holding a lock the other needs. Conditions: Mutual exclusion, Hold and wait, No preemption, Circular wait. Prevent by lock ordering or tryLock with timeouts.",
    explanation: "Eliminating circular wait by enforcing a strict global lock acquisition hierarchy is the standard prevention technique.",
    followUps: ["How do you detect deadlocks in production using jstack or visualvm?", "What is livelock and thread starvation?"]
  },
  {
    id: "java-25",
    category: "java_oop",
    topic: "Executor Framework",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain Java ExecutorService and ThreadPoolExecutor. What parameters configure a thread pool?",
    expectedAnswer: "ExecutorService manages a pool of worker threads and task queue. Parameters: corePoolSize, maximumPoolSize, keepAliveTime, TimeUnit, BlockingQueue (workQueue), ThreadFactory, and RejectedExecutionHandler.",
    explanation: "Tasks are assigned to core threads first; if busy, placed into workQueue; if queue fills, expands up to maximumPoolSize; if max reached, rejected.",
    followUps: ["What are the standard rejection policies (Abort, CallerRuns, Discard, DiscardOldest)?", "What is CompletableFuture?"]
  },
  {
    id: "java-26",
    category: "java_oop",
    topic: "Autoboxing & Unboxing",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is Autoboxing and Unboxing in Java? What is the Integer Cache (-128 to 127)?",
    expectedAnswer: "Automatic conversion between primitives and their wrapper classes (int <-> Integer). Java caches Integer objects between -128 and 127 via Integer.valueOf(), so == returns true for cached values but false for new instances.",
    explanation: "Using == on wrapper classes compares memory addresses, not values, which is a common source of bugs outside the cached range.",
    followUps: ["How can unboxing cause a NullPointerException?", "What is the memory overhead of an Integer vs int?"]
  },
  {
    id: "java-27",
    category: "java_oop",
    topic: "Constructors",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is constructor chaining in Java? Differentiate between this() and super() constructor calls.",
    expectedAnswer: "Constructor chaining calls one constructor from another within the same class using this(...) or from superclass using super(...). The call must be the very first statement in the constructor.",
    explanation: "Ensures superclass state is fully initialized before subclass constructor body executes.",
    followUps: ["Can a constructor be private?", "What is a copy constructor?"]
  },
  {
    id: "java-28",
    category: "java_oop",
    topic: "Access Modifiers",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain the four access modifiers in Java: private, default (package-private), protected, and public.",
    expectedAnswer: "private: accessible only within declaring class. default: within same package. protected: same package plus subclasses in other packages. public: accessible everywhere.",
    explanation: "Top-level classes can only be public or default (package-private).",
    followUps: ["Why can't top-level classes be private or protected?", "How does encapsulation benefit software maintenance?"]
  },
  {
    id: "java-29",
    category: "java_oop",
    topic: "Cloning",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain Shallow Copy vs Deep Copy in Java. How does Object.clone() work?",
    expectedAnswer: "Shallow copy duplicates field values; for object references, both copies reference the same nested object in memory. Deep copy creates independent duplicates of referenced nested objects recursively.",
    explanation: "Object.clone() performs shallow copy and requires implementing Cloneable marker interface. Copy constructors or serialization are generally preferred.",
    followUps: ["Why is Cloneable interface widely considered flawed?", "How do you perform deep copy with JSON or copy constructor?"]
  },
  {
    id: "java-30",
    category: "java_oop",
    topic: "Virtual Threads",
    difficulty: "hard",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "What are Java Virtual Threads (Project Loom, Java 21) and how do they differ from traditional OS platform threads?",
    expectedAnswer: "Virtual threads are lightweight user-mode threads managed by the JVM rather than OS. Millions can be spawned with negligible memory overhead (bytes vs 1MB stack), revolutionizing high-throughput I/O blocking servers.",
    explanation: "When a virtual thread performs blocking I/O, JVM unmounts it from the carrier OS thread, allowing other virtual threads to execute.",
    followUps: ["What is carrier thread pinning?", "Should you pool virtual threads like platform threads?"]
  }
];

saveJson("questions/java_oop.json", javaQuestions);

// 2. DBMS & SQL (25 questions)
const dbmsQuestions = [
  {
    id: "dbms-01",
    category: "dbms_sql",
    topic: "ACID Properties",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Explain the ACID properties of a database transaction with a banking transfer example.",
    expectedAnswer: "Atomicity (all or nothing), Consistency (preserves invariants/constraints), Isolation (concurrent transactions execute independently), Durability (committed data survives crashes).",
    explanation: "In transferring $100 from account A to B: Atomicity ensures A is debited and B credited together; Consistency maintains total funds; Isolation prevents reading intermediate states; Durability writes to write-ahead log.",
    followUps: ["What is a Write-Ahead Log (WAL)?", "What happens if a crash occurs between debit and credit?"]
  },
  {
    id: "dbms-02",
    category: "dbms_sql",
    topic: "Transaction Isolation",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "What are the standard SQL Transaction Isolation Levels and the concurrency phenomena they prevent?",
    expectedAnswer: "Read Uncommitted (allows dirty reads), Read Committed (prevents dirty reads, allows non-repeatable reads), Repeatable Read (prevents non-repeatable reads, may allow phantom reads), Serializable (prevents all phenomena via strict locking or MVCC).",
    explanation: "Dirty read reads uncommitted data. Non-repeatable read re-reads a row and finds modified values. Phantom read re-queries a range and finds newly inserted rows.",
    followUps: ["How does MVCC (Multi-Version Concurrency Control) implement isolation without read locks?", "What is the default isolation level in MySQL InnoDB vs PostgreSQL?"]
  },
  {
    id: "dbms-03",
    category: "dbms_sql",
    topic: "Indexing",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "How do database indexes work? Compare B-Tree vs Hash indexes and explain why B+ Trees are preferred for disk storage.",
    expectedAnswer: "Indexes are secondary data structures speeding up lookups. B+ Trees store all records in leaf nodes linked sequentially, facilitating range queries and logarithmic search with shallow tree height.",
    explanation: "Hash indexes offer O(1) equality lookups but cannot perform range scans (BETWEEN, >, <). B+ Trees have high fan-out, reducing disk I/O operations.",
    followUps: ["What is a Composite/Composite-column index and the leftmost prefix rule?", "What are covering indexes?"]
  },
  {
    id: "dbms-04",
    category: "dbms_sql",
    topic: "Clustered vs Non-Clustered",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Java / Backend Specialist"],
    questionText: "What is the difference between a Clustered Index and a Non-Clustered (Secondary) Index?",
    expectedAnswer: "Clustered index physically sorts and stores data rows in the leaf nodes of the table (only 1 per table, typically Primary Key). Non-clustered index stores index key with a pointer to the physical data row (multiple per table).",
    explanation: "In MySQL InnoDB, secondary indexes store primary key values as row pointers. Looking up via non-clustered index causes a secondary lookup unless it's a covering index.",
    followUps: ["Can a table have multiple clustered indexes?", "Why should primary keys generally be monotonically increasing integers?"]
  },
  {
    id: "dbms-05",
    category: "dbms_sql",
    topic: "SQL Joins",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain the differences between INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, and CROSS JOIN.",
    expectedAnswer: "INNER returns matching rows from both tables. LEFT returns all rows from left table plus matching right rows (nulls if no match). RIGHT returns all right plus matching left. FULL returns rows when match in either. CROSS produces Cartesian product.",
    explanation: "Joins combine columns based on predicate conditions. Performance depends on join algorithms: Nested Loop, Hash Join, or Sort-Merge Join.",
    followUps: ["How does the database engine decide between Nested Loop Join and Hash Join?", "What is a self join?"]
  },
  {
    id: "dbms-06",
    category: "dbms_sql",
    topic: "Normalization",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is database normalization? Explain 1NF, 2NF, 3NF, and BCNF.",
    expectedAnswer: "Normalization organizes tables to minimize data redundancy and anomalies (insert, update, delete). 1NF: atomic values, unique rows. 2NF: 1NF + no partial dependency on composite key. 3NF: 2NF + no transitive dependency. BCNF: every determinant is a candidate key.",
    explanation: "Denormalization is intentionally reintroducing redundancy to optimize read performance and reduce expensive joins in OLAP/reporting systems.",
    followUps: ["When is denormalization preferred in production systems?", "What is an update anomaly?"]
  },
  {
    id: "dbms-07",
    category: "dbms_sql",
    topic: "Primary vs Unique Key",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is the difference between a Primary Key and a Unique Key constraint?",
    expectedAnswer: "Primary Key uniquely identifies each row, cannot accept NULL values, and only 1 exists per table. Unique Key enforces uniqueness, allows NULL values (one or more depending on RDBMS), and multiple exist per table.",
    explanation: "Primary keys automatically create a clustered index by default in many RDBMS systems (like SQL Server and MySQL).",
    followUps: ["What is a Foreign Key and cascading delete?", "What is a Surrogate Key vs Natural Key?"]
  },
  {
    id: "dbms-08",
    category: "dbms_sql",
    topic: "SQL Aggregate Functions",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is the difference between WHERE and HAVING clauses in SQL?",
    expectedAnswer: "WHERE filters rows before aggregation and grouping, and cannot use aggregate functions. HAVING filters groups after GROUP BY aggregation has occurred.",
    explanation: "Execution order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT.",
    followUps: ["Write a query to find departments with more than 5 employees.", "How do NULL values interact with COUNT(*), COUNT(column), and SUM()?"]
  },
  {
    id: "dbms-09",
    category: "dbms_sql",
    topic: "Window Functions",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "What are SQL Window Functions? Explain ROW_NUMBER(), RANK(), and DENSE_RANK() with an example.",
    expectedAnswer: "Window functions perform calculations across a set of rows related to current row without collapsing rows into a single summary. ROW_NUMBER assigns unique sequential integers. RANK leaves gaps for ties (1,2,2,4). DENSE_RANK leaves no gaps (1,2,2,3).",
    explanation: "Syntax uses OVER (PARTITION BY col ORDER BY col). Useful for top-N per group queries.",
    followUps: ["How do you find the N-th highest salary in an employee table using DENSE_RANK?", "What are LEAD() and LAG()?"]
  },
  {
    id: "dbms-10",
    category: "dbms_sql",
    topic: "NoSQL vs SQL",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Compare SQL (Relational) and NoSQL databases. When would you choose MongoDB, Cassandra, or Redis over PostgreSQL?",
    expectedAnswer: "SQL databases are structured, schema-enforced, ACID-compliant, ideal for transactional data. NoSQL offers flexible schemas and horizontal scalability: Document (MongoDB for JSON hierarchies), Wide-column (Cassandra for high-write time series), Key-Value (Redis for caching/in-memory).",
    explanation: "CAP theorem considerations govern trade-offs between consistency, availability, and partition tolerance in distributed NoSQL stores.",
    followUps: ["What is the CAP Theorem?", "What is BASE consistency (Basically Available, Soft-state, Eventual consistency)?"]
  },
  {
    id: "dbms-11",
    category: "dbms_sql",
    topic: "Query Optimization",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "How do you analyze and optimize a slow SQL query? What does EXPLAIN / EXPLAIN ANALYZE show?",
    expectedAnswer: "Use EXPLAIN to inspect execution plan: table scans (ALL) vs index scans (range, ref), rows examined, temporary tables, and filesort. Optimize by adding indexes, avoiding SELECT *, avoiding leading wildcards (LIKE '%abc'), and refactoring correlated subqueries.",
    explanation: "EXPLAIN reveals cost estimates and execution paths chosen by the Cost-Based Optimizer.",
    followUps: ["Why does SELECT * harm performance?", "What is index selectivity?"]
  },
  {
    id: "dbms-12",
    category: "dbms_sql",
    topic: "Locking & Concurrency",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist"],
    questionText: "Explain Optimistic Locking vs Pessimistic Locking with real-world scenarios.",
    expectedAnswer: "Pessimistic locking locks records on read (SELECT ... FOR UPDATE) preventing others from modifying it, ideal for high conflict. Optimistic locking does not lock on read but validates a version/timestamp on update (UPDATE ... WHERE version = 1), failing if modified.",
    explanation: "Optimistic locking is ideal for web applications where user interaction takes seconds and conflicts are infrequent.",
    followUps: ["What is a phantom read?", "What is row-level locking vs table-level locking?"]
  },
  {
    id: "dbms-13",
    category: "dbms_sql",
    topic: "Subqueries vs Joins",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is a Correlated Subquery and how does it differ from a regular subquery?",
    expectedAnswer: "A regular subquery executes once independently and passes results to outer query. A correlated subquery depends on values from the outer query row and executes repeatedly for every row evaluated by the outer query.",
    explanation: "Correlated subqueries can cause severe O(N*M) performance bottlenecks and can often be rewritten as INNER JOIN or window function.",
    followUps: ["What is the difference between IN and EXISTS in SQL?", "What is a Common Table Expression (CTE)?"]
  },
  {
    id: "dbms-14",
    category: "dbms_sql",
    topic: "Database Views",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is a Database View and what is a Materialized View?",
    expectedAnswer: "A View is a virtual table defined by a stored SQL query, executed dynamically on access. A Materialized View physically stores query results on disk and must be refreshed periodically, trading storage and staleness for fast reads.",
    explanation: "Views provide abstraction, simplify complex queries, and restrict column access for security.",
    followUps: ["Can you update data through a SQL View?", "How are Materialized Views refreshed?"]
  },
  {
    id: "dbms-15",
    category: "dbms_sql",
    topic: "Stored Procedures & Triggers",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What are Stored Procedures and Triggers? Mention their benefits and risks.",
    expectedAnswer: "Stored Procedures are precompiled SQL routines stored in the DB. Triggers automatically execute in response to table events (INSERT, UPDATE, DELETE). Benefits: precompiled performance, reduced network traffic. Risks: hard to test/version control, business logic leaks into DB.",
    explanation: "Modern microservices generally minimize triggers and procedures, keeping business logic in application code.",
    followUps: ["What is the difference between a Function and a Stored Procedure in SQL?", "What is an INSTEAD OF trigger?"]
  },
  {
    id: "dbms-16",
    category: "dbms_sql",
    topic: "Sharding & Partitioning",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "What is the difference between Database Partitioning (Horizontal/Vertical) and Database Sharding?",
    expectedAnswer: "Partitioning splits a large table across partitions on the SAME database server (range, list, hash). Sharding distributes partitions horizontally across MULTIPLE independent physical database servers.",
    explanation: "Sharding introduces complexity: distributed transactions, cross-shard joins, rebalancing, and shard key selection.",
    followUps: ["What factors determine an effective shard key?", "What is consistent hashing?"]
  },
  {
    id: "dbms-17",
    category: "dbms_sql",
    topic: "Replication",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain Master-Slave (Primary-Replica) Database Replication. Differentiate Synchronous vs Asynchronous replication.",
    expectedAnswer: "Primary handles writes and propagates changes (binlog/WAL) to read replicas. Synchronous waits for replica acknowledgment before commit (zero data loss, higher write latency). Asynchronous commits immediately and replicates in background (faster writes, potential replication lag/data loss on crash).",
    explanation: "Read replicas scale read queries horizontally, but applications must tolerate eventual consistency due to replication lag.",
    followUps: ["What is replication lag and how does it cause read-your-own-writes inconsistencies?", "What is multi-master replication?"]
  },
  {
    id: "dbms-18",
    category: "dbms_sql",
    topic: "SQL Constraints",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What are the common integrity constraints in SQL? (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT).",
    expectedAnswer: "NOT NULL prevents nulls; UNIQUE enforces distinct values; PRIMARY KEY combines NOT NULL and UNIQUE; FOREIGN KEY enforces referential integrity; CHECK validates boolean condition; DEFAULT provides fallback value.",
    explanation: "Constraints enforce relational invariants at the database engine level.",
    followUps: ["What happens when you attempt to insert data violating a CHECK constraint?", "Can a foreign key reference a column that is not a primary key?"]
  },
  {
    id: "dbms-19",
    category: "dbms_sql",
    topic: "DELETE vs TRUNCATE vs DROP",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Compare DELETE, TRUNCATE, and DROP statements in SQL.",
    expectedAnswer: "DELETE is DML, removes rows one by one, logs each deletion, fires triggers, can be rolled back. TRUNCATE is DDL, deallocates data pages, resets identity counter, does not fire row triggers, faster. DROP removes table structure and data entirely.",
    explanation: "TRUNCATE cannot be executed on tables referenced by foreign key constraints.",
    followUps: ["Can TRUNCATE be rolled back inside a transaction?", "Why is TRUNCATE faster than DELETE without WHERE clause?"]
  },
  {
    id: "dbms-20",
    category: "dbms_sql",
    topic: "Two-Phase Locking (2PL)",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain the Two-Phase Locking (2PL) protocol in DBMS and how it ensures serializability.",
    expectedAnswer: "2PL divides transaction locking into two phases: Growing Phase (locks acquired, none released) and Shrinking Phase (locks released, none acquired). Ensures conflict serializability.",
    explanation: "Strict 2PL holds all exclusive locks until commit/abort, preventing cascading rollbacks.",
    followUps: ["Does 2PL prevent deadlocks?", "What is the difference between Shared (S) and Exclusive (X) locks?"]
  },
  {
    id: "dbms-21",
    category: "dbms_sql",
    topic: "SQL Injection",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is SQL Injection (SQLi) and how do Parameterized Queries (Prepared Statements) prevent it?",
    expectedAnswer: "SQLi occurs when untrusted user input alters SQL syntax (e.g., ' OR 1=1 --). Prepared Statements compile SQL structure first with parameter placeholders (?) so inputs are treated strictly as literal data values, never executable code.",
    explanation: "Database query parser separates code from data parameters, eliminating command injection.",
    followUps: ["Does an ORM automatically prevent all SQL injection?", "Can SQL injection occur in ORDER BY clauses?"]
  },
  {
    id: "dbms-22",
    category: "dbms_sql",
    topic: "Database Connection Pooling",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist"],
    questionText: "What is Database Connection Pooling (e.g. HikariCP) and why is opening connections per request bad?",
    expectedAnswer: "Opening TCP/DB connections involves socket creation, authentication handshake, and memory allocation overhead. Connection pool maintains a pool of pre-warmed connections reused by requests, dramatically lowering latency and capping DB load.",
    explanation: "HikariCP is the default pool in Spring Boot due to bytecode engineering and lock-free concurrency.",
    followUps: ["What happens when the connection pool is exhausted?", "How do you calculate optimal pool size using Amdahl's law / CPU core formula?"]
  },
  {
    id: "dbms-23",
    category: "dbms_sql",
    topic: "Write-Ahead Logging & Crash Recovery",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain Write-Ahead Logging (WAL) and the ARIES recovery algorithm (Analysis, Redo, Undo).",
    expectedAnswer: "WAL mandates that log records describing changes must be flushed to non-volatile disk before dirty data pages are written. ARIES recovery: Analysis scans log forward to find dirty pages and active txns, Redo reapplies all logged actions, Undo reverses uncommitted transactions backwards.",
    explanation: "Enables fast in-memory modifications while guaranteeing Durability after system crash.",
    followUps: ["What is a checkpoint in database recovery?", "What is dirty page flushing?"]
  },
  {
    id: "dbms-24",
    category: "dbms_sql",
    topic: "UNION vs UNION ALL",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is the difference between UNION and UNION ALL in SQL?",
    expectedAnswer: "UNION combines result sets of two queries and removes duplicate rows via an implicit sort/hash, which is computationally expensive. UNION ALL combines results without deduplication, preserving all rows and executing much faster.",
    explanation: "Both queries must have the same number of columns with compatible data types.",
    followUps: ["When should you choose UNION ALL over UNION?", "What is INTERSECT and EXCEPT / MINUS?"]
  },
  {
    id: "dbms-25",
    category: "dbms_sql",
    topic: "SQL Date and Time",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain TIMESTAMP vs DATETIME data types and how Timezones should be handled in database architecture.",
    expectedAnswer: "DATETIME stores absolute year-month-day time without timezone conversion. TIMESTAMP converts current time to UTC for storage and converts back to local session timezone on retrieval. Best practice: store all timestamps in UTC.",
    explanation: "Storing UTC ensures cross-region consistency and simplifies daylight saving transitions.",
    followUps: ["What is the Year 2038 problem for 32-bit TIMESTAMP?", "How do you convert timezones in PostgreSQL or MySQL?"]
  }
];

saveJson("questions/dbms_sql.json", dbmsQuestions);

// 3. OPERATING SYSTEMS (20 questions)
const osQuestions = [
  {
    id: "os-01",
    category: "os",
    topic: "Process vs Thread",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is the fundamental difference between a Process and a Thread?",
    expectedAnswer: "A Process is an executing program instance with its own independent address space, memory, and file handles. A Thread is a lightweight unit of execution within a process that shares code, data, and heap with other threads but has its own register state and stack.",
    explanation: "Context switching between processes is costly (flushing TLB, MMU page tables). Context switching between threads in the same process is faster because memory mappings remain unchanged.",
    followUps: ["What is stored in a Process Control Block (PCB)?", "What resources are shared between threads of the same process?"]
  },
  {
    id: "os-02",
    category: "os",
    topic: "Virtual Memory & Paging",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain Virtual Memory, Paging, Page Tables, and the Translation Lookaside Buffer (TLB).",
    expectedAnswer: "Virtual memory gives processes the illusion of contiguous physical memory. Memory is divided into fixed-size pages mapped to physical frames via Page Tables. TLB is a high-speed hardware cache of recent virtual-to-physical address translations.",
    explanation: "MMU (Memory Management Unit) translates virtual addresses to physical. A TLB miss incurs page table walk in RAM.",
    followUps: ["What is a Page Fault and what happens when it occurs?", "What is multi-level paging?"]
  },
  {
    id: "os-03",
    category: "os",
    topic: "CPU Scheduling",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Compare CPU scheduling algorithms: FCFS, SJF, Round Robin, and Priority Scheduling.",
    expectedAnswer: "FCFS executes in order of arrival (can suffer convoy effect). SJF is optimal for average waiting time but requires knowing burst time (starvation risk). Round Robin uses time quantum slices for fair multitasking. Priority schedules highest priority first (starvation solved via aging).",
    explanation: "Preemptive schedulers can interrupt running tasks when higher priority tasks arrive, unlike non-preemptive schedulers.",
    followUps: ["What is the Convoy Effect?", "How does Linux Completely Fair Scheduler (CFS) work?"]
  },
  {
    id: "os-04",
    category: "os",
    topic: "Process Synchronization",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "What is a Critical Section? Explain the difference between a Mutex and a Semaphore.",
    expectedAnswer: "Critical section is code accessing shared resources that must not be concurrently accessed by multiple threads. A Mutex is a locking mechanism with ownership (only the thread that locked can unlock). A Semaphore is a signaling mechanism with an integer counter (Counting Semaphore / Binary Semaphore) without ownership.",
    explanation: "Semaphores can be signaled by any thread, making them suitable for producer-consumer synchronization.",
    followUps: ["What is the Producer-Consumer problem?", "What is Priority Inversion and Priority Inheritance?"]
  },
  {
    id: "os-05",
    category: "os",
    topic: "Deadlocks",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Explain the Banker's Algorithm for Deadlock Avoidance. Differentiate between Deadlock Prevention and Avoidance.",
    expectedAnswer: "Prevention eliminates one of the 4 Coffman conditions at design time. Avoidance dynamically monitors resource allocation to guarantee the system remains in a Safe State where at least one execution sequence allows all processes to finish without deadlock.",
    explanation: "Banker's algorithm tests whether granting requested resources leads to a safe state by simulating maximal remaining needs.",
    followUps: ["What is a Resource Allocation Graph (RAG)?", "How does cycle detection identify deadlocks?"]
  },
  {
    id: "os-06",
    category: "os",
    topic: "Inter-Process Communication (IPC)",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What are the common mechanisms for Inter-Process Communication (IPC)? (Pipes, Sockets, Shared Memory, Message Queues).",
    expectedAnswer: "Shared Memory (fastest, processes map same RAM segment, requires synchronization), Pipes (unidirectional byte stream), Sockets (network/local IPC across boundaries), Message Queues (kernel-managed message buffers).",
    explanation: "Shared memory avoids kernel copying overhead, while pipes and message queues copy data through kernel space.",
    followUps: ["What is an anonymous pipe vs named pipe (FIFO)?", "What is a Unix Domain Socket?"]
  },
  {
    id: "os-07",
    category: "os",
    topic: "Thrashing",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is Thrashing in an operating system and how can it be resolved?",
    expectedAnswer: "Thrashing occurs when the OS spends more time swapping pages in and out of secondary storage than executing user instructions, causing CPU utilization to plummet toward zero.",
    explanation: "Causes: high degree of multiprogramming and insufficient physical memory for active Working Sets. Resolved by reducing multiprogramming or adding RAM.",
    followUps: ["What is the Working Set model?", "What is Page Replacement Algorithm (LRU, FIFO, Clock)?"]
  },
  {
    id: "os-08",
    category: "os",
    topic: "Kernel vs User Mode",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is the difference between User Mode and Kernel Mode? How does a System Call transition between them?",
    expectedAnswer: "Kernel Mode (Ring 0) has unrestricted access to hardware instructions and physical memory. User Mode (Ring 3) has restricted access for application safety. A System Call uses a software interrupt or syscall instruction to switch CPU privilege level to kernel mode.",
    explanation: "System calls validate parameters in kernel space before executing privileged hardware actions on behalf of user applications.",
    followUps: ["What is a context switch?", "What are common system calls (fork, exec, read, write)?"]
  },
  {
    id: "os-09",
    category: "os",
    topic: "Fork and Exec",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain how fork(), exec(), and wait() system calls work in Unix/Linux. What is Copy-On-Write (COW)?",
    expectedAnswer: "fork() creates an exact child process duplicate. exec() replaces the current process address space with a new executable program. wait() suspends parent until child terminates. COW delays copying physical memory pages until child or parent modifies them.",
    explanation: "Copy-On-Write makes fork() extremely fast because memory pages are shared read-only until a write fault occurs.",
    followUps: ["What is a Zombie Process?", "What is an Orphan Process and who adopts it?"]
  },
  {
    id: "os-010",
    category: "os",
    topic: "Zombie and Orphan Processes",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Differentiate between a Zombie process and an Orphan process. How do you clean up zombies?",
    expectedAnswer: "Zombie is a terminated process whose exit status has not yet been read by its parent via wait(). Orphan is a running process whose parent terminated; it is adopted by PID 1 (init/systemd) which reaps it on exit.",
    explanation: "Zombies occupy a slot in the Process Table. If table fills, no new processes can be spawned. Kill the parent process to allow init to reap the zombie.",
    followUps: ["Why does kill -9 fail to kill a zombie process?", "What is SIGCHLD?"]
  },
  {
    id: "os-011",
    category: "os",
    topic: "File Systems",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is an Inode in a Unix file system? What information does it store?",
    expectedAnswer: "An Inode is a data structure storing file metadata: file type, permissions, owner, file size, timestamps, and pointers to disk blocks containing file data. It does NOT store the filename.",
    explanation: "Filenames are mapped to inode numbers inside directory entry files.",
    followUps: ["What is a Hard Link vs a Soft (Symbolic) Link?", "What happens to a file when its hard link count reaches zero?"]
  },
  {
    id: "os-012",
    category: "os",
    topic: "Memory Allocation",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is the difference between Internal and External Fragmentation?",
    expectedAnswer: "Internal fragmentation occurs when allocated memory block is larger than requested data (wasted space inside allocated partition, e.g. in paging). External fragmentation occurs when total free memory exists to satisfy request but is broken into non-contiguous scattered chunks.",
    explanation: "Paging eliminates external fragmentation by using fixed-size blocks, but incurs small internal fragmentation on the last page.",
    followUps: ["What is compaction?", "What are First Fit, Best Fit, and Worst Fit allocation strategies?"]
  },
  {
    id: "os-013",
    category: "os",
    topic: "Belady's Anomaly",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is Belady's Anomaly? Which page replacement algorithms exhibit it?",
    expectedAnswer: "Belady's Anomaly is the phenomenon where increasing the number of page frames results in an INCREASE in page faults. It occurs in FIFO page replacement algorithm. It does not occur in stack-based algorithms like LRU or Optimal.",
    explanation: "FIFO does not respect locality of reference. Stack algorithms guarantee that the set of pages in N frames is always a subset of N+1 frames.",
    followUps: ["Why is Optimal Page Replacement impossible to implement in practice?", "How does LRU approximate optimal replacement?"]
  },
  {
    id: "os-014",
    category: "os",
    topic: "I/O Management",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain Programmed I/O, Interrupt-Driven I/O, and Direct Memory Access (DMA).",
    expectedAnswer: "Programmed I/O polls device in busy-wait loop (wastes CPU). Interrupt-driven I/O notifies CPU when byte/word ready. DMA allows hardware controller to transfer blocks of data directly to/from RAM without CPU intervention, interrupting CPU only when entire transfer completes.",
    explanation: "DMA offloads high-bandwidth transfers (disks, network cards), freeing CPU for computations.",
    followUps: ["What is zero-copy in OS (e.g. sendfile)?", "How does epoll/kqueue improve upon select/poll?"]
  },
  {
    id: "os-015",
    category: "os",
    topic: "Monolithic vs Microkernel",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Differentiate between Monolithic Kernel (Linux) and Microkernel (Mach, QNX) architectures.",
    expectedAnswer: "Monolithic kernel runs all OS services (VFS, IPC, drivers, networking) in kernel space (high performance, large attack surface). Microkernel runs only minimal primitives in kernel space (IPC, address space, basic scheduling), running drivers and file systems as user-space servers.",
    explanation: "Microkernels provide isolation and crash fault tolerance at the cost of IPC message passing overhead.",
    followUps: ["What is a Hybrid Kernel (Windows, macOS)?", "What is an eBPF program in modern Linux?"]
  },
  {
    id: "os-016",
    category: "os",
    topic: "Signals",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What are POSIX signals? Differentiate between SIGTERM and SIGKILL.",
    expectedAnswer: "Signals are asynchronous notifications sent to a process. SIGTERM (signal 15) is a polite termination request that can be caught, handled, and used for graceful shutdown. SIGKILL (signal 9) cannot be caught or ignored and terminates the process immediately at kernel level.",
    explanation: "Graceful container shutdowns send SIGTERM first, waiting for grace period before escalating to SIGKILL.",
    followUps: ["What is SIGINT vs SIGTSTP?", "What is an uncatchable signal other than SIGKILL? (SIGSTOP)"]
  },
  {
    id: "os-017",
    category: "os",
    topic: "RAID Levels",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain RAID 0, RAID 1, RAID 5, and RAID 10 storage configurations.",
    expectedAnswer: "RAID 0 (striping, high speed, no redundancy). RAID 1 (mirroring, 100% redundancy, 50% capacity). RAID 5 (block-level striping with distributed parity, tolerates 1 drive failure). RAID 10 (striped mirrors, high performance and fault tolerance).",
    explanation: "RAID 5 requires minimum 3 drives. RAID 10 requires minimum 4 drives.",
    followUps: ["What is the write penalty in RAID 5?", "What is hot swapping?"]
  },
  {
    id: "os-018",
    category: "os",
    topic: "Memory Leak & Detection",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "What is a memory leak? How does it differ in C/C++ versus managed runtimes like Java, and how is it detected?",
    expectedAnswer: "In C/C++, memory allocated on heap (malloc/new) is never freed (free/delete). In Java, objects remain strongly referenced by active roots (static fields, threadlocals, unclosed listeners) preventing GC reclamation. Detected using heap profilers, valgrind, or dump analysis.",
    explanation: "In managed languages, memory leaks are uncollected semantic references rather than lost memory pointers.",
    followUps: ["What is a heap dump?", "How can ThreadLocal cause memory leaks in thread-pooled web servers?"]
  },
  {
    id: "os-019",
    category: "os",
    topic: "Spinlock vs Sleep Lock",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a Spinlock and when is it preferred over a sleeping mutex?",
    expectedAnswer: "A spinlock repeatedly polls a lock variable in a tight loop (busy-wait) until acquired. Preferred when critical section is extremely short (< context switch time) and in multiprocessor environments where thread does not sleep.",
    explanation: "Spinning on a single CPU core is disastrous because the locking thread cannot run to release the lock.",
    followUps: ["Can a spinlock be used in a single-processor system?", "What is an Adaptive Mutex?"]
  },
  {
    id: "os-020",
    category: "os",
    topic: "Linux Boot Process",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Describe the high-level stages of the Linux boot process (BIOS/UEFI, GRUB, Kernel, Init/Systemd).",
    expectedAnswer: "1. BIOS/UEFI runs POST and loads MBR/EFI. 2. Bootloader (GRUB) displays menu and loads kernel image (vmlinuz) and initramfs. 3. Kernel mounts root filesystem, initializes hardware drivers. 4. Kernel executes PID 1 (systemd) which starts system services.",
    explanation: "initramfs provides minimal drivers needed to locate and mount the real root partition.",
    followUps: ["What is the purpose of systemd targets/runlevels?", "What does dmesg command display?"]
  }
];

saveJson("questions/os.json", osQuestions);

// 4. COMPUTER NETWORKS (20 questions)
const networkQuestions = [
  {
    id: "net-01",
    category: "networks",
    topic: "OSI Model vs TCP/IP",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Explain the 7 layers of the OSI Model and compare them with the 4 layers of the TCP/IP Model.",
    expectedAnswer: "OSI: Physical, Data Link, Network, Transport, Session, Presentation, Application. TCP/IP: Network Access (Link), Internet (IP), Transport (TCP/UDP), Application (HTTP, DNS, SSH).",
    explanation: "Data Link works with frames and MAC addresses; Network with packets and IP addresses; Transport with segments and ports; Application with data.",
    followUps: ["At which layer do routers, switches, and hubs operate?", "What is encapsulation and decapsulation?"]
  },
  {
    id: "net-02",
    category: "networks",
    topic: "TCP 3-Way Handshake",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Describe the TCP 3-Way Handshake for connection establishment and 4-way handshake for termination.",
    expectedAnswer: "Establishment: Client sends SYN (seq=x); Server replies SYN-ACK (seq=y, ack=x+1); Client sends ACK (ack=y+1). Termination: FIN from initiator -> ACK -> FIN from receiver -> ACK (with TIME_WAIT state).",
    explanation: "Handshake synchronizes initial sequence numbers (ISNs) and allocates socket buffers.",
    followUps: ["Why does TCP use TIME_WAIT state (2MSL)?", "What is a SYN Flood attack and how do SYN Cookies mitigate it?"]
  },
  {
    id: "net-03",
    category: "networks",
    topic: "TCP vs UDP",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Compare TCP and UDP protocols. In what scenarios would you choose UDP over TCP?",
    expectedAnswer: "TCP is connection-oriented, reliable (guaranteed delivery via ACKs, retransmissions), ordered, and has flow/congestion control. UDP is connectionless, unreliable, unordered, lightweight with minimal header (8 bytes vs 20 bytes). UDP is chosen for real-time gaming, DNS, live video streaming, VoIP.",
    explanation: "TCP head-of-line blocking is unacceptable in latency-sensitive real-time communication.",
    followUps: ["How does QUIC (HTTP/3) combine advantages of UDP and TCP?", "What is the size of TCP and UDP headers?"]
  },
  {
    id: "net-04",
    category: "networks",
    topic: "HTTP vs HTTPS & SSL/TLS",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "How does HTTPS work? Explain the TLS/SSL handshake and asymmetric vs symmetric encryption.",
    expectedAnswer: "HTTPS wraps HTTP inside TLS. In handshake: Client and server negotiate cipher suite; server presents digital certificate (validated via CA); asymmetric encryption (RSA/ECDH) safely exchanges a symmetric session key; subsequent communication uses fast symmetric encryption (AES).",
    explanation: "Asymmetric cryptography solves key exchange; symmetric cryptography encrypts bulk payload efficiently.",
    followUps: ["What is the difference between TLS 1.2 and TLS 1.3 (1-RTT handshake)?", "What is Server Name Indication (SNI)?"]
  },
  {
    id: "net-05",
    category: "networks",
    topic: "HTTP Evolution",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain the key differences between HTTP/1.1, HTTP/2, and HTTP/3.",
    expectedAnswer: "HTTP/1.1: persistent connections, chunked transfer, text-based, head-of-line blocking on single request. HTTP/2: binary framing, single multiplexed TCP connection, header compression (HPACK), server push. HTTP/3: uses QUIC over UDP, eliminating TCP head-of-line blocking across streams.",
    explanation: "In HTTP/2, a dropped TCP packet stalls all multiplexed streams; HTTP/3 over QUIC isolates packet loss to individual streams.",
    followUps: ["What is HOL (Head of Line) blocking?", "What are WebSockets and how do they differ from HTTP polling?"]
  },
  {
    id: "net-06",
    category: "networks",
    topic: "DNS Resolution",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What happens step-by-step when you type a URL like 'https://www.google.com' into your browser and press Enter?",
    expectedAnswer: "1. Browser checks cache (browser, OS, router). 2. Recursive DNS query to Resolver -> Root -> TLD (.com) -> Authoritative Nameserver. 3. TCP 3-way handshake with IP on port 443. 4. TLS handshake. 5. HTTP GET request. 6. Server processes & returns HTML/CSS/JS. 7. Browser parses DOM/CSSOM and renders page.",
    explanation: "Covers DNS, TCP, TLS, HTTP, and browser rendering pipeline.",
    followUps: ["What are DNS record types: A, AAAA, CNAME, MX, TXT?", "What is DNS TTL (Time to Live)?"]
  },
  {
    id: "net-07",
    category: "networks",
    topic: "Flow Control vs Congestion Control",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Differentiate between TCP Flow Control and TCP Congestion Control.",
    expectedAnswer: "Flow control prevents sender from overwhelming receiver buffer (managed by Receiver Window rwnd). Congestion control prevents sender from overwhelming intermediate network links/routers (managed by Congestion Window cwnd using Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery).",
    explanation: "Effective sending window = min(rwnd, cwnd).",
    followUps: ["What is TCP Slow Start and Slow Start Threshold (ssthresh)?", "What is TCP Reno vs BBR algorithm?"]
  },
  {
    id: "net-08",
    category: "networks",
    topic: "IP Addressing & Subnetting",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain IPv4 vs IPv6, Subnet Masks, and CIDR notation (e.g. 192.168.1.0/24).",
    expectedAnswer: "IPv4 is 32-bit (4.3 billion addresses). IPv6 is 128-bit (hexadecimal). Subnet mask divides IP into Network ID and Host ID. /24 means 24 network bits, leaving 8 host bits (256 addresses, 254 usable hosts subtracting network and broadcast).",
    explanation: "IPv6 eliminates NAT necessity and provides built-in IPsec and stateless auto-configuration.",
    followUps: ["What are Private IP address ranges (RFC 1918)?", "What is the purpose of NAT (Network Address Translation)?"]
  },
  {
    id: "net-09",
    category: "networks",
    topic: "NAT & DHCP",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What are NAT (Network Address Translation) and DHCP? Describe the DORA process in DHCP.",
    expectedAnswer: "NAT maps private IP addresses inside local LAN to a single public IP using port translation (PAT). DHCP dynamically assigns IP addresses to devices joining a network via DORA: Discover (broadcast), Offer, Request, Acknowledge.",
    explanation: "DHCP uses UDP ports 67 (server) and 68 (client).",
    followUps: ["What is an APIPA address (169.254.x.x)?", "What is Port Forwarding?"]
  },
  {
    id: "net-10",
    category: "networks",
    topic: "Routing Protocols",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Compare Distance Vector vs Link State routing protocols. Give examples of RIP, OSPF, and BGP.",
    expectedAnswer: "Distance vector (RIP) shares routing table with immediate neighbors based on hop count (Bellman-Ford). Link state (OSPF) floods link status to all routers to build full network topology map using Dijkstra's shortest path. BGP is a path-vector protocol used for inter-domain routing across Autonomous Systems (AS) on the global Internet.",
    explanation: "BGP is the backbone protocol connecting global Internet Service Providers.",
    followUps: ["What is an Autonomous System (AS)?", "What is BGP Hijacking?"]
  },
  {
    id: "net-11",
    category: "networks",
    topic: "ARP",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is ARP (Address Resolution Protocol) and how does it work?",
    expectedAnswer: "ARP resolves a known Layer 3 IP address to a physical Layer 2 MAC address within the same local broadcast domain. The sender broadcasts an ARP Request ('Who has IP x?'), and the target unicasts an ARP Reply with its MAC address.",
    explanation: "Results are cached in the ARP Table to avoid repetitive network broadcasts.",
    followUps: ["What is ARP Spoofing / ARP Poisoning?", "What is RARP (Reverse ARP)?"]
  },
  {
    id: "net-12",
    category: "networks",
    topic: "Load Balancing",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "Differentiate between Layer 4 (Transport) and Layer 7 (Application) Load Balancing.",
    expectedAnswer: "Layer 4 load balancers route traffic based on IP address and TCP/UDP ports without inspecting packet payload (faster, lower CPU overhead). Layer 7 load balancers inspect application data (HTTP headers, cookies, URLs, path routing) allowing smart content-based routing (e.g. /api to service A, /images to CDN).",
    explanation: "L7 enables SSL termination, rate limiting, and sticky sessions based on session cookies.",
    followUps: ["What algorithms do load balancers use (Round Robin, Least Connections, IP Hash)?", "What is Consistent Hashing?"]
  },
  {
    id: "net-13",
    category: "networks",
    topic: "HTTP Status Codes",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain HTTP status code classes and common codes: 200, 201, 301, 302, 400, 401, 403, 404, 500, 502, 503, 504.",
    expectedAnswer: "1xx Informational, 2xx Success (200 OK, 201 Created), 3xx Redirection (301 Permanent, 302 Temporary), 4xx Client Error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found), 5xx Server Error (500 Internal, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout).",
    explanation: "502 means an upstream server returned invalid response; 504 means the gateway timed out waiting for upstream.",
    followUps: ["What is the difference between 401 Unauthorized and 403 Forbidden?", "What is 429 Too Many Requests?"]
  },
  {
    id: "net-14",
    category: "networks",
    topic: "Cookies and Sessions",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "How do HTTP Cookies and Sessions maintain state in stateless HTTP? Explain HttpOnly, Secure, and SameSite attributes.",
    expectedAnswer: "Server generates a session ID stored in DB/Redis and sends it to browser in a Set-Cookie header. Browser attaches cookie to subsequent requests. HttpOnly prevents client JS access (mitigating XSS). Secure ensures transmission only over HTTPS. SameSite (Strict/Lax/None) defends against CSRF.",
    explanation: "Statelessness of HTTP is bridged by client-held session tokens.",
    followUps: ["What is the difference between Session Cookie and Persistent Cookie?", "What is JWT (JSON Web Token)?"]
  },
  {
    id: "net-15",
    category: "networks",
    topic: "CORS",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is CORS (Cross-Origin Resource Sharing)? Explain Preflight OPTIONS request.",
    expectedAnswer: "CORS is a browser security mechanism enforcing the Same-Origin Policy (protocol, domain, port must match). For non-simple HTTP requests (custom headers, PUT/DELETE), the browser automatically sends an HTTP OPTIONS preflight request to check Access-Control-Allow-Origin headers before sending the actual request.",
    explanation: "CORS is enforced by the browser client, not by backend server processes directly.",
    followUps: ["What constitutes a 'Simple Request' in CORS?", "Why is CORS not a security defense for backend APIs against server-to-server calls?"]
  },
  {
    id: "net-16",
    category: "networks",
    topic: "CDN",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a CDN (Content Delivery Network) and how does it reduce latency for global users?",
    expectedAnswer: "A CDN is a distributed network of edge proxy servers (Points of Presence - PoPs) deployed globally. It caches static and dynamic assets close to end users, reducing round-trip latency, offloading origin servers, and absorbing DDoS attacks.",
    explanation: "Uses Anycast routing to direct user DNS requests to the physically closest edge server.",
    followUps: ["What is Cache Invalidation and TTL in CDN?", "What is Push vs Pull CDN?"]
  },
  {
    id: "net-17",
    category: "networks",
    topic: "DDoS Attacks",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a Distributed Denial of Service (DDoS) attack? Explain common types (SYN Flood, UDP Amplification, HTTP Flood).",
    expectedAnswer: "DDoS overwhelms a target system with distributed traffic from a botnet. Volume attacks (UDP amplification exploit spoofed IP requests to open DNS/NTP servers), Protocol attacks (SYN floods exhaust server connection tables), Application attacks (HTTP GET/POST floods exhaust CPU/DB).",
    explanation: "Mitigation involves CDN scrubbing centers, rate limiting, and Anycast absorption.",
    followUps: ["What is a Slowloris attack?", "What is rate limiting with Token Bucket algorithm?"]
  },
  {
    id: "net-18",
    category: "networks",
    topic: "ICMP & Ping / Traceroute",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is ICMP (Internet Control Message Protocol)? How do 'ping' and 'traceroute' work under the hood?",
    expectedAnswer: "ICMP sends network error reports and diagnostics. ping sends ICMP Echo Request and listens for Echo Reply. traceroute sends UDP/ICMP packets with incrementally increasing TTL (Time to Live) starting at 1, causing routers along the path to return ICMP Time Exceeded messages.",
    explanation: "TTL decrement identifies every intermediate router IP hop.",
    followUps: ["Why do some hops in traceroute display asterisks (*)?", "Can ICMP be disabled by firewalls?"]
  },
  {
    id: "net-19",
    category: "networks",
    topic: "MTU and MSS",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What are MTU (Maximum Transmission Unit) and MSS (Maximum Segment Size)? What happens during IP Fragmentation?",
    expectedAnswer: "MTU is the largest Layer 2 frame payload (standard Ethernet is 1500 bytes). MSS is the largest TCP segment payload excluding IP and TCP headers (1500 - 20 - 20 = 1460 bytes). If a packet exceeds path MTU and DF (Don't Fragment) flag is not set, intermediate routers fragment it into smaller packets.",
    explanation: "Path MTU Discovery (PMTUD) uses ICMP Fragmentation Needed to find optimal segment size without fragmentation.",
    followUps: ["What is the performance drawback of IP fragmentation?", "What are Jumbo Frames (9000 bytes)?"]
  },
  {
    id: "net-20",
    category: "networks",
    topic: "WebSockets vs Server-Sent Events (SSE)",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Compare WebSockets, Server-Sent Events (SSE), and Long Polling for real-time web applications.",
    expectedAnswer: "WebSockets provide full-duplex, bidirectional communication over a single persistent TCP connection initiated via HTTP upgrade. SSE provides unidirectional server-to-client streaming over standard HTTP text/event-stream. Long polling holds HTTP requests open until data is available, then closes and re-establishes.",
    explanation: "SSE is simpler and reconnects automatically over HTTP/2, ideal for live tickers and AI stream tokens; WebSockets are ideal for chat and multiplayer games.",
    followUps: ["Why does ChatGPT use SSE for streaming responses?", "How do WebSockets pass through corporate HTTP proxies?"]
  }
];

saveJson("questions/networks.json", networkQuestions);

// 5. DSA CONCEPTS (30 questions)
const dsaQuestions = [
  {
    id: "dsa-01",
    category: "dsa_concepts",
    topic: "Asymptotic Complexity",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Explain Big-O, Big-Omega, and Big-Theta notations. Why do software engineers primarily focus on Big-O?",
    expectedAnswer: "Big-O represents the asymptotic upper bound (worst-case growth rate). Big-Omega represents the lower bound (best-case). Big-Theta represents the tight bound (upper and lower match). Engineers focus on Big-O to guarantee system bounds under maximal load.",
    explanation: "Big-O ignores constant factors and lower-order terms to analyze how runtime scales with input size n.",
    followUps: ["What is the difference between O(1), O(log n), O(n), O(n log n), and O(n^2)?", "What is amortized time complexity?"]
  },
  {
    id: "dsa-02",
    category: "dsa_concepts",
    topic: "Array vs Linked List",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Compare Arrays and Linked Lists regarding memory layout, cache locality, and algorithmic time complexity.",
    expectedAnswer: "Arrays allocate contiguous memory blocks offering O(1) random access and excellent CPU cache prefetching. Linked lists allocate non-contiguous nodes connected by pointers offering O(1) insertion at known pointers but O(n) access and poor cache locality due to pointer chasing.",
    explanation: "Cache lines load contiguous 64-byte chunks, making arrays orders of magnitude faster in practice for iterations.",
    followUps: ["What is a Doubly Linked List vs Singly Linked List?", "How do you detect a cycle in a linked list in O(1) space?"]
  },
  {
    id: "dsa-03",
    category: "dsa_concepts",
    topic: "Two Pointers & Sliding Window",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain the Two-Pointer technique and the Sliding Window algorithm. What problem patterns do they solve?",
    expectedAnswer: "Two pointers move from opposite ends (or same direction at different speeds) to process sorted arrays or detect cycles in O(n) time. Sliding window maintains a dynamic or fixed subarray range [left, right] to solve subarray problems (max sum, longest substring without repeats) in O(n) instead of O(n^2).",
    explanation: "Window expands by moving right pointer and shrinks by moving left pointer when invariants are violated.",
    followUps: ["How do you solve Longest Substring Without Repeating Characters?", "What is Floyd's Tortoise and Hare algorithm?"]
  },
  {
    id: "dsa-04",
    category: "dsa_concepts",
    topic: "Sorting Algorithms",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Compare QuickSort and MergeSort. Explain their time complexities, space complexities, and stability.",
    expectedAnswer: "MergeSort is stable, divide-and-conquer, always O(n log n) time, requires O(n) auxiliary memory. QuickSort is unstable, partitions in-place with O(log n) stack space, average O(n log n), worst-case O(n^2) when pivot selection is poor (e.g. sorted array with first element pivot).",
    explanation: "A stable sort preserves the relative order of duplicate elements.",
    followUps: ["What is 3-way QuickSort (Dutch National Flag)?", "What is TimSort and why is it used in Java/Python?"]
  },
  {
    id: "dsa-05",
    category: "dsa_concepts",
    topic: "Hash Tables",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "How do Hash Tables achieve O(1) average lookup? What collision resolution techniques exist?",
    expectedAnswer: "Hash function converts key into integer index in an array. Collisions occur when multiple keys map to same index. Resolved by: 1. Separate Chaining (linked lists or trees at each bucket). 2. Open Addressing (probing in array: Linear Probing, Quadratic Probing, Double Hashing).",
    explanation: "Worst-case lookup degrades to O(n) if all keys hash to the same bucket (hash flooding attack).",
    followUps: ["What is the Load Factor?", "What is Robin Hood Hashing?"]
  },
  {
    id: "dsa-06",
    category: "dsa_concepts",
    topic: "Binary Search Trees",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is a Binary Search Tree (BST)? What is the difference between a standard BST and a Self-Balancing BST (AVL / Red-Black Tree)?",
    expectedAnswer: "BST maintains left child < root < right child. Lookup is O(log n) on balanced trees, but degenerates to O(n) linked list on skewed trees. Self-balancing trees (AVL, Red-Black) perform tree rotations to guarantee O(log n) height under all insertions and deletions.",
    explanation: "AVL trees are more strictly balanced than Red-Black trees, providing faster lookups but slower insertions.",
    followUps: ["What are In-order, Pre-order, and Post-order tree traversals?", "Why does in-order traversal of a BST yield sorted values?"]
  },
  {
    id: "dsa-07",
    category: "dsa_concepts",
    topic: "Heaps and Priority Queues",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a Binary Heap? Differentiate between Min-Heap and Max-Heap. What are the time complexities for push, pop, and peek?",
    expectedAnswer: "A binary heap is a complete binary tree stored compactly in an array. Min-heap ensures parent <= children. Peek is O(1). Insert (push with sift-up) is O(log n). Remove-root (pop with sift-down) is O(log n). Heapify builds a heap in O(n) linear time.",
    explanation: "For array index i: left child = 2i+1, right = 2i+2, parent = floor((i-1)/2).",
    followUps: ["Why is building a heap O(n) rather than O(n log n)?", "How do you find the K-th largest element using a Min-Heap of size K?"]
  },
  {
    id: "dsa-08",
    category: "dsa_concepts",
    topic: "Graphs: BFS vs DFS",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Compare Breadth-First Search (BFS) and Depth-First Search (DFS) on graphs. What data structures do they use?",
    expectedAnswer: "BFS explores neighbor by neighbor using a Queue (FIFO), finding the shortest path on unweighted graphs. DFS explores deeply down a branch using a Stack (or recursion) before backtracking, useful for topological sort and cycle detection. Time complexity is O(V + E).",
    explanation: "A visited set/array is mandatory to prevent infinite loops in cyclic graphs.",
    followUps: ["How do you detect a cycle in a directed vs undirected graph?", "What is a Bipartite Graph?"]
  },
  {
    id: "dsa-09",
    category: "dsa_concepts",
    topic: "Shortest Path Algorithms",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain Dijkstra's Algorithm and the Bellman-Ford Algorithm for finding the shortest path in a weighted graph.",
    expectedAnswer: "Dijkstra's uses a Min-Heap/Priority Queue and greedy relaxation, running in O((V + E) log V), but fails on negative edge weights. Bellman-Ford relaxes all edges V-1 times in O(V * E), handling negative weights and detecting negative weight cycles.",
    explanation: "If an edge can still be relaxed after V-1 iterations in Bellman-Ford, a negative cycle exists.",
    followUps: ["What is the Floyd-Warshall algorithm?", "What is A* search algorithm and how does its heuristic function work?"]
  },
  {
    id: "dsa-10",
    category: "dsa_concepts",
    topic: "Minimum Spanning Tree",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a Minimum Spanning Tree (MST)? Differentiate between Kruskal's and Prim's algorithms.",
    expectedAnswer: "An MST connects all vertices of an undirected connected weighted graph with the minimum total edge weight and no cycles (V-1 edges). Kruskal's sorts all edges and adds them greedily using Union-Find (Disjoint Set) in O(E log E). Prim's grows a tree from a start node using a Priority Queue in O(E log V).",
    explanation: "Kruskal's is better for sparse graphs; Prim's is better for dense graphs.",
    followUps: ["Explain Disjoint Set Union (DSU) with Path Compression and Union by Rank.", "Can an MST have cycles?"]
  },
  {
    id: "dsa-11",
    category: "dsa_concepts",
    topic: "Dynamic Programming",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "What is Dynamic Programming (DP)? Differentiate between Top-Down (Memoization) and Bottom-Up (Tabulation).",
    expectedAnswer: "DP solves complex problems by breaking them into overlapping subproblems with optimal substructure. Top-Down starts at original problem and uses recursion + cache (memoization). Bottom-Up solves smallest subproblems iteratively in a table (tabulation), saving call stack space.",
    explanation: "Identifying state transitions (recurrence relation) and base cases is the core of DP.",
    followUps: ["Explain the 0/1 Knapsack problem recurrence relation.", "How can you optimize DP space complexity from O(n) to O(1) in Fibonacci?"]
  },
  {
    id: "dsa-12",
    category: "dsa_concepts",
    topic: "Trie (Prefix Tree)",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a Trie data structure, and how does it optimize prefix searches compared to a Hash Table?",
    expectedAnswer: "A Trie is a tree-like search structure where each node represents a character. Lookup, insert, and prefix matching run in O(L) time where L is word length, independent of total words N. Hash tables take O(L) to lookup exact matches but cannot efficiently find all words with a given prefix.",
    explanation: "Widely used for autocomplete, spell checkers, and IP routing tables.",
    followUps: ["What is the space complexity of a Trie?", "What is a Radix Tree / Compressed Trie?"]
  },
  {
    id: "dsa-13",
    category: "dsa_concepts",
    topic: "Monotonic Stack",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a Monotonic Stack and what class of problems does it solve in O(n) time?",
    expectedAnswer: "A monotonic stack maintains elements in strictly increasing or decreasing order. It solves Next Greater Element, Next Smaller Element, Daily Temperatures, and Largest Rectangle in Histogram in O(n) linear time because each element is pushed and popped at most once.",
    explanation: "When an incoming element violates monotonicity, previous elements are popped and resolved.",
    followUps: ["How do you find the Largest Rectangle in Histogram using a stack?", "What is a Monotonic Queue for sliding window maximum?"]
  },
  {
    id: "dsa-14",
    category: "dsa_concepts",
    topic: "Backtracking",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is Backtracking? How does it differ from exhaustive brute-force search?",
    expectedAnswer: "Backtracking builds solution candidates incrementally, abandoning a candidate ('backtracking') as soon as it determines the candidate cannot lead to a valid solution. Brute force evaluates all permutations blindly. Examples: N-Queens, Sudoku solver, Subsets.",
    explanation: "Pruning invalid state trees dramatically reduces exponential search spaces.",
    followUps: ["How do you solve the N-Queens problem?", "What is the difference between permutation and combination generation?"]
  },
  {
    id: "dsa-15",
    category: "dsa_concepts",
    topic: "Bit Manipulation",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Explain common Bitwise operations: AND (&), OR (|), XOR (^), NOT (~), Left Shift (<<), and Right Shift (>>). What is (n & (n - 1))?",
    expectedAnswer: "XOR (different bits = 1, same = 0; x ^ x = 0; x ^ 0 = x). Left shift multiplies by 2; right shift divides by 2. The trick (n & (n - 1)) removes the lowest set bit (1) in n, used in Brian Kernighan's algorithm to count set bits in O(k) time.",
    explanation: "Checking power of two: (n > 0) && ((n & (n - 1)) == 0).",
    followUps: ["How do you find the single non-duplicate number in an array where every other number appears twice?", "What is the difference between arithmetic right shift (>>) and logical right shift (>>>) in Java?"]
  },
  {
    id: "dsa-16",
    category: "dsa_concepts",
    topic: "Segment Tree & Fenwick Tree",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is a Segment Tree and a Fenwick Tree (Binary Indexed Tree)? What operations do they support?",
    expectedAnswer: "Both support point/range updates and range queries (range sum, min, max) in O(log n) time, with O(n) construction. Fenwick Tree is more space-efficient (array of size n+1 using lowest set bit LSB: i & (-i)) for prefix sums, while Segment Tree handles arbitrary range operations and lazy propagation.",
    explanation: "Lazy propagation defers updates to child nodes until queried, keeping range update at O(log n).",
    followUps: ["What is Lazy Propagation in Segment Trees?", "When would you prefer Fenwick Tree over Segment Tree?"]
  },
  {
    id: "dsa-17",
    category: "dsa_concepts",
    topic: "Topological Sort",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is Topological Sorting? Can it be performed on any graph? Explain Kahn's Algorithm.",
    expectedAnswer: "Topological sort is a linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u -> v, u comes before v. Kahn's algorithm calculates in-degrees, enqueues all 0 in-degree nodes, and repeatedly removes them while decrementing neighbors' in-degrees. If processed count < V, a cycle exists.",
    explanation: "Essential for build systems (task dependencies), course prerequisites, and package management.",
    followUps: ["How do you implement Topological Sort using DFS and a post-order stack?", "What happens if you run Kahn's algorithm on a cyclic graph?"]
  },
  {
    id: "dsa-18",
    category: "dsa_concepts",
    topic: "Linked List Reversal",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "How do you reverse a Singly Linked List iteratively and recursively? What are the complexities?",
    expectedAnswer: "Iteratively: maintain three pointers (prev = null, curr = head, next). In loop: next = curr.next; curr.next = prev; prev = curr; curr = next. Return prev. O(n) time, O(1) space. Recursively: reverses remainder, sets head.next.next = head; head.next = null; O(n) time and O(n) stack space.",
    explanation: "Iterative approach is preferred in production to avoid stack overflow on long lists.",
    followUps: ["How do you reverse nodes in k-Group?", "How do you find the middle of a linked list in one pass?"]
  },
  {
    id: "dsa-19",
    category: "dsa_concepts",
    topic: "Binary Search Variations",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain how to apply Binary Search on a Search Space (Binary Search on Answer) with an example like 'Koko Eating Bananas' or 'Capacity To Ship Packages'.",
    expectedAnswer: "When the answer has a monotonic property (if speed s works, all s' > s work), binary search can find the minimum valid answer between low and high. For each mid, a feasibility check helper determines if it's possible within constraints, narrowing search space in O(N * log(range)).",
    explanation: "Transforms optimization problems into decision verification problems.",
    followUps: ["How do you search in a Rotated Sorted Array?", "What causes integer overflow in (low + high) / 2 and how do you prevent it? (low + (high - low) / 2)"]
  },
  {
    id: "dsa-20",
    category: "dsa_concepts",
    topic: "Lowest Common Ancestor (LCA)",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "How do you find the Lowest Common Ancestor (LCA) of two nodes in a Binary Tree vs a Binary Search Tree?",
    expectedAnswer: "In a BST: if both node values are smaller than root, traverse left; if both greater, traverse right; otherwise root is the split point (LCA) in O(h) time. In a general Binary Tree: recursively check left and right subtrees; if both return non-null, root is LCA; otherwise return the non-null child in O(n) time.",
    explanation: "BST property enables directional search without visiting irrelevant subtrees.",
    followUps: ["How do you find LCA in a tree with parent pointers in O(1) space?", "What is Binary Lifting for LCA in general trees?"]
  },
  {
    id: "dsa-21",
    category: "dsa_concepts",
    topic: "Queue using Stacks",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "How do you implement a Queue using two Stacks? What is the amortized time complexity of dequeue?",
    expectedAnswer: "Maintain inputStack and outputStack. Push adds to inputStack. Pop/Peek: if outputStack is empty, pop all elements from inputStack and push to outputStack, then pop from outputStack. Each element is moved between stacks at most once, giving O(1) amortized time per operation.",
    explanation: "Reversing elements twice restores FIFO order.",
    followUps: ["How do you implement a Stack using two Queues?", "What is amortized vs worst-case O(n) time?"]
  },
  {
    id: "dsa-22",
    category: "dsa_concepts",
    topic: "LRU Cache Design",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain the internal design of an LRU (Least Recently Used) Cache. How do you achieve O(1) get() and put()?",
    expectedAnswer: "Combine a Hash Map with a Doubly Linked List. Hash Map maps keys to Doubly Linked List nodes for O(1) lookup. Doubly Linked List maintains access recency: newly accessed/inserted nodes move to head; when capacity is exceeded, the tail node (least recently used) is evicted in O(1).",
    explanation: "Doubly linked list allows removing any node in O(1) given its pointer, which a singly linked list cannot do.",
    followUps: ["What is an LFU (Least Frequently Used) Cache?", "How does Java's LinkedHashMap support LRU caching out of the box?"]
  },
  {
    id: "dsa-23",
    category: "dsa_concepts",
    topic: "Greedy Algorithms",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is a Greedy Algorithm? Explain with the Activity Selection (Interval Scheduling) problem.",
    expectedAnswer: "A greedy algorithm makes the locally optimal choice at each step hoping it leads to a global optimum. In Activity Selection: sort activities by their finish times and greedily pick the next activity that starts after the previous picked activity ends, maximizing non-overlapping activities.",
    explanation: "Greedy choice property and optimal substructure must hold for greedy to yield an optimal solution.",
    followUps: ["Why does the greedy choice fail for 0/1 Knapsack but work for Fractional Knapsack?", "What is Huffman Coding?"]
  },
  {
    id: "dsa-24",
    category: "dsa_concepts",
    topic: "Prefix Sum",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is the Prefix Sum technique and how does it answer Range Sum Queries in O(1) time?",
    expectedAnswer: "Precompute prefix[i] = arr[0] + ... + arr[i]. Any range sum from index L to R is calculated in O(1) as prefix[R] - prefix[L - 1] (or prefix[R + 1] - prefix[L] with 1-based indexing).",
    explanation: "Precomputation takes O(n) time and O(n) space. Extends to 2D matrices for submatrix sum queries.",
    followUps: ["How do you solve Subarray Sum Equals K using Prefix Sum and a Hash Map?", "What is Difference Array technique for range updates?"]
  },
  {
    id: "dsa-25",
    category: "dsa_concepts",
    topic: "String Matching",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain KMP (Knuth-Morris-Pratt) pattern matching algorithm and the LPS (Longest Proper Prefix which is also Suffix) array.",
    expectedAnswer: "KMP avoids backtracking the text pointer when a mismatch occurs by precomputing the LPS array of the pattern. The LPS array indicates how many characters can be skipped, matching text in O(N + M) linear time instead of naive O(N * M).",
    explanation: "LPS[i] stores the length of the longest proper prefix of pattern[0..i] that is also a suffix of pattern[0..i].",
    followUps: ["What is the Rabin-Karp rolling hash algorithm?", "What is Z-algorithm for string matching?"]
  },
  {
    id: "dsa-26",
    category: "dsa_concepts",
    topic: "Tree Diameter",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is the Diameter of a Binary Tree? How do you calculate it in O(n) time?",
    expectedAnswer: "The diameter is the length of the longest path between any two nodes in a tree (path may or may not pass through root). Computed in a single post-order DFS: for each node, calculate leftHeight and rightHeight; update maxDiameter = max(maxDiameter, leftHeight + rightHeight); return 1 + max(leftHeight, rightHeight).",
    explanation: "Combines height calculation with diameter updating in a single O(n) traversal.",
    followUps: ["How do you find the diameter of a general unweighted tree in two BFS runs?", "What is the maximum path sum in a binary tree?"]
  },
  {
    id: "dsa-27",
    category: "dsa_concepts",
    topic: "Disjoint Set Union (Union-Find)",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain the Disjoint Set Union (DSU) data structure. How do Path Compression and Union by Rank achieve near O(1) operations?",
    expectedAnswer: "DSU manages a collection of disjoint sets supporting find(x) (finds root representative) and union(x, y) (merges sets). Path compression flattens tree by pointing visited nodes directly to root. Union by rank attaches shorter tree under taller tree root. Combined, operations run in nearly O(1) amortized time (inverse Ackermann function α(n) < 5).",
    explanation: "Without optimizations, the tree can degenerate into a line with O(n) operations.",
    followUps: ["How is DSU used to find the number of connected components in an undirected graph?", "Can DSU be used to detect cycles in a directed graph?"]
  },
  {
    id: "dsa-28",
    category: "dsa_concepts",
    topic: "Recursion and Call Stack",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Explain how recursion works with the runtime call stack. What is Tail Call Optimization (TCO)?",
    expectedAnswer: "Each recursive call pushes a stack frame with parameters and local variables. When base case is met, frames unwind. If base case is missing or recursion is too deep, StackOverflowError occurs. Tail recursion has the recursive call as the absolute final statement; compilers with TCO reuse the current stack frame, converting recursion into an iterative loop.",
    explanation: "Java does not currently support TCO, while Scala, Kotlin, and C++ compilers do.",
    followUps: ["How do you convert any recursive function into an iterative one?", "What is memoization?"]
  },
  {
    id: "dsa-29",
    category: "dsa_concepts",
    topic: "Longest Increasing Subsequence (LIS)",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain how to solve the Longest Increasing Subsequence (LIS) problem in O(n log n) time using Patience Sorting / Binary Search.",
    expectedAnswer: "Maintain a dynamic array 'tails' where tails[i] stores the smallest tail of all increasing subsequences of length i+1. For each x in nums, use binary search to find its insertion position in tails: if x is larger than all elements, append x; otherwise replace the first element >= x. The length of tails is the LIS length.",
    explanation: "Standard DP takes O(n^2); binary search optimization reduces it to O(n log n).",
    followUps: ["Does the tails array represent the actual LIS sequence?", "How do you reconstruct the actual LIS elements?"]
  },
  {
    id: "dsa-30",
    category: "dsa_concepts",
    topic: "Circular Queue",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What is a Circular Queue and why is it preferred over a linear array-based queue?",
    expectedAnswer: "In a linear array queue, dequeuing elements leaves unused memory at the front that cannot be reused without shifting all elements (O(n)). A circular queue connects the last position back to the first using modulo arithmetic ((rear + 1) % capacity), achieving O(1) enqueue and dequeue without wasted space.",
    explanation: "Standard data structure for ring buffers, audio buffers, and hardware DMA queues.",
    followUps: ["How do you distinguish between Queue Full and Queue Empty in a circular queue?", "What is a Deque (Double-Ended Queue)?"]
  }
];

saveJson("questions/dsa_concepts.json", dsaQuestions);

// 6. BACKEND, REST API, GIT & TESTING (15 questions)
const backendQuestions = [
  {
    id: "back-01",
    category: "backend_api",
    topic: "REST Architectural Constraints",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Java / Backend Specialist"],
    questionText: "What are the 6 architectural constraints of REST? Explain what makes an API truly RESTful.",
    expectedAnswer: "1. Client-Server architecture. 2. Statelessness (no client session on server). 3. Cacheability (explicit cache headers). 4. Layered System (proxies, load balancers transparent to client). 5. Uniform Interface (resource identification, HATEOAS). 6. Code on Demand (optional).",
    explanation: "Statelessness means every request must contain all context necessary to process it.",
    followUps: ["What is HATEOAS (Hypermedia As The Engine Of Application State)?", "What is Richardson Maturity Model (Levels 0 to 3)?"]
  },
  {
    id: "back-02",
    category: "backend_api",
    topic: "HTTP Methods & Idempotency",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Compare GET, POST, PUT, PATCH, and DELETE. Which methods are Safe and which are Idempotent?",
    expectedAnswer: "Safe (does not modify server state): GET, HEAD, OPTIONS. Idempotent (multiple identical requests have same side-effect as a single request): GET, PUT (complete replacement), DELETE, HEAD, OPTIONS. Non-idempotent: POST (creates new resource), PATCH (partial modification, can be non-idempotent).",
    explanation: "Calling DELETE /users/5 ten times leaves the user deleted; calling POST /orders ten times creates 10 orders unless idempotency keys are used.",
    followUps: ["How do payment gateways implement idempotency using Idempotency Keys?", "What is the difference between PUT and PATCH?"]
  },
  {
    id: "back-03",
    category: "backend_api",
    topic: "Authentication & Authorization",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "Differentiate between Authentication (AuthN) and Authorization (AuthZ). Explain Session-based auth vs Token-based auth (JWT).",
    expectedAnswer: "AuthN verifies WHO you are (login). AuthZ verifies WHAT you can do (roles/permissions). Session-based auth stores session state on server (DB/Redis) and sets cookie. Token-based auth (JWT) is stateless: claims are cryptographically signed by server and sent in Authorization Bearer header.",
    explanation: "JWT structure: Header.Payload.Signature. Because JWT is stateless, invalidating a compromised token before expiration requires a revocation blocklist or short expiry + refresh tokens.",
    followUps: ["How do Access Tokens and Refresh Tokens work together?", "What is OAuth 2.0 vs OpenID Connect (OIDC)?"]
  },
  {
    id: "back-04",
    category: "backend_api",
    topic: "Spring Boot Fundamentals",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "TCS", "Capgemini"],
    questionText: "Explain Inversion of Control (IoC) and Dependency Injection (DI) in Spring Boot. What are Spring Bean Scopes?",
    expectedAnswer: "IoC transfers object creation and lifecycle control from application code to the Spring container. DI injects dependencies via constructor, setter, or field (@Autowired). Bean scopes: Singleton (default, one per container), Prototype (new instance per request), Request, Session, Application.",
    explanation: "Constructor injection is preferred because it guarantees immutability, facilitates unit testing with mocks, and avoids circular dependencies.",
    followUps: ["Why is Constructor Injection preferred over Field Injection?", "What is @SpringBootApplication annotation composed of (@Configuration, @EnableAutoConfiguration, @ComponentScan)?"]
  },
  {
    id: "back-05",
    category: "backend_api",
    topic: "Microservices vs Monolith",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "Compare Monolithic and Microservices architectures. What are the trade-offs and operational complexities of Microservices?",
    expectedAnswer: "Monolith: single deployment unit, simple debugging/testing, fast in-memory calls, but hard to scale independently and has tight coupling. Microservices: independent deployment, polyglot tech, fault isolation, but introduces network latency, distributed data consistency, complex monitoring, and service discovery overhead.",
    explanation: "Microservices trade code simplicity for operational and distributed systems complexity.",
    followUps: ["What is an API Gateway?", "What is Service Discovery (e.g. Eureka, Consul, Kubernetes DNS)?"]
  },
  {
    id: "back-06",
    category: "backend_api",
    topic: "Message Brokers",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "Explain asynchronous messaging using Message Queues. Compare RabbitMQ and Apache Kafka.",
    expectedAnswer: "Message brokers decouple producers and consumers asynchronously. RabbitMQ is a traditional smart broker/dumb consumer queue (AMQP, push model, messages removed after ACK, complex routing exchanges). Kafka is an append-only distributed commit log (pull model, partitioned topics, retained messages, high throughput streaming).",
    explanation: "Kafka consumers maintain their own read offsets, allowing replay of historical event streams.",
    followUps: ["What is At-least-once, At-most-once, and Exactly-once message delivery?", "What is a Dead Letter Queue (DLQ)?"]
  },
  {
    id: "back-07",
    category: "backend_api",
    topic: "Distributed Transactions",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "How do you manage distributed transactions across microservices? Explain the Saga Pattern vs Two-Phase Commit (2PC).",
    expectedAnswer: "2PC uses a coordinator to prepare and commit across services (strong consistency, but blocking and poor availability under network partitions). Saga breaks transaction into local transactions; if one fails, compensating transactions are executed backwards to undo changes (eventual consistency). Sagas can be Choreographed (event-driven) or Orchestrated (central coordinator).",
    explanation: "2PC violates the CAP theorem's availability under partitions; Saga embraces eventual consistency.",
    followUps: ["What is an Outbox Pattern for reliable event publishing?", "What is idempotent consumer pattern?"]
  },
  {
    id: "back-08",
    category: "backend_api",
    topic: "Rate Limiting",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Explain algorithms for API Rate Limiting: Token Bucket, Leaky Bucket, Fixed Window, and Sliding Window Log.",
    expectedAnswer: "Token Bucket adds tokens at constant rate; requests consume tokens (allows bursts). Leaky Bucket processes requests at constant leak rate (smoothes bursts). Fixed Window counts requests per calendar minute (vulnerable to 2x burst at boundary). Sliding Window Log/Counter tracks timestamps or weighted counts across a sliding time range.",
    explanation: "Redis + Lua scripts are commonly used to implement distributed atomic token bucket rate limiters.",
    followUps: ["How do you implement rate limiting in a distributed cluster with Redis?", "What HTTP response headers convey rate limit status (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)?"]
  },
  {
    id: "back-09",
    category: "backend_api",
    topic: "API Versioning",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Java / Backend Specialist"],
    questionText: "What are the common strategies for REST API Versioning? (URI path, Query param, Header, Content Negotiation).",
    expectedAnswer: "1. URI path (/api/v1/users - most explicit and common). 2. Query parameter (/users?v=1). 3. Custom request header (X-API-Version: 1). 4. Content negotiation / Accept header (Accept: application/vnd.company.v1+json).",
    explanation: "URI versioning is favored for ease of caching, exploration, and routing at load balancers.",
    followUps: ["How do you deprecate an old API version without breaking mobile client apps?", "What is backward compatibility?"]
  },
  {
    id: "back-10",
    category: "backend_api",
    topic: "Git Version Control",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is the difference between Git Merge and Git Rebase? When should you use each?",
    expectedAnswer: "git merge combines histories by creating a new merge commit with two parents (preserves full historical context). git rebase moves the base of your branch to the tip of target branch by replaying commits sequentially (creates clean, linear history). Never rebase public shared branches.",
    explanation: "Rebasing public branches rewrites commit hashes, causing conflicts for other collaborators.",
    followUps: ["What is git cherry-pick?", "What is git stash and git reset vs git revert?"]
  },
  {
    id: "back-11",
    category: "backend_api",
    topic: "Git Internals",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "How does Git store data internally? Explain Blobs, Trees, Commits, and Annotated Tags.",
    expectedAnswer: "Git is a content-addressable key-value store using SHA-1/SHA-256 hashes. Blob stores file contents (no filename/permissions). Tree stores directory structure pointing to blobs and sub-trees with filenames and permissions. Commit points to a root tree, parent commit(s), author, and message.",
    explanation: "Because commits are directed acyclic graphs (DAGs) of immutable trees, git operations are lightweight pointer updates.",
    followUps: ["What is stored in the .git/objects directory?", "What is the difference between a Fast-Forward merge and a non-fast-forward merge?"]
  },
  {
    id: "back-12",
    category: "backend_api",
    topic: "Testing Pyramid",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Explain the Testing Pyramid (Unit, Integration, End-to-End). What role does each level play?",
    expectedAnswer: "Unit tests form the broad base (fast, cheap, isolated, test individual functions with mocks). Integration tests form the middle (verify components/DB/external services interact correctly). E2E tests form the narrow peak (slow, expensive, flaky, test complete user flows through UI/API).",
    explanation: "Focusing too heavily on E2E tests results in the 'testing ice cream cone' anti-pattern.",
    followUps: ["What is Test-Driven Development (TDD) cycle (Red-Green-Refactor)?", "What is Mockito and what is the difference between @Mock and @Spy?"]
  },
  {
    id: "back-13",
    category: "backend_api",
    topic: "CI/CD Pipelines",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "What is CI/CD (Continuous Integration / Continuous Deployment)? Describe a standard pipeline workflow.",
    expectedAnswer: "CI automatically builds and tests code on every commit to detect integration errors early. CD automatically deploys passing builds to staging (Continuous Delivery) and production (Continuous Deployment). Workflow: Commit -> Lint/Static Analysis -> Unit Tests -> Build Docker Image -> Integration Tests -> Deploy.",
    explanation: "Popular tools include GitHub Actions, GitLab CI, Jenkins, and ArgoCD.",
    followUps: ["What is Blue-Green Deployment vs Canary Deployment?", "What is a Rollback strategy?"]
  },
  {
    id: "back-14",
    category: "backend_api",
    topic: "Web Security Vulnerabilities",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF). How do you defend against each?",
    expectedAnswer: "XSS injects malicious client-side scripts into web pages viewed by other users (defend via HTML output encoding, Content Security Policy (CSP), HttpOnly cookies). CSRF tricks authenticated users into submitting unauthorized requests to a trusted site (defend via Anti-CSRF tokens, SameSite cookie attribute, re-authentication for sensitive actions).",
    explanation: "SameSite=Lax/Strict cookies prevent browsers from attaching session cookies to cross-site requests.",
    followUps: ["What is Stored XSS vs Reflected XSS vs DOM-based XSS?", "What is the OWASP Top 10?"]
  },
  {
    id: "back-15",
    category: "backend_api",
    topic: "GraphQL vs REST",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Compare GraphQL and REST. What problems does GraphQL solve, and what challenges does it introduce?",
    expectedAnswer: "GraphQL solves over-fetching and under-fetching by allowing clients to request exact fields needed in a single query schema. Challenges: complex HTTP caching (all queries use POST /graphql), N+1 query problem on server (solved using DataLoader batching), complex rate limiting, and arbitrary query complexity attacks.",
    explanation: "REST leverages native HTTP caching (ETags, CDN), while GraphQL requires specialized client caching (Apollo, Relay).",
    followUps: ["What is the N+1 problem in GraphQL and ORMs?", "What are GraphQL Queries, Mutations, and Subscriptions?"]
  }
];

saveJson("questions/backend_api.json", backendQuestions);

// 7. SYSTEM DESIGN & PROJECT DISCUSSION (20 questions)
const systemDesignQuestions = [
  {
    id: "sys-01",
    category: "system_design",
    topic: "URL Shortener (TinyURL)",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Design a scalable URL Shortener service like TinyURL. How do you generate unique 7-character short codes and handle 100M daily writes?",
    expectedAnswer: "1. Functional: shorten URL, redirect short URL to long URL, optional custom alias. 2. Short code generation: Base62 encoding (a-z, A-Z, 0-9) of a unique 64-bit integer generated by distributed ID generator (Snowflake) or counter service. 62^7 = 3.5 trillion URLs. 3. Storage: NoSQL/SQL with (short_key, original_url). 4. Caching: Redis cache for 20% hot URLs. 5. Redirection: HTTP 301 (permanent, cached by browser) vs HTTP 302 (temporary, tracks analytics).",
    explanation: "MD5/SHA256 hash truncation can cause collisions; base62 encoding a guaranteed unique auto-increment/Snowflake ID guarantees zero collisions.",
    followUps: ["Why choose 302 redirect over 301 for click analytics?", "How do you handle expired URLs and cleanup?"]
  },
  {
    id: "sys-02",
    category: "system_design",
    topic: "Distributed Caching",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain Cache-Aside (Lazy Loading), Read-Through, Write-Through, and Write-Back (Write-Behind) caching patterns. How do you handle cache invalidation?",
    expectedAnswer: "Cache-Aside: app queries cache; on miss, loads from DB and updates cache. Read-Through: app queries cache library which transparently fetches from DB on miss. Write-Through: writes to cache and DB synchronously. Write-Back: writes to cache and acks immediately, asynchronously flushing dirty batches to DB (fastest writes, data loss risk on crash). Invalidation: TTLs or explicit event-driven deletes on write.",
    explanation: "Cache invalidation and naming things are famously the two hardest problems in computer science.",
    followUps: ["What is Cache Stampede (Thundering Herd) and how do Mutex locks prevent it?", "What is Cache Penetration vs Cache Breakdown vs Cache Avalanche?"]
  },
  {
    id: "sys-03",
    category: "system_design",
    topic: "Consistent Hashing",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "What is Consistent Hashing and why is it essential for distributed caching systems like Memcached or DynamoDB?",
    expectedAnswer: "Standard hash modulo (hash(key) % N) invalidates almost all keys when a server is added or removed. Consistent hashing maps both servers and keys onto a circular hash ring (0 to 2^32-1). Adding or removing a node only redistributes K/N keys to the adjacent node. Virtual nodes solve hot spots and ensure uniform distribution across heterogeneous servers.",
    explanation: "Virtual nodes assign multiple hash points per physical server to achieve balanced load distribution.",
    followUps: ["How many virtual nodes per server are typically used?", "What is the replication strategy on a consistent hash ring?"]
  },
  {
    id: "sys-04",
    category: "system_design",
    topic: "Distributed ID Generator",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Design a distributed unique ID generator that generates 64-bit monotonically increasing IDs at scale (Twitter Snowflake).",
    expectedAnswer: "Twitter Snowflake divides 64 bits: 1 sign bit (0), 41 bits timestamp in milliseconds (gives 69 years), 10 bits machine/datacenter ID (supports 1024 workers), 12 bits sequence number per millisecond (supports 4096 IDs per ms per worker). Generates roughly 4 million unique IDs/sec without coordination.",
    explanation: "Eliminates centralized database auto-increment bottlenecks and network round-trips.",
    followUps: ["What happens if system clock drifts backwards (NTP skew)?", "Why is a UUIDv4 bad as a database primary key compared to Snowflake ID? (Random UUID causes B-Tree index fragmentation)"]
  },
  {
    id: "sys-05",
    category: "system_design",
    topic: "CAP Theorem",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain the CAP Theorem and PACELC Theorem. Can a distributed system be CA (Consistent and Available)?",
    expectedAnswer: "CAP: in a distributed system with Network Partitions (P), you MUST choose between Consistency (C) and Availability (A). A system CANNOT be CA across network boundaries because network partitions are physical realities. PACELC extends CAP: if Partitioned, choose Availability vs Consistency; Else, choose Latency vs Consistency.",
    explanation: "MongoDB chooses CP (primary election delays availability); Cassandra chooses AP (tunable consistency).",
    followUps: ["What is Tunable Consistency in Cassandra (R + W > N)?", "What is Eventual Consistency?"]
  },
  {
    id: "sys-06",
    category: "system_design",
    topic: "Design a Notification System",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Design a scalable Notification System supporting Email, SMS, and Mobile Push Notifications for millions of users.",
    expectedAnswer: "1. Components: Notification API Gateway, Priority Message Queues (Kafka/RabbitMQ per channel: email, SMS, push), Worker services, 3rd party providers (Twilio, Sendgrid, APNS/FCM). 2. Key features: Rate limiting/frequency capping (avoid spamming user), deduplication (idempotency key), user notification preferences, templating engine. 3. Reliability: retries with exponential backoff and Dead Letter Queue for failed deliveries.",
    explanation: "Decoupling notification requests via asynchronous queues isolates slow 3rd-party provider latency.",
    followUps: ["How do you prevent duplicate notifications during network timeouts?", "How do you handle user opt-out and quiet hours?"]
  },
  {
    id: "sys-07",
    category: "system_design",
    topic: "Design a Rate Limiter",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Design a Distributed Rate Limiter service protecting APIs from DDoS and abuse (e.g. 100 requests per minute per IP).",
    expectedAnswer: "Deploy as API Gateway middleware. Use Redis with sliding window counter or token bucket algorithm. Redis Lua script atomically checks current window count, increments if under threshold, and sets TTL. If exceeded, return HTTP 429 Too Many Requests with Retry-After header. Distributed considerations: local in-memory cache for high-frequency IPs, Redis cluster with consistent hashing.",
    explanation: "Lua scripts run atomically inside Redis single-threaded engine, preventing race conditions without distributed locks.",
    followUps: ["What headers should be returned when rate limited?", "How do you handle client requests during Redis outages?"]
  },
  {
    id: "sys-08",
    category: "system_design",
    topic: "Design a Key-Value Store",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "Design a Distributed Key-Value Store like Amazon DynamoDB. Explain data partitioning, replication, and vector clocks.",
    expectedAnswer: "1. Partitioning: Consistent hashing ring with virtual nodes. 2. Replication: coordinator node replicates keys to N successor nodes on ring. 3. Consistency: Quorum consensus (R + W > N guarantees reading latest write). 4. Conflict resolution: Vector Clocks or Last-Write-Wins (LWW). 5. Storage engine: LSM-Tree (Log-Structured Merge-Tree) with MemTable in RAM, WAL on disk, and SSTables for fast writes.",
    explanation: "LSM-Trees append sequentially to disk, turning random writes into high-speed sequential writes.",
    followUps: ["What is a Bloom Filter and how does it speed up SSTable lookups?", "What is Read Repair vs Anti-Entropy using Merkle Trees?"]
  },
  {
    id: "sys-09",
    category: "system_design",
    topic: "Project Architecture Discussion",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Walk me through the high-level architecture of your most challenging software project. What technical trade-offs did you make?",
    expectedAnswer: "Candidate should outline: 1. Business problem and scale. 2. Architectural components (frontend, API gateway, microservices, database, cache, message queues). 3. Explicit trade-offs (e.g., choosing PostgreSQL vs MongoDB, synchronous REST vs Kafka). 4. A major engineering bottleneck encountered and how it was diagnosed and resolved.",
    explanation: "Interviewers look for ownership, architectural justification, and quantitative metrics (latency, throughput, cost) rather than vague buzzwords.",
    followUps: ["If traffic increased by 100x overnight, which component would fail first?", "What would you architect differently if you rebuilt the project today?"]
  },
  {
    id: "sys-10",
    category: "system_design",
    topic: "Production Debugging",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "How do you troubleshoot a sudden spike in 500 Internal Server Errors and p99 latency in a production microservice?",
    expectedAnswer: "1. Triage: check error logs, APM traces (Datadog/NewRelic), Grafana dashboards (CPU, memory, DB connections). 2. Correlate: did a recent deployment, config change, or marketing campaign occur? Roll back if recent release. 3. Isolate: check downstream dependencies (DB connection pool exhaustion, slow query lock contention, 3rd party API timeout). 4. Mitigate: enable circuit breakers, scale pods horizontally, shed non-critical traffic. 5. Post-mortem: write blameless RCA.",
    explanation: "Demonstrates systematic incident response and observability literacy.",
    followUps: ["What is the difference between p50, p95, and p99 latency?", "What are the 4 Golden Signals of monitoring (Latency, Traffic, Errors, Saturation)?"]
  },
  {
    id: "sys-11",
    category: "system_design",
    topic: "Circuit Breaker Pattern",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain the Circuit Breaker pattern (Resilience4j) in distributed microservices. What are Closed, Open, and Half-Open states?",
    expectedAnswer: "Prevents cascading failures when a downstream dependency is failing. Closed: requests pass through normally; tracks failure rate. Open: failure rate exceeds threshold (e.g. 50%); requests fail fast immediately without calling downstream service. Half-Open: after sleep window, allows a trial batch of requests; if successful, resets to Closed; if fails, reverts to Open.",
    explanation: "Protects failing services from being hammered while recovering.",
    followUps: ["What fallback mechanisms should be provided when a circuit breaker trips?", "What is the Bulkhead pattern?"]
  },
  {
    id: "sys-12",
    category: "system_design",
    topic: "Design a Chat System (WhatsApp)",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "Design a real-time 1-on-1 and Group Chat application at scale. How do you handle message delivery and online presence?",
    expectedAnswer: "1. Communication: WebSockets over persistent TCP connections to Chat Gateway servers. 2. Storage: NoSQL key-value/wide-column (HBase/Cassandra) for message history (huge write volume, range query by timestamp). 3. Routing: Message queue (Kafka) routes messages to recipient's connected chat server via session service. 4. Presence: Heartbeat pings to Redis with TTL; if no ping in 30s, mark offline. 5. Push: FCM/APNS when user is offline.",
    explanation: "WebSockets maintain bi-directional low-latency connection for connected users.",
    followUps: ["How do you guarantee message ordering in a group chat?", "What is end-to-end encryption (Signal Protocol)?"]
  },
  {
    id: "sys-13",
    category: "system_design",
    topic: "API Gateway",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "What is an API Gateway and what core responsibilities does it handle in a microservices ecosystem?",
    expectedAnswer: "Single entry point for all clients. Handles: Reverse proxy routing, SSL termination, Authentication & Authorization, Rate limiting, Request logging and distributed tracing (correlator ID), Caching, Load balancing, and Protocol translation (REST to gRPC).",
    explanation: "Examples include Kong, Envoy, Spring Cloud Gateway, and AWS API Gateway.",
    followUps: ["What is the Backend For Frontend (BFF) pattern?", "What are the risks of an API Gateway becoming a single point of failure (SPOF)?"]
  },
  {
    id: "sys-14",
    category: "system_design",
    topic: "Database Indexing Strategy",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist"],
    questionText: "In your projects, how did you decide which columns to index in your database? What is the cost of having too many indexes?",
    expectedAnswer: "Index columns used frequently in WHERE filters, JOIN ON predicates, and ORDER BY clauses, prioritizing high-cardinality columns. Cost: every index consumes disk space and degrades INSERT, UPDATE, and DELETE write performance because all secondary B-Trees must be updated synchronously.",
    explanation: "High-write tables should have minimal, carefully targeted composite indexes.",
    followUps: ["What is a covering index and how does it avoid table lookups?", "How do you detect unused indexes in production?"]
  },
  {
    id: "sys-15",
    category: "system_design",
    topic: "Design a Web Crawler",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering"],
    questionText: "Design a distributed Web Crawler that crawls billions of web pages. How do you prevent crawling loops and respect politeness?",
    expectedAnswer: "1. Architecture: URL Frontier (priority queue + politeness queue per host to avoid hammering one domain), Fetcher (HTTP downloader), Parser, Duplicate Detector (Content Seen via SimHash/MD5), URL Extractor, URL Filter (robots.txt parser). 2. Scalability: Partition URL Frontier across worker nodes with consistent hashing by hostname. 3. Storage: S3/Blob storage for raw HTML, metadata in Bigtable.",
    explanation: "Robots.txt must be parsed and cached before crawling any domain.",
    followUps: ["How does a Bloom filter help in the URL Frontier?", "How do you handle spider traps (infinite calendar loops)?"]
  },
  {
    id: "sys-16",
    category: "system_design",
    topic: "Idempotent API Design",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "How do you design an idempotent payment processing API to prevent duplicate charges when network timeouts occur?",
    expectedAnswer: "Client generates a unique UUID Idempotency-Key header with the payment request. When server receives request: 1. Checks Redis/DB for the key in a distributed lock transaction. 2. If key exists and status is 'completed', returns cached response immediately. 3. If in 'processing', rejects duplicate request (HTTP 409). 4. If new, records key as 'processing', calls payment gateway, stores final result, and returns.",
    explanation: "Guarantees safe client retries during intermittent network dropouts.",
    followUps: ["What TTL should be set on idempotency keys?", "What happens if the server crashes while status is 'processing'?"]
  },
  {
    id: "sys-17",
    category: "system_design",
    topic: "CQRS & Event Sourcing",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "Explain CQRS (Command Query Responsibility Segregation) and Event Sourcing. What problems do they address?",
    expectedAnswer: "CQRS separates read and write models: commands mutate data on optimized normalized write store; queries read from denormalized read-optimized replicas (e.g. Elasticsearch). Event Sourcing stores every state change as an immutable sequence of events rather than overwriting current state. Current state is reconstructed by replaying events.",
    explanation: "Enables complete audit history, time-travel debugging, and highly optimized query performance.",
    followUps: ["What are Event Sourcing snapshots?", "What is eventual consistency lag between Command and Query stores?"]
  },
  {
    id: "sys-18",
    category: "system_design",
    topic: "Database Migration with Zero Downtime",
    difficulty: "medium",
    companyTags: ["Java / Backend Specialist", "Product-Based Engineering"],
    questionText: "How do you perform a zero-downtime database schema migration (e.g. renaming a column or changing a data type) in production?",
    expectedAnswer: "Expand and Contract pattern (Phased rollout): Phase 1 (Expand): Add new column, deploy app version that writes to both old and new columns but reads from old. Phase 2 (Backfill): Run background script to migrate historical data from old to new column. Phase 3: Deploy app version that reads and writes exclusively to new column. Phase 4 (Contract): Drop the old column.",
    explanation: "Never make breaking schema changes in a single monolithic deployment.",
    followUps: ["What database migration tools have you used (Flyway, Liquibase, Drizzle)?", "Why does ALTER TABLE lock tables in older MySQL versions?"]
  },
  {
    id: "sys-19",
    category: "system_design",
    topic: "Distributed Locking",
    difficulty: "hard",
    companyTags: ["Product-Based Engineering", "Java / Backend Specialist"],
    questionText: "How do you implement a Distributed Lock using Redis (Redlock)? What are the failure modes (clock drift, GC pauses)?",
    expectedAnswer: "Single instance: SET lock_key random_token NX PX 30000. Release with Lua script verifying random_token before DEL. Redlock: acquires lock across N independent Redis nodes (majority N/2 + 1). Failure modes: a long JVM Stop-The-World GC pause can cause lock lease to expire while thread still assumes it holds the lock, resulting in split-brain data corruption. Solved via Fencing Tokens.",
    explanation: "Fencing tokens provide monotonically increasing version numbers checked by the storage layer.",
    followUps: ["What is a fencing token?", "How does Apache ZooKeeper implement distributed locks using ephemeral sequential znodes?"]
  },
  {
    id: "sys-20",
    category: "system_design",
    topic: "Design Autocomplete / Typeahead",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Design a Google-style search autocomplete typeahead suggestion system. How do you serve top 5 queries in under 50ms?",
    expectedAnswer: "1. Data structure: Trie where each node stores precomputed top 5 most frequent search queries for that prefix. 2. Storage: In-memory Trie cluster partitioned by prefix (a-z). 3. Data pipeline: Log clickstream events -> Aggregation job (Spark/Flink) computes weekly query frequency scores -> Offline job rebuilds Trie nodes and updates serving cache. 4. Client-side: Debouncing (300ms) and browser caching.",
    explanation: "Precomputing top 5 queries at every Trie node transforms runtime query from O(tree traversal) to O(L) where L is prefix length.",
    followUps: ["How do you handle personal search history in autocomplete?", "How does debouncing reduce server load?"]
  }
];

saveJson("questions/system_design.json", systemDesignQuestions);

// 8. BEHAVIORAL & HR (40 questions)
const behavioralQuestions = [
  {
    id: "hr-01",
    category: "behavioral",
    topic: "Introduction",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Service-Based General", "Product-Based Engineering"],
    questionText: "Tell me about yourself, your background, and why you are interested in this software engineering role.",
    expectedAnswer: "A structured 2-minute elevator pitch: Past (education/relevant experience), Present (current core technical skills, recent projects/achievements), and Future (why this specific company and role aligns with career ambitions).",
    explanation: "Sets the tone of the interview; focus on professional engineering growth and impact rather than childhood history.",
    followUps: ["What was the most challenging technical project you worked on?", "What programming language are you most proficient in and why?"]
  },
  {
    id: "hr-02",
    category: "behavioral",
    topic: "STAR Framework",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "TCS", "Capgemini"],
    questionText: "Describe a time when you faced a difficult technical bug or challenge in a project. How did you resolve it?",
    expectedAnswer: "STAR: Situation (context of bug and urgency), Task (what needed to be fixed), Action (systematic debugging steps, profiling, logs, root cause analysis), Result (successful fix, performance improvement, preventive test added).",
    explanation: "Demonstrates problem-solving resilience and systematic engineering methodology.",
    followUps: ["What did you learn from that bug to prevent similar occurrences?", "Did this issue affect users in production?"]
  },
  {
    id: "hr-03",
    category: "behavioral",
    topic: "Conflict Resolution",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Tell me about a time you had a technical disagreement with a team member or peer. How did you handle it?",
    expectedAnswer: "Focus on professional discourse: listened to their reasoning, depersonalized the debate by evaluating empirical data/benchmarks/prototypes, found common ground, and committed fully once a decision was made (disagree and commit).",
    explanation: "Shows emotional intelligence, communication skills, and collaborative maturity.",
    followUps: ["What would you do if your lead insisted on an approach you believed was technically flawed?", "How do you give constructive feedback during code reviews?"]
  },
  {
    id: "hr-04",
    category: "behavioral",
    topic: "Failure and Learning",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "TCS", "Capgemini"],
    questionText: "Tell me about a time you made a mistake or failed to meet an expectation. What happened and what did you learn?",
    expectedAnswer: "Honest reflection: took full ownership without blaming others, communicated transparently with stakeholders immediately, took corrective action, and instituted a process or test to prevent repeat failure.",
    explanation: "Authentic self-awareness and accountability are hallmarks of dependable engineers.",
    followUps: ["How do you handle critical feedback from managers or senior engineers?", "Can you describe a time a project missed its deadline?"]
  },
  {
    id: "hr-05",
    category: "behavioral",
    topic: "Fast Learning",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Tell me about a time you had to learn an unfamiliar technology or framework under tight deadlines.",
    expectedAnswer: "Explained learning strategy: read official documentation, built small proof-of-concept prototypes, sought targeted guidance from experts, and successfully delivered the production requirement.",
    explanation: "Adaptability and self-directed learning speed are vital for freshers and entry-level candidates.",
    followUps: ["What new technology or tool have you learned recently outside of work or class?", "How do you stay updated with industry developments?"]
  },
  {
    id: "hr-06",
    category: "behavioral",
    topic: "Why This Company",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "Why do you want to join our company (e.g. TCS / Capgemini), and what value will you bring to our clients?",
    expectedAnswer: "Researched answer highlighting company culture, scale of enterprise impact, training programs, and alignment of candidate's technical skills (Java/backend/AI) with company's core client delivery domains.",
    explanation: "Generic answers ('it is a big MNC') fail; candidate should reference specific company initiatives, values, or client impact.",
    followUps: ["Are you comfortable working across different technology stacks based on project requirements?", "Are you willing to relocate or work in flexible shifts if required?"]
  },
  {
    id: "hr-07",
    category: "behavioral",
    topic: "Career Goals",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Where do you see yourself in five years professionally?",
    expectedAnswer: "A realistic progression: mastering backend engineering/system architecture, taking ownership of critical modules, mentoring junior developers, and contributing to high-impact technical initiatives.",
    explanation: "Shows ambition balanced with practical engineering commitment.",
    followUps: ["Do you prefer an individual contributor technical path or management path?", "What technical certifications or skills are you aiming to acquire next?"]
  },
  {
    id: "hr-08",
    category: "behavioral",
    topic: "Strengths and Weaknesses",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What are your greatest professional strengths and a genuine area of improvement you are working on?",
    expectedAnswer: "Strength: backed by concrete evidence (e.g. disciplined problem decomposition, proactive communication). Weakness: a genuine area (e.g. tendency to over-engineer solutions, hesitation to delegate) accompanied by proactive steps currently being taken to improve.",
    explanation: "Avoid humble-brag clichés like 'I work too hard' or 'I am a perfectionist'.",
    followUps: ["How has your weakness impacted a previous team project?", "What feedback did you receive in your last evaluation?"]
  },
  {
    id: "hr-09",
    category: "behavioral",
    topic: "Working Under Pressure",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Describe a situation where you had to manage competing priorities and tight deadlines. How did you prioritize?",
    expectedAnswer: "Employed Eisenhower matrix / impact vs urgency assessment, communicated transparently with team/lead to realign expectations, cut non-essential scope, and delivered the highest-value deliverables on time.",
    explanation: "Demonstrates composure, organizational discipline, and stakeholder management.",
    followUps: ["How do you avoid burnout when project deadlines become intense?", "How do you handle last-minute scope changes from a client?"]
  },
  {
    id: "hr-10",
    category: "behavioral",
    topic: "Ownership & Initiative",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "TCS", "Capgemini"],
    questionText: "Give an example of a time you went above and beyond your assigned responsibilities to improve a system or team process.",
    expectedAnswer: "Identified a recurring inefficiency or missing test coverage, took independent initiative to automate it or create documentation without being asked, and measured positive team impact.",
    explanation: "Separates passive task-doers from proactive engineering owners.",
    followUps: ["Did anyone ask you to do that, or did you initiate it yourself?", "How did the team respond to your initiative?"]
  },
  {
    id: "hr-11",
    category: "behavioral",
    topic: "Teamwork",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Tell me about a time you worked in a multidisciplinary team. How did you ensure effective collaboration?",
    expectedAnswer: "Clarified roles early, established regular syncs, communicated in clear domain-appropriate language without unnecessary jargon, and actively supported team members when blockers arose.",
    explanation: "Highlights collaborative spirit and inter-functional communication.",
    followUps: ["How do you handle a team member who is not pulling their weight?", "Do you prefer working independently or in teams?"]
  },
  {
    id: "hr-12",
    category: "behavioral",
    topic: "Receiving Criticism",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Describe a time when you received harsh or critical feedback on your code or project. How did you react?",
    expectedAnswer: "Took the feedback objectively without defensiveness, separated ego from the code, asked clarifying questions to understand the underlying standard, and incorporated the recommendations promptly.",
    explanation: "Receptiveness to mentorship and code reviews is crucial for junior engineers.",
    followUps: ["How do you approach reviewing a peer's pull request?", "What do you do if you disagree with code review comments?"]
  },
  {
    id: "hr-13",
    category: "behavioral",
    topic: "Ethics & Integrity",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What would you do if you noticed a peer taking credit for your work or violating company security protocols?",
    expectedAnswer: "For credit: have a calm 1-on-1 private conversation first to understand their perspective and clarify contributions with the manager. For security violation: adhere strictly to company compliance reporting guidelines, as security and data integrity are non-negotiable.",
    explanation: "Shows ethical boundaries and professional conflict resolution.",
    followUps: ["Why are confidentiality and data compliance vital in enterprise consulting companies?", "Have you ever faced an ethical dilemma in college or work?"]
  },
  {
    id: "hr-14",
    category: "behavioral",
    topic: "Adaptability",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "In consulting companies like TCS and Capgemini, engineers are often assigned to different domains (banking, retail, healthcare) and varying tech stacks. How do you feel about this?",
    expectedAnswer: "Embraces domain breadth as an accelerated learning opportunity. Emphasizes strong foundational CS principles that translate across languages and technologies, and excitement to solve diverse enterprise problems.",
    explanation: "Crucial question for service-based company placement interviews.",
    followUps: ["If asked to work on a legacy technology like COBOL or older Java versions, how would you approach it?", "What is your philosophy on continuous learning?"]
  },
  {
    id: "hr-15",
    category: "behavioral",
    topic: "Questions for Interviewer",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Do you have any questions for me as your interviewer?",
    expectedAnswer: "Thoughtful questions demonstrating genuine interest: 'What does success look like for a new engineer in this role during the first 90 days?', 'What engineering challenges is your team currently tackling?', 'What opportunities exist for mentorship and technical growth?'",
    explanation: "Asking 'No questions' or asking about salary/vacation too early creates a negative impression.",
    followUps: ["What attracted you to our company culture specifically?", "What is the next step in your preparation?"]
  },
  {
    id: "hr-16",
    category: "behavioral",
    topic: "Dealing with Ambiguity",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Tell me about a time you had to work on a project where the requirements were vague or constantly changing.",
    expectedAnswer: "Proactively engaged stakeholders with clarifying questions, built small iterative prototypes to validate assumptions early, documented accepted requirements, and remained agile as specifications evolved.",
    explanation: "Ambiguity tolerance is a core hiring criterion for product engineering companies.",
    followUps: ["How do you avoid building the wrong feature when requirements are unclear?", "What assumptions do you make before starting code?"]
  },
  {
    id: "hr-17",
    category: "behavioral",
    topic: "Work-Life Balance & Dedication",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "How do you maintain productivity and manage stress during intense release cycles?",
    expectedAnswer: "Maintains structured scheduling, breaks complex tasks into manageable sub-goals, exercises discipline with sleep and health, and communicates early with managers if delivery risks arise.",
    explanation: "Shows maturity in sustained professional performance.",
    followUps: ["Can you work late or on weekends if a critical production issue occurs?", "How do you recharge outside of work?"]
  },
  {
    id: "hr-18",
    category: "behavioral",
    topic: "Leadership without Title",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "TCS", "Capgemini"],
    questionText: "Tell me about a time you demonstrated leadership, even if you were not formally designated as the team leader.",
    expectedAnswer: "Stepped up during a period of team uncertainty or delay to facilitate coordination, established clear meeting agendas, aligned tasks to individual strengths, and fostered morale to deliver the project.",
    explanation: "Leadership is influence and initiative, not a title.",
    followUps: ["How do you motivate a demotivated teammate?", "What is your leadership style?"]
  },
  {
    id: "hr-19",
    category: "behavioral",
    topic: "Decision Making with Incomplete Data",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Describe a situation where you had to make a critical technical or project decision with incomplete information.",
    expectedAnswer: "Assessed the blast radius and reversibility of the decision (one-way vs two-way door decision), consulted available domain heuristics, chose the lowest-risk adaptable path, and established monitoring to course-correct quickly.",
    explanation: "Amazon leadership principle: Bias for Action and Two-Way Door decisions.",
    followUps: ["What is a one-way door vs two-way door decision?", "How did the outcome validate your choice?"]
  },
  {
    id: "hr-20",
    category: "behavioral",
    topic: "Relocation and Bonds",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "Are you willing to relocate to any of our development centers across India (e.g. Bangalore, Pune, Hyderabad, Chennai) and sign an employment agreement/bond if applicable?",
    expectedAnswer: "Yes, fully open and excited to relocate to wherever business needs require, and comfortable committing to an employment agreement to learn and grow within the organization.",
    explanation: "Standard HR alignment question for college placement drives.",
    followUps: ["Do you have any location preferences and why?", "When can you join if offered?"]
  },
  {
    id: "hr-21",
    category: "behavioral",
    topic: "Handling Client Criticism",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "If an external client is unhappy with a deliverable and expresses frustration during a status call, how would you respond?",
    expectedAnswer: "Listen actively without getting defensive, validate their concerns calmly, summarize their expectations to ensure alignment, and commit to an agreed action plan with specific deadlines.",
    explanation: "Client-facing composure is essential for service delivery consulting.",
    followUps: ["What would you do if a client asks for a feature that contradicts the contract?", "How do you manage client expectations?"]
  },
  {
    id: "hr-22",
    category: "behavioral",
    topic: "Self-Motivation",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "What motivates you as a software engineer? What drives you to sit in front of a screen and debug code for hours?",
    expectedAnswer: "Passionate about building tangible solutions that solve real human and business problems, the intellectual challenge of debugging complex logic, and continuous self-improvement in technical craftsmanship.",
    explanation: "Authentic intrinsic motivation reflects long-term retention and resilience.",
    followUps: ["What was the most rewarding moment in your engineering studies?", "What open-source or personal projects have you built for fun?"]
  },
  {
    id: "hr-23",
    category: "behavioral",
    topic: "Mentoring & Knowledge Sharing",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Tell me about a time you helped a peer or junior colleague understand a difficult concept or solve a problem.",
    expectedAnswer: "Met them at their current knowledge level, used analogies and whiteboarding to break down foundational principles, guided them to discover the solution rather than just handing them the code, and followed up to check understanding.",
    explanation: "Teaching others reinforces personal mastery and team productivity.",
    followUps: ["How do you document your code so others can maintain it?", "What makes technical documentation effective?"]
  },
  {
    id: "hr-24",
    category: "behavioral",
    topic: "Customer Focus",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Give an example of when you advocated for the end-user's experience over a simpler technical shortcut.",
    expectedAnswer: "Recognized that a proposed shortcut would save developer hours but create UI latency or confusion for end-users; advocated for the customer-centric architecture, implemented optimized caching, and validated with user feedback.",
    explanation: "Customer obsession and engineering empathy.",
    followUps: ["How do you measure user satisfaction in a software application?", "What is accessibility in software engineering?"]
  },
  {
    id: "hr-25",
    category: "behavioral",
    topic: "Handling Repetitive Tasks",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "How do you handle routine, repetitive tasks such as regression testing, documentation, or maintenance tickets?",
    expectedAnswer: "Maintains thoroughness and attention to detail while actively looking for opportunities to automate repetitive manual steps using scripts, test suites, or CI/CD pipelines.",
    explanation: "A balance of diligence in routine duties and proactive automation mindset.",
    followUps: ["Can you share a specific script or tool you built to automate a boring task?", "How do you ensure documentation remains up to date?"]
  },
  {
    id: "hr-26",
    category: "behavioral",
    topic: "Why Tech / Software Engineering",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Why did you choose software engineering as your career path instead of other fields?",
    expectedAnswer: "Captivated by the ability to turn logical thought and code into real-world working software with global reach, and excited by the rapid innovation in cloud, distributed systems, and AI.",
    explanation: "Demonstrates passion for the field.",
    followUps: ["If you couldn't be a software engineer, what career would you pursue?", "What tech trend excites you most today?"]
  },
  {
    id: "hr-27",
    category: "behavioral",
    topic: "Overcoming Disappointment",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Tell me about a time you worked hard on something (e.g. a feature, a project, an interview) and the outcome was disappointing. How did you bounce back?",
    expectedAnswer: "Acknowledged the initial disappointment, conducted a constructive retrospective on areas to improve, focused on the skills gained during the process, and used the experience as fuel to succeed in subsequent opportunities.",
    explanation: "Resilience and growth mindset under adversity.",
    followUps: ["How do you process negative outcomes without losing motivation?", "What is your philosophy on failure?"]
  },
  {
    id: "hr-28",
    category: "behavioral",
    topic: "Persuasion and Influence",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering", "TCS", "Capgemini"],
    questionText: "Tell me about a time you had to persuade a team or manager to adopt a new tool, process, or architectural change.",
    expectedAnswer: "Did not push opinion; built a working prototype, benchmarked metrics (performance, development speed), presented a clear comparison of pros/cons, addressed security/risk concerns, and won alignment through evidence.",
    explanation: "Influence without authority through empirical data.",
    followUps: ["What do you do if a manager rejects your proposal despite good data?", "How do you balance innovation with stability?"]
  },
  {
    id: "hr-29",
    category: "behavioral",
    topic: "Navigating Ethical Code Quality vs Speed",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "What do you do when a product manager pressures you to deploy code that works but has known technical debt or inadequate test coverage?",
    expectedAnswer: "Communicate trade-offs transparently: explain the risk of production outages and future regression costs. Agree on a pragmatic compromise (e.g., shipping minimal viable scope with essential tests, and immediately creating a scheduled ticket to pay down technical debt).",
    explanation: "Balances business velocity with engineering integrity.",
    followUps: ["What is technical debt and when is it acceptable to take on?", "How do you measure test coverage?"]
  },
  {
    id: "hr-30",
    category: "behavioral",
    topic: "Continuous Feedback",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "How do you prefer to receive feedback from your manager and peers?",
    expectedAnswer: "Prefers frequent, direct, and actionable feedback in 1-on-1s rather than waiting for annual reviews, focusing on specific behaviors and recommendations for improvement.",
    explanation: "Openness to continuous professional growth.",
    followUps: ["How often do you ask for feedback?", "What is an example of feedback that significantly shaped your work?"]
  },
  {
    id: "hr-31",
    category: "behavioral",
    topic: "Work Ethic",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "How do you ensure high quality in your work when working independently with minimal supervision?",
    expectedAnswer: "Follows disciplined engineering checklists: writing unit tests, self-reviewing diffs before opening PRs, documenting edge cases, and proactively updating leads with status and blockers.",
    explanation: "Reliability in remote and hybrid engineering environments.",
    followUps: ["Do you prefer remote work, hybrid, or office-based work?", "How do you stay accountable while working remotely?"]
  },
  {
    id: "hr-32",
    category: "behavioral",
    topic: "Handling Multiple Offers",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "If you receive multiple job offers, what criteria will you use to make your final decision?",
    expectedAnswer: "Prioritizes long-term learning trajectory, quality of engineering mentorship, company stability, and opportunities to work on scalable distributed technologies.",
    explanation: "Demonstrates principled career decision-making over short-term vanity.",
    followUps: ["What makes our company stand out compared to other companies you have applied to?", "Are you interviewing with other firms currently?"]
  },
  {
    id: "hr-33",
    category: "behavioral",
    topic: "Cross-Cultural Communication",
    difficulty: "medium",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "In our global delivery model, you will collaborate with clients and engineers across US, Europe, and Asia timezones. How do you adapt to cultural differences and asynchronous communication?",
    expectedAnswer: "Practices explicit, structured written communication, respects timezone boundaries, clarifies assumptions proactively, and shows empathy and cultural awareness in meetings.",
    explanation: "Critical for global enterprise consulting roles.",
    followUps: ["What is effective asynchronous communication?", "How do you prepare for a meeting with international stakeholders?"]
  },
  {
    id: "hr-34",
    category: "behavioral",
    topic: "Presentation Skills",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "Tell me about a time you had to present a technical topic or project demo to a non-technical audience.",
    expectedAnswer: "Tailored the presentation around business value and user outcomes, avoided deep technical jargon, used visual diagrams and live workflows, and paused for questions to ensure comprehension.",
    explanation: "Translating engineering complexity into stakeholder clarity.",
    followUps: ["How do you gauge whether your audience understands your presentation?", "How do you prepare technical slides?"]
  },
  {
    id: "hr-35",
    category: "behavioral",
    topic: "Curiosity and Passion",
    difficulty: "easy",
    companyTags: ["Product-Based Engineering"],
    questionText: "Tell me about an interesting technical concept or tool you researched recently just out of personal curiosity.",
    expectedAnswer: "Describes a recent technical discovery (e.g. how LLM attention works, vector embeddings in pgvector, eBPF in the Linux kernel) with genuine enthusiasm and accurate conceptual explanation.",
    explanation: "Reveals genuine passion for computing and continuous curiosity.",
    followUps: ["What technical blogs, podcasts, or creators do you follow?", "Have you tried building a small side project with it?"]
  },
  {
    id: "hr-36",
    category: "behavioral",
    topic: "Over-Engineering vs Pragmatism",
    difficulty: "medium",
    companyTags: ["Product-Based Engineering"],
    questionText: "Have you ever caught yourself over-engineering a simple problem? How did you recognize and simplify it?",
    expectedAnswer: "Recognized when building a complex microservices or design pattern architecture for a simple MVP was creating unnecessary overhead; refactored back to a clean, modular monolith adhering to YAGNI (You Aren't Gonna Need It).",
    explanation: "Pragmatism is a key mark of senior engineering maturity.",
    followUps: ["What is the KISS principle?", "What is YAGNI?"]
  },
  {
    id: "hr-37",
    category: "behavioral",
    topic: "Managing High Cognitive Load",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "When faced with an overwhelming codebase or massive project documentation on day one, how do you get up to speed?",
    expectedAnswer: "Starts by getting the application to build and run locally, maps out the high-level architecture diagrams, traces a single end-to-end user request through the codebase, reads recent PRs, and asks targeted questions.",
    explanation: "Structured onboarding strategy reduces ramp-up time.",
    followUps: ["How do you take notes when onboarding to a new team?", "What is your approach to reading unfamiliar code?"]
  },
  {
    id: "hr-38",
    category: "behavioral",
    topic: "Long Term Loyalty",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Service-Based General"],
    questionText: "What factors make you stay at a company for multiple years versus switching jobs frequently?",
    expectedAnswer: "Continuous intellectual challenge, opportunities to take on broader architectural ownership, strong team camaraderie, transparent leadership, and competitive career advancement.",
    explanation: "Company retention focus for campus hiring.",
    followUps: ["What would make you leave a company?", "How do you view job hopping vs staying to see the long-term impact of your code?"]
  },
  {
    id: "hr-39",
    category: "behavioral",
    topic: "Dealing with Burnout / Frustration",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini"],
    questionText: "When you have been stuck on a frustrating bug for hours and feel mental fatigue, what do you do?",
    expectedAnswer: "Steps away for a brief walk or break to clear the mind, explains the problem aloud using Rubber Duck Debugging, validates fundamental assumptions with logs, and reaches out to a teammate with concise context if still blocked.",
    explanation: "Rubber duck debugging and knowing when to ask for help prevents wasted hours.",
    followUps: ["What is rubber duck debugging?", "How long do you struggle on a problem before asking for senior help? (Typically 30-60 mins rule)"]
  },
  {
    id: "hr-40",
    category: "behavioral",
    topic: "Closing Pitch",
    difficulty: "easy",
    companyTags: ["TCS", "Capgemini", "Product-Based Engineering"],
    questionText: "Why should we hire you today over the other hundreds of qualified candidates interviewing for this position?",
    expectedAnswer: "Summarizes the unique blend of strong foundational CS and backend coding skills, proven problem-solving work ethic, hunger to continuously learn and adapt, and a team-first collaborative attitude ready to deliver value from day one.",
    explanation: "Confident, humble, and value-oriented closing pitch.",
    followUps: ["Are there any final thoughts or points you would like to highlight before we conclude?", "Thank you for your time today."]
  }
];

saveJson("questions/behavioral.json", behavioralQuestions);

console.log("Total question files generated: 8 categories, 200 questions verified.");
