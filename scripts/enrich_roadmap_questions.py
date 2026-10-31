import json
import os

# Comprehensive dictionary mapping question text or question ID to authoritative model answer, interviewer logic, and code snippet
KNOWLEDGE_BASE = {
    # DAY 1
    "What is OOP?": (
        "Object-Oriented Programming (OOP) is a programming paradigm centered around 'objects'—instances of classes that encapsulate data (attributes/state) and behavior (methods). The four core pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism. OOP promotes code reusability, modularity, and maintainability by modeling software components after real-world domain entities.",
        "Interviewers want to see that you do not just recite definitions; they evaluate whether you understand how OOP contrasts with procedural programming (data and behavior bundled together vs separated) and why enterprises use it to manage complexity in large codebases.",
        "// Encapsulating state and behavior\npublic class BankAccount {\n    private double balance;\n    public void deposit(double amount) {\n        if (amount > 0) this.balance += amount;\n    }\n    public double getBalance() { return this.balance; }\n}"
    ),
    "Why do we use OOP?": (
        "We use OOP because it addresses the critical software engineering challenges of maintainability, modularity, and scalability: 1) Modularity: Code is divided into self-contained objects with clear boundaries. 2) Reusability: Common functionality is inherited or composed across classes. 3) Extensibility: New classes can extend existing ones via polymorphism without modifying tested source code (Open-Closed Principle). 4) Security: Encapsulation hides internal representation and protects data integrity.",
        "The interviewer is checking if you understand OOP from an engineering cost perspective: reducing bug surface area, simplifying debugging, and facilitating parallel feature development across distributed engineering teams.",
        "// Extensibility: adding new payment methods without breaking existing checkout code\npublic interface PaymentMethod { void pay(double amount); }\npublic class UPIPayment implements PaymentMethod { public void pay(double a) { /* UPI logic */ } }\npublic class CardPayment implements PaymentMethod { public void pay(double a) { /* Card logic */ } }"
    ),
    "Class vs object?": (
        "A class is a blueprint, template, or user-defined data type that specifies the attributes and methods that instances will possess; it occupies no memory at runtime (except for class metadata in the JVM Metaspace). An object is a concrete, runtime instance created from that class blueprint; it is dynamically allocated on the JVM Heap with its own independent state and identity.",
        "The interviewer is testing your memory model understanding: classes are loaded by the ClassLoader into Metaspace, while objects are allocated on the Heap with references stored on thread call stacks.",
        "Car myCar = new Car(\"Tesla\", 2024); \n// 'Car' is the class loaded in Metaspace\n// 'myCar' is the reference variable on the Thread Stack\n// 'new Car(...)' is the instantiated Object in the Heap"
    ),
    "Can constructors be inherited?": (
        "No, constructors cannot be inherited in Java. Constructors are specific to the class in which they are declared because their purpose is to initialize the state of that exact class. However, a subclass constructor can (and must) invoke a superclass constructor using the `super()` keyword, which defaults to the no-arg `super()` if not explicitly specified.",
        "Trap question! Many freshers confuse 'calling' a parent constructor via super() with 'inheriting' it. Interviewers ask this to test your precise understanding of constructor initialization chaining in the JVM.",
        "class Parent { Parent(int x) {} }\nclass Child extends Parent {\n    Child() {\n        super(10); // Invoking parent constructor, NOT inheriting it\n    }\n}"
    ),
    "What is the this keyword?": (
        "In Java, `this` is a reference variable that points to the current object instance within an instance method or constructor. It serves three main purposes: 1) Shadowing resolution: Resolving ambiguity between instance fields and parameter names (`this.name = name`). 2) Constructor chaining: Invoking overloaded constructors within the same class (`this(...)`). 3) Passing context: Passing the current object reference to another method or event listener.",
        "Interviewers look for understanding of constructor chaining (`this()`) and the fact that `this` cannot be referenced from static contexts because static methods belong to the class, not an object instance.",
        "public class Employee {\n    private String name;\n    private int age;\n    public Employee(String name) { this(name, 25); } // Constructor chaining\n    public Employee(String name, int age) {\n        this.name = name; // Resolving variable shadowing\n        this.age = age;\n    }\n}"
    ),
    "What is a static variable?": (
        "A static variable (class variable) belongs to the class itself rather than to any individual object instance. Only one single copy of a static variable is created and shared across all instances of the class. It is initialized when the class is loaded into memory by the ClassLoader (stored in the Metaspace/Method Area) and persists until the ClassLoader unloads the class.",
        "Interviewers test whether you understand memory allocation: instance variables are created in heap memory every time `new` is called, whereas static variables reside in Metaspace and have a single shared instance.",
        "public class Counter {\n    public static int totalVisits = 0; // Shared across all instances\n    public int instanceCount = 0;       // Unique per object\n    public Counter() { totalVisits++; instanceCount++; }\n}"
    ),
    "Static method vs instance method?": (
        "A static method belongs to the class and is bound at compile-time (static binding). It can be invoked directly via the class name without instantiating an object and can only access static fields and other static methods. An instance method belongs to an object instance and is bound dynamically at runtime (dynamic dispatch via vtable). It has an implicit `this` parameter and can access both instance and static variables.",
        "Trap: Can you override static methods? No, static methods cannot be overridden; if a subclass declares the same static method signature, it is 'method hiding', not dynamic method overriding.",
        "class MathUtils {\n    public static int add(int a, int b) { return a + b; } // Static: MathUtils.add(2, 3)\n}\nclass Account {\n    private double balance;\n    public void deposit(double a) { this.balance += a; }  // Instance: acc.deposit(50)\n}"
    ),
    "Public vs private vs protected?": (
        "Java provides four access modifier levels: 1) `private`: Accessible only within the declaring class (encapsulation). 2) `default` (package-private, no keyword): Accessible only within the same package. 3) `protected`: Accessible within the same package and by subclasses located in other packages. 4) `public`: Accessible from any class across any package in the project.",
        "The interviewer checks if you know the exact package vs subclass boundary for `protected`, especially across different packages, and how `private` enforces the OOP pillar of Encapsulation.",
        "// Access Table:\n// Modifier   | Class | Package | Subclass (diff pkg) | World\n// private    | Yes   | No      | No                  | No\n// default    | Yes   | Yes     | No                  | No\n// protected  | Yes   | Yes     | Yes                 | No\n// public     | Yes   | Yes     | Yes                 | Yes"
    ),

    # DAY 2
    "Explain the four pillars of OOP.": (
        "The four pillars of OOP are: 1) Encapsulation: Bundling data and methods into a single unit (class) and restricting direct access using private fields with getters/setters. 2) Abstraction: Hiding internal implementation complexities and exposing only essential interfaces (interfaces and abstract classes). 3) Inheritance: Deriving new classes from existing classes to reuse code and model 'is-a' relationships. 4) Polymorphism: The ability of an object or method to take many forms, implemented as compile-time (overloading) or runtime (overriding).",
        "A classic opening technical question. Interviewers want a cohesive, real-world architecture example showing how all four pillars work together in a production system.",
        "// Real-world: Payment Processing\n// 1. Abstraction: interface PaymentGateway\n// 2. Encapsulation: private String apiKey inside StripeGateway\n// 3. Inheritance: abstract class BaseGateway extended by StripeGateway\n// 4. Polymorphism: gateway.processPayment(amount) executed dynamically"
    ),
    "Compile-time vs runtime polymorphism?": (
        "Compile-time polymorphism (Static Polymorphism) is resolved at compile time using method signatures and argument types; it is implemented via Method Overloading and Operator Overloading (in C++). Runtime polymorphism (Dynamic Polymorphism) is resolved at runtime based on the actual object instance type in the heap; it is implemented via Method Overriding and Dynamic Method Dispatch using the virtual method table (vtable).",
        "Interviewers evaluate whether you understand how the compiler emits `invokevirtual` bytecode for runtime polymorphism, deferring target method resolution to runtime pointer dereferencing.",
        "// Compile-Time (Overloading):\nint add(int a, int b) { return a + b; }\ndouble add(double a, double b) { return a + b; }\n\n// Runtime (Overriding):\nAnimal a = new Dog();\na.makeSound(); // JVM resolves Dog.makeSound() dynamically at runtime"
    ),
    "Overloading vs overriding?": (
        "Method Overloading occurs within the same class when methods share the same name but differ in argument lists (number, type, or order of parameters); return type alone cannot distinguish overloads. Method Overriding occurs across a superclass-subclass inheritance hierarchy where the child class provides a specific implementation of a method that has the exact same name, return type (or covariant return type), and parameters as in the parent class.",
        "Interviewers love asking: 'Can you overload by changing only the return type?' (No, compiler error). 'Can you reduce visibility when overriding?' (No, child cannot have weaker access privilege).",
        "// Overloading (same class, different params):\nvoid print(String s) {}\nvoid print(int i) {}\n\n// Overriding (child class, identical signature):\nclass Base { void render() {} }\nclass Derived extends Base { @Override void render() {} }"
    ),
    "Can static methods be overridden?": (
        "No, static methods cannot be overridden in Java. When a subclass declares a static method with the exact same signature as a static method in the superclass, it is called Method Hiding, not overriding. Static method calls are resolved at compile time based on the reference variable's declared type, whereas overriding is resolved at runtime based on the object's actual heap type.",
        "A classic trap! The interviewer will present a code snippet where a superclass reference points to a subclass object calling a static method, testing if you realize the superclass static method is invoked.",
        "class Parent { static void show() { System.out.println(\"Parent\"); } }\nclass Child extends Parent { static void show() { System.out.println(\"Child\"); } }\nParent p = new Child();\np.show(); // Outputs 'Parent' because static methods are resolved by reference type!"
    ),
    "Can private methods be overridden?": (
        "No, private methods cannot be overridden. In Java, private methods are not visible outside their declaring class and therefore are not inherited by subclasses. If a subclass defines a method with the same name and parameters, it is a completely independent, new method that has no polymorphic relationship to the parent's private method.",
        "Interviewers check if you understand that overriding requires inheritance visibility; because private methods are invisible to subclasses, polymorphism cannot occur.",
        "class Base {\n    private void display() {} // Inaccessible to Derived\n}\nclass Derived extends Base {\n    public void display() {} // Completely new method, NOT an override!\n}"
    ),
    "What is dynamic method dispatch?": (
        "Dynamic Method Dispatch is the mechanism by which a call to an overridden method is resolved at runtime rather than compile-time. When an overridden method is called through a superclass reference, the JVM inspects the actual object type in the heap and consults that class's virtual method table (vtable). It looks up the function pointer corresponding to the overridden implementation and executes it.",
        "Interviewers look for understanding of the underlying JVM machinery: vtable (Virtual Method Table) indexing and runtime dispatching via the `invokevirtual` bytecode instruction.",
        "class Shape { void draw() { System.out.println(\"Shape\"); } }\nclass Circle extends Shape { void draw() { System.out.println(\"Circle\"); } }\nShape s = new Circle();\ns.draw(); // Dynamic Method Dispatch invokes Circle.draw() via vtable lookup"
    ),
    "Why is encapsulation useful?": (
        "Encapsulation protects an object's internal state from unauthorized external mutation, enforces business logic validation rules, and promotes loose coupling: 1) Data Integrity: Setter methods can reject invalid input (e.g., negative balance). 2) Maintainability: Internal representation can change (e.g., changing an array to an ArrayList) without breaking external callers. 3) Read-Only Access: Can expose state via getters while withholding setters.",
        "The interviewer wants to see you connect encapsulation to defensive programming and system stability, rather than just saying 'getters and setters'.",
        "public class UserAccount {\n    private String email;\n    public void setEmail(String email) {\n        if (!email.contains(\"@\")) throw new IllegalArgumentException(\"Invalid email\");\n        this.email = email; // Invariants enforced\n    }\n}"
    ),

    # DAY 3
    "Association vs aggregation vs composition?": (
        "All three describe relationships between objects: 1) Association: A general 'has-a' relationship where objects have independent lifecycles (e.g., Teacher and Student). 2) Aggregation: A weak 'has-a' relationship where the child object can exist independently of the parent; parent does not own the lifecycle (e.g., Department and Professors; if department closes, professors still exist). 3) Composition: A strong 'part-of' relationship where the child cannot exist without the parent; parent owns lifecycle (e.g., House and Rooms; if the house is destroyed, rooms cease to exist).",
        "A premier Low-Level Design (LLD) interview question. Interviewers test whether you model object lifecycles properly when drawing UML class diagrams.",
        "// Aggregation (weak: Wheel exists independently)\nclass Wheel {}\nclass Car { private Wheel wheel; public Car(Wheel w) { this.wheel = w; } }\n\n// Composition (strong: Engine lifecycle tied to Car)\nclass Engine {}\nclass Car { private Engine engine = new Engine(); }"
    ),
    "Inheritance vs composition?": (
        "Inheritance ('is-a') binds classes tightly at compile-time, exposing superclass implementation details to subclasses (violating encapsulation, known as the fragile base class problem). Composition ('has-a') bundles references to other objects, delegating behavior at runtime. The fundamental software engineering principle is 'Favor Composition over Inheritance' because composition allows swapping implementations at runtime, avoids combinatorial subclass explosions, and maintains loose coupling.",
        "Interviewers check if you know why deep inheritance hierarchies (>3 levels) become unmaintainable in enterprise codebases and how composition enables design patterns like Strategy and Decorator.",
        "// Favor composition: inject behavior rather than rigid subclassing\npublic class OrderService {\n    private final PaymentProcessor paymentProcessor;\n    public OrderService(PaymentProcessor p) { this.paymentProcessor = p; }\n}"
    ),
    "Why does Java not support multiple class inheritance?": (
        "Java prohibits multiple class inheritance to avoid the Diamond Problem and structural ambiguity: If Class B and Class C both inherit from Class A and override method `execute()`, and Class D inherits from both B and C, which `execute()` should D call? Furthermore, inheriting multiple state fields can cause memory layout conflicts. Java solves this cleanly by allowing multiple interface inheritance (where default method collisions must be explicitly resolved by the developer) while restricting classes to single inheritance.",
        "Interviewers want you to name the 'Diamond Problem' directly and explain how Java allows multiple interface implementation while blocking multiple class state inheritance.",
        "// Diamond Problem resolution with interfaces:\ninterface A { default void log() { System.out.println(\"A\"); } }\ninterface B { default void log() { System.out.println(\"B\"); } }\nclass C implements A, B {\n    @Override\n    public void log() { A.super.log(); } // Developer must explicitly disambiguate!\n}"
    ),

    # DAY 4
    "Explain Single Responsibility Principle.": (
        "The Single Responsibility Principle (SRP)—the 'S' in SOLID—states that a class should have one, and only one, reason to change. In other words, a class should encapsulate a single business responsibility. For example, a class that parses user data, persists it to the database, and sends email notifications violates SRP; changes to the email service or database schema would both force modifications to that single class. Splitting it into Parser, Repository, and NotificationService restores SRP.",
        "Interviewers test whether you can recognize bloated 'God classes' in code reviews and decompose them into cohesive single-purpose services.",
        "// Violates SRP: User handles persistence & notification\n// Correct SRP:\nclass UserRepository { void save(User u) {} }\nclass EmailService { void sendWelcomeEmail(User u) {} }\nclass UserService { private UserRepository repo; private EmailService email; }"
    ),
    "Explain Open/Closed Principle.": (
        "The Open/Closed Principle (OCP)—the 'O' in SOLID—states that software entities (classes, modules, functions) should be open for extension, but closed for modification. This means you should be able to introduce new behavior or features without altering existing, tested source code. OCP is achieved primarily through Abstraction, Interfaces, and Polymorphic Strategy patterns: when a new requirement arises, you implement an existing interface rather than adding chained `if-else` or `switch` statements to core logic.",
        "Interviewers look for antipatterns: if adding a new payment method requires editing a 50-line `switch(paymentType)` block in your checkout service, you violated OCP.",
        "public interface NotificationChannel { void send(String msg); }\npublic class SMSChannel implements NotificationChannel { public void send(String m) {} }\npublic class EmailChannel implements NotificationChannel { public void send(String m) {} }\n// Adding WhatsAppChannel requires ZERO modifications to NotificationService!"
    ),
    "Explain Liskov Substitution Principle.": (
        "The Liskov Substitution Principle (LSP)—the 'L' in SOLID—states that objects of a superclass should be replaceable with objects of a subclass without breaking application correctness or altering expected program behavior. A subclass must fulfill the contract established by its superclass: it must not strengthen preconditions (accept fewer inputs), weaken postconditions (guarantee less output), or throw unexpected exceptions not declared by the parent.",
        "Classic textbook interview example: The Rectangle-Square problem. A Square class inheriting from Rectangle violates LSP if mutating the width also mutates the height, breaking client assertions expecting independent dimensions.",
        "// Classic LSP Violation:\nclass Rectangle { void setWidth(int w) {} void setHeight(int h) {} }\nclass Square extends Rectangle {\n    void setWidth(int w) { super.setWidth(w); super.setHeight(w); } // Breaks client contracts!\n}"
    ),
    "Explain Interface Segregation Principle.": (
        "The Interface Segregation Principle (ISP)—the 'I' in SOLID—states that no client should be forced to depend on methods it does not use. Large, 'fat' interfaces should be decomposed into smaller, role-specific interfaces. For example, rather than an omnibus `Worker` interface containing `work()`, `eat()`, and `sleep()`, create separate `Workable` and `Feedable` interfaces so that a `Robot` class is not forced to implement empty or throwing `eat()` methods.",
        "Interviewers evaluate if you understand how fat interfaces pollute client code with dummy implementations or `UnsupportedOperationException` stubs.",
        "// Fat Interface: interface Worker { void work(); void eat(); }\n// Segregated Interfaces:\ninterface Workable { void work(); }\ninterface Eatable { void eat(); }\nclass Robot implements Workable { public void work() {} } // Clean and decoupled"
    ),
    "Explain Dependency Inversion Principle.": (
        "The Dependency Inversion Principle (DIP)—the 'D' in SOLID—states two core rules: 1) High-level modules should not depend on low-level modules; both should depend on abstractions (interfaces). 2) Abstractions should not depend on details; details (concrete implementations) should depend on abstractions. DIP decouples business logic from specific databases, messaging queues, or third-party APIs.",
        "Interviewers test whether you understand how DIP reverses the traditional top-down dependency flow: the business domain dictates the interface contract, and technical adapters implement it.",
        "// High-level OrderService depends on abstraction, NOT concrete MySQLRepository\npublic class OrderService {\n    private final OrderRepository repository; // Interface\n    public OrderService(OrderRepository repo) { this.repository = repo; }\n}"
    ),
    "What is dependency injection?": (
        "Dependency Injection (DI) is a software design pattern that implements Inversion of Control (IoC). Instead of an object constructing its own dependencies internally using `new`, the dependencies are passed (injected) into the object from an external container (e.g., Spring IoC Container). The three main types of DI are: 1) Constructor Injection (strongly recommended for immutability and testability), 2) Setter Injection, and 3) Field Injection (via `@Autowired`, discouraged due to hidden dependencies).",
        "Interviewers ask this to test your understanding of Spring Framework core principles, unit test mocking, and loose coupling.",
        "@Service\npublic class OrderService {\n    private final PaymentGateway gateway;\n    @Autowired // Constructor Injection\n    public OrderService(PaymentGateway gateway) { this.gateway = gateway; }\n}"
    ),
    "What is loose coupling?": (
        "Loose coupling is an architectural quality where components, classes, or microservices have minimal knowledge of and reliance upon the internal workings of other components. Changes to one class do not cascade into or require changes in another. Loose coupling is achieved through interfaces, dependency injection, message queues, and event-driven architectures.",
        "Interviewers want to see how loose coupling enables zero-downtime deployment, simple unit testing with mock objects, and isolated component refactoring.",
        "// Tightly coupled: new MySQLDatabase() hardcoded\n// Loosely coupled: interface Database injected via constructor"
    ),
    "What is high cohesion?": (
        "High cohesion means that all responsibilities, fields, and methods within a single class, package, or module are closely related and focused on achieving one clear objective. A highly cohesive class is easy to understand, test, and maintain because it does not contain unrelated logic. In contrast, low cohesion results in 'God classes' that mix user validation, email sending, logging, and SQL generation into a single tangled file.",
        "Interviewers pair this with loose coupling: The gold standard of software architecture is 'High Cohesion, Loose Coupling'.",
        "// High Cohesion: StringUtils handles ONLY string manipulation methods"
    ),

    # DAY 5
    "DBMS vs RDBMS?": (
        "DBMS (Database Management System) is a broad term for systems that store and manage data as files on disk (e.g., XML, flat files) without enforcing relational keys or formal normalization. RDBMS (Relational Database Management System, e.g., PostgreSQL, MySQL) is an extension of DBMS based on Edgar Codd's Relational Model. In an RDBMS, data is stored in structured two-dimensional tables (relations) with rows and columns, enforcing Primary/Foreign key constraints, ACID properties, and relational algebra operations (JOINs).",
        "Interviewers check if you know that all RDBMS are DBMS, but not all DBMS are RDBMS, and that RDBMS guarantees referential integrity across related tables.",
        "-- RDBMS Table with Referential Integrity:\nCREATE TABLE Orders (\n    order_id INT PRIMARY KEY,\n    user_id INT REFERENCES Users(user_id) -- Foreign Key\n);"
    ),
    "What is a relationship in DBMS?": (
        "A relationship in a relational database represents an association between data stored across different tables, established using Primary Key and Foreign Key constraints. The three fundamental cardinality types are: 1) One-to-One (1:1, e.g., User and UserProfile), 2) One-to-Many (1:N, e.g., Department and Employees), and 3) Many-to-Many (M:N, e.g., Students and Courses), which must be resolved in an RDBMS using an intermediate junction / associative bridge table.",
        "Interviewers test whether you know how to model M:N relationships using junction tables with composite primary keys.",
        "-- Many-to-Many Junction Table:\nCREATE TABLE Student_Courses (\n    student_id INT REFERENCES Students(id),\n    course_id INT REFERENCES Courses(id),\n    PRIMARY KEY (student_id, course_id)\n);"
    ),

    # DAY 6
    "DDL vs DML vs DQL?": (
        "SQL commands are categorized by operation scope: 1) DDL (Data Definition Language): Defines and alters the database schema structure (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`). DDL operations are auto-committed in most databases. 2) DML (Data Manipulation Language): Modifies table row data (`INSERT`, `UPDATE`, `DELETE`). DML operations participate in transactions and can be rolled back. 3) DQL (Data Query Language): Retrieves data without modifying schema or state (`SELECT`). Some taxonomies include DCL (`GRANT`, `REVOKE`) and TCL (`COMMIT`, `ROLLBACK`).",
        "Interviewers frequently ask: 'What is the difference between DELETE and TRUNCATE?' (DELETE is DML, row-by-row, participates in transactions; TRUNCATE is DDL, deallocates pages, resets identity counter, much faster).",
        "-- DDL: CREATE TABLE, ALTER TABLE\n-- DML: INSERT INTO, UPDATE, DELETE FROM\n-- DQL: SELECT * FROM Employees WHERE salary > 50000"
    ),
    "How does WHERE differ from HAVING?": (
        "`WHERE` filters individual rows *before* any grouping or aggregation takes place; it cannot contain aggregate functions (`WHERE salary > 50000`). `HAVING` filters aggregated groups *after* the `GROUP BY` clause has collapsed rows into summary rows; it can evaluate aggregate functions (`HAVING COUNT(*) > 5` or `HAVING AVG(salary) > 80000`).",
        "A classic SQL trap! Interviewers test if you know that filtering columns that do not depend on aggregates should always be placed in WHERE to reduce row counts prior to grouping, optimizing execution speed.",
        "SELECT dept_id, AVG(salary) \nFROM Employees \nWHERE status = 'ACTIVE'       -- Filter rows BEFORE grouping\nGROUP BY dept_id \nHAVING COUNT(*) >= 5;        -- Filter groups AFTER aggregation"
    ),

    # DAY 7
    "COUNT(*) vs COUNT(column)?": (
        "`COUNT(*)` counts the total number of rows returned by the query, including rows with `NULL` values. `COUNT(column_name)` counts only those rows where the specified column is NOT NULL. Performance-wise, in modern optimizers, `COUNT(*)` can scan any convenient index (or the smallest non-clustered index), making it as fast as or faster than `COUNT(1)` and `COUNT(column)`.",
        "Interviewers ask this to test your understanding of NULL semantics in SQL aggregations. Many candidates mistakenly think COUNT(*) ignores NULLs.",
        "-- If table has 3 rows: [10, NULL, 20]\n-- COUNT(*) returns 3\n-- COUNT(col) returns 2"
    ),
    "How does GROUP BY work internally?": (
        "Internally, the database query engine executes `GROUP BY` using one of two primary algorithms: 1) Hash Aggregate: It builds an in-memory hash table where the hash key is the group-by expression and the value contains running accumulators (sum, count). Ideal for unsorted data. 2) Stream / Sort Aggregate: If an index exists on the grouped column, rows arrive pre-sorted; the engine streams through rows, aggregating until the key value changes, then emits the group row. If no index exists, the engine must sort rows first (Sort operator).",
        "Interviewers check if you know how indexing grouped columns avoids costly in-memory hash allocations or disk-spilled sorting passes.",
        "-- Query execution plan shows 'HashAggregate' or 'StreamAggregate' based on index presence"
    ),
    "What is the order of execution in a SQL query?": (
        "Although written `SELECT ... FROM ... WHERE ... GROUP BY ...`, SQL queries execute in this logical order: 1) `FROM` (and JOINs): Identifying source tables and Cartesian products. 2) `ON`: Applying join filters. 3) `WHERE`: Row-level filtering. 4) `GROUP BY`: Grouping rows. 5) `HAVING`: Group-level filtering. 6) `SELECT`: Evaluating expressions, projections, and window functions. 7) `DISTINCT`: Deduplication. 8) `ORDER BY`: Sorting results. 9) `LIMIT / OFFSET`: Paging.",
        "Essential question! Explains why you cannot use column aliases created in `SELECT` within the `WHERE` clause (since WHERE executes before SELECT).",
        "-- Logical Order:\n-- 1. FROM & JOIN -> 2. WHERE -> 3. GROUP BY -> 4. HAVING -> 5. SELECT -> 6. DISTINCT -> 7. ORDER BY -> 8. LIMIT"
    ),

    # DAY 8
    "Natural JOIN vs INNER JOIN?": (
        "An `INNER JOIN` matches rows between two tables based on an explicit condition defined in the `ON` clause (`ON A.dept_id = B.dept_id`). A `Natural JOIN` implicitly joins tables based on *all* columns that share the exact same column name across both tables. Natural JOIN is considered an anti-pattern in production SQL because adding a new column with a common name (e.g., `created_at` or `status`) silently alters the join condition, corrupting query results.",
        "Interviewers look for practical engineering discipline: never use Natural JOIN in production systems because of schema fragility.",
        "-- Production Standard (Explicit):\nSELECT * FROM Employees e INNER JOIN Departments d ON e.dept_id = d.id;"
    ),

    # DAY 9
    "What is a correlated subquery?": (
        "A correlated subquery is an inner subquery that references columns from the outer query. Because the inner query depends on the current outer row, it cannot be executed once independently; instead, it must be evaluated repeatedly for each row processed by the outer query (conceptually like a nested for-loop). Correlated subqueries are often used in `EXISTS` checks or finding the Nth highest salary, but can be slow (O(N*M)) unless rewritten as a JOIN or Window Function.",
        "Interviewers test whether you can recognize O(N^2) query performance traps and optimize correlated subqueries into `DENSE_RANK()` window functions.",
        "-- Correlated subquery: Find employees earning more than their department's average\nSELECT emp_name, salary \nFROM Employees e \nWHERE salary > (\n    SELECT AVG(salary) FROM Employees WHERE dept_id = e.dept_id\n);"
    ),
    "What is an Index and how does B-Tree indexing work?": (
        "A database index is an auxiliary data structure that accelerates data retrieval operations at the cost of additional disk space and slower writes (`INSERT`, `UPDATE`, `DELETE`). The standard index structure is the B+ Tree: a self-balancing, multi-way search tree where all data rows (or pointers) reside exclusively in leaf nodes linked horizontally as a doubly linked list. Non-leaf nodes contain only search keys and child pointers, enabling high fan-out (thousands of keys per page) and allowing searches to complete in just 3-4 I/O disk reads for millions of rows.",
        "Interviewers check if you know why B+ Trees are preferred over Binary Search Trees or Hash Tables for disk storage: high fan-out minimizes disk seeks, and leaf node linked lists enable ultra-fast range queries (`BETWEEN`, `>`, `<`).",
        "-- Creating a composite index for range and equality\nCREATE INDEX idx_emp_dept_salary ON Employees(dept_id, salary);"
    ),

    # DAY 10
    "What is a database transaction?": (
        "A database transaction is a logical unit of work comprising one or more database operations that must execute with complete integrity. A transaction either executes in its entirety (committed permanently) or leaves the database unchanged (rolled back completely). Transactions prevent partial state corruption (e.g., deducting money from Account A without crediting Account B).",
        "The interviewer expects you to tie transactions directly to the ACID guarantees and explain how Write-Ahead Logging (WAL) facilitates rollbacks.",
        "BEGIN TRANSACTION;\nUPDATE Accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE Accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;"
    ),
    "Explain ACID properties.": (
        "ACID defines the four guarantees of database transactions: 1) Atomicity: 'All or nothing' execution; if any step fails, the entire transaction is rolled back via the undo log. 2) Consistency: The database transitions from one valid state to another, preserving all integrity constraints, schema rules, and foreign keys. 3) Isolation: Concurrent transactions execute without interfering with each other (preventing dirty reads, non-repeatable reads, phantom reads) governed by Isolation Levels. 4) Durability: Once a transaction commits, its modifications survive system crashes or power failures, guaranteed by Write-Ahead Logging (WAL) flushed to non-volatile disk.",
        "A mandatory database interview question. Interviewers look for concrete mechanical explanations: WAL for Durability and Atomicity; Multi-Version Concurrency Control (MVCC) or Two-Phase Locking (2PL) for Isolation.",
        "-- ACID: Atomicity (WAL/Rollback), Consistency (Constraints), Isolation (MVCC/Locks), Durability (fsync to disk)"
    ),

    # DAY 11
    "What is a System Call and how does mode switching (User to Kernel mode) occur?": (
        "A System Call (syscall) is the programmatic interface through which a user-space application requests privileged services from the operating system kernel (e.g., file I/O `read()`, process creation `fork()`, network transmission `socket()`). Because CPUs enforce hardware privilege rings (Ring 3 for User Mode, Ring 0 for Kernel Mode), applications cannot directly access hardware. When a syscall is invoked, the CPU triggers a software interrupt (trap) or executes `SYSCALL` instruction, saving CPU registers to the kernel stack, switching CPU privilege from Ring 3 to Ring 0, executing the kernel routine via the Interrupt Vector Table, and switching back via `SYSRET`.",
        "Interviewers evaluate whether you understand CPU hardware privilege levels, context switching overhead, and why frequent syscalls can become an application performance bottleneck.",
        "// In C: read(fd, buffer, count) -> triggers trap -> kernel executes sys_read -> switches back to user mode"
    ),

    # DAY 12
    "What is a Process Control Block (PCB)?": (
        "A Process Control Block (PCB) is an OS kernel data structure that stores all metadata needed to manage a process: 1) Process ID (PID) and Parent PID. 2) Process State (Ready, Running, Waiting, Terminated). 3) Program Counter (PC) tracking the next instruction. 4) CPU Registers and Stack Pointer. 5) CPU Scheduling information (priority, quantum). 6) Memory Management Info (Page table pointers, base/limit registers). 7) I/O Status Info (list of open file descriptors). During a context switch, the OS saves the running process's registers into its PCB and loads the next process's PCB.",
        "Interviewers test whether you know what data must be preserved during a context switch and how PCB storage scales with process counts in the kernel.",
        "// PCB fields: PID, State, PC, Registers, Memory Limits, Open File Descriptors"
    ),
    "Process vs Thread memory model?": (
        "A Process is an independent execution unit with its own private virtual address space containing Text (Code), Data, Heap, and Stack; processes cannot access each other's memory directly without Inter-Process Communication (IPC). A Thread is a lightweight execution unit *within* a process. All threads belonging to the same process share the same virtual address space, Text, Data, and Heap memory, as well as open file descriptors. However, each thread has its own private Stack, Program Counter (PC), and CPU Register set.",
        "Interviewers check if you know that thread switching is significantly faster than process switching because threads share the same page directory (no TLB cache flush needed).",
        "// Shared across threads: Heap, Static Variables, File Descriptors\n// Private to each thread: Thread Stack, Stack Pointer, Program Counter, Registers"
    ),

    # DAY 13
    "Preemptive vs Non-Preemptive scheduling?": (
        "In Non-Preemptive scheduling, once a process is allocated the CPU, it holds the CPU until it either terminates or voluntarily yields by blocking on I/O (e.g., FCFS, standard SJF). In Preemptive scheduling, the OS kernel timer interrupt or priority dispatcher can forcibly interrupt a running process and context switch the CPU to a higher-priority or ready process (e.g., Round Robin, Shortest Remaining Time First - SRTF, Linux Completely Fair Scheduler - CFS). Preemptive scheduling is mandatory for interactive, multi-user time-sharing operating systems.",
        "Interviewers look for the trade-off: Preemption ensures responsiveness and prevents CPU monopolization, but incurs context-switching overhead.",
        "// Non-Preemptive: Process keeps CPU until exit or I/O wait\n// Preemptive: Timer interrupt forcibly context-switches process after time quantum expires"
    ),
    "FCFS, SJF, Round Robin, and Priority Scheduling trade-offs?": (
        "1) First-Come, First-Served (FCFS): Simple FIFO queue, non-preemptive; suffers from the Convoy Effect (short processes stuck behind long CPU-bound jobs). 2) Shortest Job First (SJF): Provably optimal minimum average waiting time, but impossible to implement perfectly in practice because future CPU burst lengths cannot be known in advance; risks starvation of long jobs. 3) Priority Scheduling: Executes highest-priority processes first; risks starvation (solved via Aging). 4) Round Robin (RR): Allocates a fixed time quantum to each process cyclically; fair and responsive, ideal for time-sharing.",
        "Interviewers test your ability to evaluate scheduling algorithms across throughput, fairness, average waiting time, and starvation risks.",
        "// Trade-offs summary:\n// FCFS: Simple, Convoy Effect\n// SJF: Optimal waiting time, starvation risk\n// RR: Fair, responsive, sensitive to quantum size"
    ),
    "What is Convoy Effect and Starvation?": (
        "The Convoy Effect occurs in FCFS scheduling when a long, CPU-intensive process occupies the CPU, causing an entire queue of short, I/O-bound processes to wait behind it; once the CPU burst finishes, all I/O devices are utilized simultaneously while the CPU idles, leading to poor device and CPU utilization. Starvation (Indefinite Blocking) occurs when a runnable process is perpetually denied CPU allocation because higher-priority or shorter processes continually preempt it. Starvation is solved using Aging (gradually increasing a waiting process's priority over time).",
        "Classic OS concepts! Interviewers check if you know the exact mechanism to solve starvation: Aging.",
        "// Solution to Starvation: Aging\n// As process waits in Ready queue: priority = priority + (waiting_time * aging_factor)"
    ),
    "What is turnaround time vs waiting time?": (
        "Turnaround Time is the total elapsed time between process submission and its final completion: `Turnaround Time = Completion Time - Arrival Time`. Waiting Time is the total amount of time a process spends waiting in the Ready Queue waiting to be allocated CPU time: `Waiting Time = Turnaround Time - Burst Time`. Response Time is the time elapsed from submission until the process produces its first response.",
        "Interviewers test your precision on standard OS scheduling metrics: minimizing average waiting time is the goal of SJF, while minimizing response time is the goal of Round Robin.",
        "// Formulas:\n// Turnaround Time = Completion Time - Arrival Time\n// Waiting Time = Turnaround Time - CPU Burst Time"
    ),
    "Why is Round Robin preferred for time-sharing systems?": (
        "Round Robin (RR) is preferred for interactive and time-sharing systems because it guarantees a deterministic upper bound on response time: with n processes and time quantum q, every process is guaranteed CPU time within (n - 1) * q time units. No process can monopolize the CPU, ensuring that interactive applications (GUIs, web requests, shells) remain responsive. If quantum q is too large, RR degrades into FCFS; if q is too small, context switching overhead dominates.",
        "Interviewers evaluate whether you understand the optimal quantum size: typically 10-100 milliseconds, ensuring context switch overhead represents <1% of CPU time.",
        "// Quantum trade-off: q -> inf => FCFS; q -> 0 => Context switch thrashing"
    ),

    # DAY 14
    "What is a Critical Section and Race Condition?": (
        "A Critical Section is a segment of code that accesses shared resources (memory variables, files, sockets) that must not be concurrently executed by more than one process or thread. A Race Condition occurs when the final outcome of program execution depends on the non-deterministic interleaving or timing of thread execution. Without synchronization, concurrent reads and writes to shared variables lead to silent data corruption.",
        "Interviewers ask this to see if you can explain what happens at the machine code level: `count++` compiles into three CPU instructions (Load, Increment, Store); context switching between Load and Store produces a lost update.",
        "// Race Condition in count++:\n// Thread 1: LOAD count (0) -> Thread 2: LOAD count (0)\n// Thread 1: ADD 1 -> STORE (1) -> Thread 2: ADD 1 -> STORE (1)\n// Result: count is 1 instead of 2!"
    ),
    "Mutex vs Semaphore (Counting vs Binary)?": (
        "A Mutex (Mutual Exclusion) is a locking mechanism with ownership: only the thread that acquired (locked) the mutex can release (unlock) it; it serializes access to a single shared resource. A Semaphore is a signaling mechanism without ownership (any thread can signal it). A Binary Semaphore has values 0 and 1, functioning similarly to a mutex but without ownership restrictions. A Counting Semaphore has a non-negative integer counter representing the number of available units of a shared resource; `wait()` (P) decrements the counter, blocking if 0, and `signal()` (V) increments it.",
        "Interviewers love asking: 'Can Thread A unlock a mutex locked by Thread B?' (No, throws exception). 'Can Thread A signal a semaphore waited on by Thread B?' (Yes, semaphores are signaling tools).",
        "// Mutex: Ownership locked by acquiring thread\n// Counting Semaphore: Capacity throttle (e.g., connection pool of size 10)"
    ),
    "What is Deadlock and what are the 4 Coffman conditions?": (
        "A Deadlock is a permanent stall state where a set of processes are blocked because each process holds a resource and waits for another resource held by another process in the set. For a deadlock to occur, all four Coffman Conditions must hold simultaneously: 1) Mutual Exclusion: At least one resource must be held in non-shareable mode. 2) Hold and Wait: A process holding resources must be waiting to acquire additional resources. 3) No Preemption: Resources cannot be forcibly taken from a process; they can only be released voluntarily. 4) Circular Wait: A closed chain of processes exists where P0 waits for P1, P1 waits for P2, and Pn waits for P0.",
        "A mandatory FAANG/tier-1 technical question. Breaking any ONE of the four Coffman conditions guarantees deadlock cannot occur.",
        "// 4 Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait"
    ),
    "Deadlock Prevention vs Avoidance (Banker's Algorithm) vs Detection?": (
        "1) Deadlock Prevention: Eliminates deadlock statically at design time by structurally invalidating at least one Coffman condition (e.g., imposing global strict resource ordering to eliminate Circular Wait). 2) Deadlock Avoidance: Allows dynamic resource requests, but the OS evaluates each request using algorithms like the Banker's Algorithm to verify whether granting the request keeps the system in a 'Safe State' (a state where an execution sequence exists allowing all processes to finish). 3) Deadlock Detection & Recovery: Allows deadlocks to happen, detects them via periodic Resource Allocation Graph (RAG) cycle checks, and recovers via process termination or resource preemption.",
        "Interviewers evaluate whether you understand the cost: Prevention reduces resource utilization; Avoidance requires prior knowledge of maximum resource claims; Detection requires recovery rollback mechanisms.",
        "// Deadlock resolution strategies: Prevention (Static), Avoidance (Banker's Algorithm), Detection (RAG Cycle)"
    ),
    "Producer-Consumer problem with Semaphores?": (
        "The Producer-Consumer (Bounded Buffer) problem coordinates producers placing items into a buffer of size N and consumers removing them. It is solved using three synchronization variables: 1) `mutex` (binary semaphore or lock) ensuring mutual exclusion when modifying buffer pointers. 2) `empty` (counting semaphore initialized to N) tracking available empty slots; producer waits on `empty`. 3) `full` (counting semaphore initialized to 0) tracking filled slots; consumer waits on `full`. This completely prevents buffer overflow and underflow.",
        "Interviewers evaluate whether you know the correct semaphore order: always wait on the counting semaphore (`empty`/`full`) *before* acquiring the `mutex` to prevent deadlock.",
        "// Producer:\nwait(empty); wait(mutex); insert_item(); signal(mutex); signal(full);\n// Consumer:\nwait(full); wait(mutex); remove_item(); signal(mutex); signal(empty);"
    ),
    "Readers-Writers problem?": (
        "The Readers-Writers problem models access to a shared resource where multiple readers can read concurrently, but a writer must have exclusive access (no other readers or writers). The first-readers-preference solution allows new readers to read as long as at least one reader is active, which can starve writers indefinitely. The writers-preference solution prioritizes waiting writers, blocking new readers from acquiring the lock until pending writers finish, ensuring data freshness.",
        "Interviewers ask this to test your understanding of ReadWriteLocks in Java (`ReentrantReadWriteLock`), which balance concurrency with writer fairness.",
        "ReadWriteLock lock = new ReentrantReadWriteLock();\nlock.readLock().lock();   // Concurrent shared reads\nlock.writeLock().lock();  // Exclusive write"
    ),
    "Dining Philosophers problem and resolution?": (
        "Five philosophers sit around a circular table with five chopsticks; each philosopher needs both adjacent chopsticks (left and right) to eat. If all philosophers pick up their left chopstick simultaneously, a circular wait deadlock occurs. Solutions include: 1) Resource Ordering: Number chopsticks 0 to 4; each philosopher must always pick up the lower-numbered chopstick first (breaks Circular Wait). 2) Asymmetric Solution: Odd philosophers pick up left first; even philosophers pick up right first. 3) Arbitrator: Use a monitor or mutex allowing only 4 philosophers to sit at the table simultaneously.",
        "Interviewers use this to test if you can apply Coffman condition breaking to eliminate circular dependencies in concurrent architectures.",
        "// Resource Ordering Solution:\nint first = Math.min(left, right);\nint second = Math.max(left, right);\nacquire(first); acquire(second);"
    ),

    # DAY 15
    "Logical address vs Physical address and MMU?": (
        "A Logical (Virtual) Address is generated by the CPU during program execution, representing an address in the process's private virtual address space. A Physical Address represents the actual hardware location in physical RAM. The Memory Management Unit (MMU) is the hardware component located between the CPU and memory bus that translates logical addresses into physical addresses at runtime using Page Tables and base/relocation registers, providing memory isolation and security.",
        "Interviewers test whether you understand how virtual memory prevents applications from reading or corrupting each other's physical RAM.",
        "// CPU emits Logical Address -> MMU checks TLB/Page Table -> Emits Physical Address to RAM"
    ),
    "Paging vs Segmentation?": (
        "Paging divides a process's virtual address space into fixed-size blocks called Pages, and physical memory into identical fixed-size blocks called Frames (typically 4KB). Paging completely eliminates External Fragmentation, but can cause Internal Fragmentation (unused space in the last page). Segmentation divides memory into variable-sized logical segments reflecting program structure (Code, Stack, Heap, Data). Segmentation has no internal fragmentation, but causes External Fragmentation (free memory broken into unusable small scattered chunks). Modern OS use Paged Segmentation.",
        "Interviewers check if you know the exact fragmentation distinction: Paging = Internal Fragmentation; Segmentation = External Fragmentation.",
        "// Paging: Fixed 4KB blocks, eliminates external fragmentation\n// Segmentation: Variable logical segments, suffers external fragmentation"
    ),
    "Page Fault handling lifecycle?": (
        "A Page Fault occurs when a program accesses a valid virtual memory address whose page table entry has the 'valid/present' bit set to 0 (page is not in physical RAM, but swapped out on disk): 1) CPU traps to the OS kernel page fault handler. 2) OS verifies address validity. 3) OS finds a free physical frame in RAM (or evicts an existing page using LRU/Clock page replacement). 4) OS issues a disk I/O read to load the missing page from swap space into the frame. 5) Page table entry is updated with the frame number and valid bit set to 1. 6) The faulted instruction is restarted transparently.",
        "A critical OS systems question! Interviewers look for: trapping, frame allocation, disk I/O, page table update, and instruction restart.",
        "// Page Fault: Trap -> Verify -> Evict/Alloc Frame -> Disk Read -> Update Page Table -> Restart Instruction"
    ),
    "What is TLB (Translation Lookaside Buffer)?": (
        "The Translation Lookaside Buffer (TLB) is a high-speed, hardware associative cache located inside the CPU memory management unit (MMU) that stores recent Virtual-to-Physical page translations. Without a TLB, every memory access requires at least two physical memory reads (one to walk the Page Table, one to fetch the actual data). With a TLB, if the virtual page number is found (TLB Hit), physical address translation occurs in <1 CPU clock cycle. A TLB Miss requires walking the page table in RAM.",
        "Interviewers test if you know why context switching between different processes can be expensive: the TLB must be flushed (invalidated) unless tagged with Address Space Identifiers (ASID).",
        "// TLB Hit: O(1) clock cycle translation\n// TLB Miss: Multi-level page table memory walk"
    ),
    "What is Thrashing and Working Set Model?": (
        "Thrashing occurs when the total memory demand of all active processes exceeds available physical RAM, causing the operating system to spend virtually all its time swapping pages in and out of disk rather than executing user instructions (CPU utilization plummets toward zero while disk I/O hits 100%). Peter Denning's Working Set Model defines a process's Working Set W(t, delta) as the set of pages accessed within the last delta time window. To prevent thrashing, the OS ensures that the sum of all active working sets fits within RAM; if not, it suspends (swaps out) one or more entire processes.",
        "Interviewers evaluate whether you recognize production symptoms of thrashing (high disk queue, zero CPU progress) and how the OS regulates multiprogramming degree.",
        "// Thrashing indicator: High page fault rate + 100% Disk I/O + 0% CPU utilization"
    )
}

def enrich_all_days(days_path):
    with open(days_path, 'r', encoding='utf-8') as f:
        days = json.load(f)

    updated_count = 0
    for day in days:
        for q in day['questions']:
            q_text = q['question'].strip()
            # Check if this question is generic
            if 'In an interview, explain' in q.get('answer', ''):
                # Look up in knowledge base
                if q_text in KNOWLEDGE_BASE:
                    ans, logic, code = KNOWLEDGE_BASE[q_text]
                    q['answer'] = ans
                    q['logic'] = logic
                    if code:
                        q['codeSnippet'] = code
                    updated_count += 1
                else:
                    # Synthesize an authoritative answer based on question text and category
                    ans, logic, code = synthesize_expert_entry(day['dayNumber'], q_text, day['phaseName'])
                    q['answer'] = ans
                    q['logic'] = logic
                    if code:
                        q['codeSnippet'] = code
                    updated_count += 1

    with open(days_path, 'w', encoding='utf-8') as f:
        json.dump(days, f, indent=2, ensure_ascii=False)
    print(f"Successfully enriched {updated_count} questions in {days_path}")

def synthesize_expert_entry(day_num, q_text, phase_name):
    clean_q = q_text.rstrip('?').strip()
    
    # Networks / Security / Web Architecture
    if 'OSI' in clean_q or 'TCP/IP' in clean_q:
        ans = "The OSI 7-Layer model is a conceptual reference framework (Application, Presentation, Session, Transport, Network, Data Link, Physical) while the TCP/IP 4-Layer model is the practical implementation standard (Application, Transport, Internet, Network Access). As data moves down the stack, headers are appended (Encapsulation: Data -> Segment -> Packet -> Frame -> Bits); upon receipt, headers are stripped (Decapsulation)."
        logic = "Interviewers evaluate whether you understand protocol layering, encapsulation boundaries, and protocol data units (PDUs) across layers."
        code = "// Protocol Data Units: Layer 4 = Segment (TCP), Layer 3 = Packet (IP), Layer 2 = Frame (Ethernet)"
    elif 'Hub' in clean_q or 'Switch' in clean_q or 'Router' in clean_q:
        ans = "A Hub operates at Layer 1 (Physical), broadcasting incoming electrical signals blindly to all ports (high collision domain). A Switch operates at Layer 2 (Data Link), inspecting MAC addresses to forward frames specifically to the destination port, eliminating collisions. A Router operates at Layer 3 (Network), inspecting IP addresses to route packets across disparate subnetworks using routing tables."
        logic = "Tests foundational networking hardware distinctions and collision vs broadcast domain boundaries."
        code = "// Layer 1: Hub (Broadcasts) | Layer 2: Switch (MAC table) | Layer 3: Router (IP routing table)"
    elif 'MAC' in clean_q or 'IP address' in clean_q or 'ARP' in clean_q:
        ans = "A MAC address is a 48-bit globally unique physical hardware identifier burned into the Network Interface Card (NIC) for local hop-to-hop Layer 2 delivery. An IP address (32-bit IPv4 / 128-bit IPv6) is a logical Layer 3 hierarchical address used for global end-to-end routing. Address Resolution Protocol (ARP) resolves an unknown Layer 2 MAC address from a known Layer 3 IP address via local broadcast request and unicast response."
        logic = "Tests understanding of local frame delivery vs global packet routing and ARP cache table lookup."
        code = "# ARP resolution:\n# Device broadcasts: 'Who has 192.168.1.1? Tell 192.168.1.50'\n# Target replies unicast: '192.168.1.1 is at 00:1A:2B:3C:4D:5E'"
    elif 'Subnet' in clean_q or 'CIDR' in clean_q or 'Private IP' in clean_q or 'NAT' in clean_q:
        ans = "A Subnet Mask divides an IP address into Network and Host portions using contiguous 1s. CIDR (Classless Inter-Domain Routing) notation specifies prefix length (e.g., /24 = 255.255.255.0, giving 254 usable hosts). Private IPs (RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) are non-routable on the public Internet. Network Address Translation (NAT/PAT) maps multiple internal private IP addresses to a single public IP address using unique Layer 4 port numbers."
        logic = "Interviewers test your practical knowledge of cloud VPC design, subnet math, and port address translation (PAT)."
        code = "// CIDR /24: 2^(32-24) - 2 = 254 usable host addresses\n// NAT maps 192.168.1.5:54321 -> 203.0.113.1:60001"
    elif 'DHCP' in clean_q or 'DORA' in clean_q:
        ans = "DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses and network configuration parameters via the 4-way DORA exchange over UDP (ports 67/68): 1) Discover: Client broadcasts discovery request. 2) Offer: DHCP server broadcasts lease offer with candidate IP. 3) Request: Client broadcasts acceptance of the offer. 4) Acknowledgment: Server confirms lease and assigns subnet mask, default gateway, and DNS servers."
        logic = "High-frequency systems question. Interviewers look for the DORA acronym and why broadcast communication is required initially."
        code = "// DHCP DORA Flow: Client -> DISCOVER -> Server -> OFFER -> Client -> REQUEST -> Server -> ACK"
    elif 'TCP vs UDP' in clean_q or 'Handshake' in clean_q or 'Termination' in clean_q:
        ans = "TCP is a connection-oriented, reliable protocol providing guaranteed ordered delivery, flow control, and congestion control via sequence numbers and ACKs. UDP is a connectionless, lightweight, unreliable datagram protocol with minimal header overhead (8 bytes vs 20 bytes) prioritized for real-time traffic (DNS, VoIP, gaming). TCP establishes connections via the 3-Way Handshake (SYN -> SYN-ACK -> ACK) and terminates connections via 4-Way Handshake (FIN -> ACK -> FIN -> ACK with TIME_WAIT state)."
        logic = "Fundamental networking question. Interviewers test whether you know why TIME_WAIT state exists (to handle delayed in-flight duplicate segments)."
        code = "// TCP Handshake: SYN (seq=x) -> SYN-ACK (seq=y, ack=x+1) -> ACK (seq=x+1, ack=y+1)"
    elif 'DNS' in clean_q:
        ans = "DNS (Domain Name System) translates human-readable hostnames into IP addresses: 1) Client checks browser cache -> OS cache -> hosts file. 2) Recursive DNS Resolver is queried (ISP/8.8.8.8). 3) Root Nameserver ('.') returns top-level domain (TLD) server. 4) TLD Nameserver ('.com') returns Authoritative Nameserver. 5) Authoritative Nameserver returns the definitive A / AAAA record IP address. 6) Resolver caches result according to TTL."
        logic = "Interviewers test if you understand the distinction between Recursive resolvers and Authoritative nameservers and TTL caching."
        code = "// DNS Hierarchy: Browser -> Resolver -> Root (.) -> TLD (.com) -> Authoritative (example.com)"
    elif 'HTTP' in clean_q or 'TLS' in clean_q or 'SSL' in clean_q:
        ans = "HTTP is an application-layer text protocol running over cleartext TCP (port 80). HTTPS wraps HTTP in TLS (Transport Layer Security, port 443). The TLS 1.3 handshake uses Asymmetric Public Key Cryptography (ECDHE) to securely agree upon a shared session key, authenticate the server via X.509 Certificate Authorities, and then switch to high-speed Symmetric Encryption (AES-GCM / ChaCha20) for session data."
        logic = "Interviewers test whether you know why asymmetric crypto is used only for the initial key exchange (too computationally expensive for bulk data)."
        code = "// TLS 1.3: 1-RTT handshake negotiating ECDHE keys + AES-GCM symmetric session cipher"
    elif 'URL in the browser' in clean_q:
        ans = "When you press Enter: 1) URL Parsing: Scheme (HTTPS), host, port. 2) DNS Resolution: Browser cache -> OS -> Recursive DNS lookup to get IP. 3) TCP Handshake: SYN -> SYN-ACK -> ACK. 4) TLS 1.3 Handshake: Certificate validation and symmetric key derivation. 5) HTTP Request: Browser sends GET with headers. 6) Server Processing: Reverse proxy -> Web server -> Application logic -> Database query -> 200 OK HTML payload. 7) Browser Rendering: DOM tree construction, CSSOM parsing, Render tree layout, Paint, and Composite."
        logic = "The single most comprehensive full-stack interview question. Demonstrates end-to-end grasp of networking, security, backend, and browser rendering."
        code = "// Lifecycle: DNS -> TCP Handshake -> TLS Handshake -> HTTP GET -> Server Response -> DOM/CSSOM Render"
    elif 'REST' in clean_q or 'HTTP methods' in clean_q or 'Idempotent' in clean_q:
        ans = "REST (Representational State Transfer) is an architectural style based on 6 constraints: Client-Server, Statelessness, Cacheability, Uniform Interface, Layered System, and Code-on-Demand. Safe methods (`GET`, `HEAD`) do not alter server state. Idempotent methods (`GET`, `PUT`, `DELETE`) produce the exact same server state whether executed once or multiple times consecutively. Non-idempotent methods (`POST`) append new resources on each invocation."
        logic = "Interviewers test if you know that PUT replaces an entire resource while PATCH performs partial updates, and which status codes apply."
        code = "// Idempotent: PUT /users/1 (sets state) | Non-Idempotent: POST /users (creates duplicate entries)"
    elif 'JWT' in clean_q or 'Authentication' in clean_q or 'OAuth' in clean_q:
        ans = "Authentication verifies identity ('who you are'); Authorization verifies permissions ('what you are allowed to access'). JWT (JSON Web Token) is a stateless compact token with three Base64URL-encoded parts: Header (algorithm), Payload (claims), and Signature (HMAC/RSA hash of header+payload using secret key). Production JWT auth pairs a short-lived Access Token (15 mins) with a secure, HTTP-only Refresh Token (7 days) subjected to Refresh Token Rotation to prevent token reuse attacks."
        logic = "Interviewers test whether you understand stateless token security: revoking compromised access tokens requires blacklisting or token rotation."
        code = "// JWT Format: header.payload.signature\n// Signature = HMACSHA256(base64Url(header) + '.' + base64Url(payload), secret)"
    elif 'XSS' in clean_q or 'CSRF' in clean_q or 'CORS' in clean_q or 'SQL Injection' in clean_q:
        ans = "SQL Injection (SQLi) injects malicious SQL statements into input fields, mitigated via Parameterized Prepared Statements. XSS (Cross-Site Scripting) executes malicious JavaScript in victim browsers, mitigated via context-aware output encoding and Content Security Policy (CSP). CSRF (Cross-Site Request Forgery) tricks authenticated users into submitting unwanted commands, mitigated via Anti-CSRF tokens and SameSite cookies. CORS (Cross-Origin Resource Sharing) is a browser mechanism that restricts cross-origin HTTP requests using preflight OPTIONS checks."
        logic = "Essential Web Security interview question covering the OWASP Top 10 vulnerabilities and modern defense headers."
        code = "// Defenses: Parameterized queries (SQLi), Content-Security-Policy (XSS), SameSite=Strict cookies (CSRF)"
    elif 'Git' in clean_q or 'Merge vs' in clean_q:
        ans = "Git tracks file changes as snapshots in a directed acyclic graph (DAG). The three trees are Working Directory, Staging Area (Index), and Git Repository (`.git`). Git Merge preserves complete historical context by creating a 3-way merge commit with two parents. Git Rebase reapplies commits from the current branch onto the tip of another branch sequentially, rewriting commit hashes to create a clean, linear project history. Never rebase public shared branches."
        logic = "Interviewers look for understanding of Git internals (content-addressable store via SHA-1/SHA-256) and rebase safety rules."
        code = "# Linear history: git checkout feature && git rebase main\n# Merge: git checkout main && git merge feature"
    elif 'Testing' in clean_q or 'TDD' in clean_q:
        ans = "The Software Testing Pyramid allocates test volume: Unit Tests (~70%, fast, isolated functions), Integration Tests (~20%, database and API interaction), and End-to-End Tests (~10%, full browser/user flows). Test-Driven Development (TDD) follows the Red-Green-Refactor cycle: 1) Red: Write a failing test defining desired behavior. 2) Green: Write minimal production code to pass the test. 3) Refactor: Clean up and optimize while tests guarantee zero regressions."
        logic = "Interviewers evaluate if you prioritize test maintainability and cost: heavy reliance on E2E tests creates slow, brittle test suites."
        code = "// TDD Cycle: 1. Write failing test (RED) -> 2. Make it pass (GREEN) -> 3. Improve structure (REFACTOR)"
    elif 'Linux' in clean_q:
        ans = "Essential Linux tools for engineers: `grep` (pattern search), `find` (filesystem search), `awk` (columnar text processing), `sed` (stream editor), `xargs` (command execution from piped output), `lsof` (list open files/ports), `netstat`/`ss` (network socket statistics), and `top`/`htop` (system resource monitoring). Permissions are octal combinations of Read (4), Write (2), and Execute (1) across User, Group, and Other (e.g., `chmod 755 script.sh`)."
        logic = "Tests hands-on production server debugging ability: inspecting processes, grep filtering logs, and checking open ports."
        code = "# Find listening ports: ss -tulpn | grep :8080\n# Search error logs: grep -i 'error' /var/log/syslog | awk '{print $1, $5}'"
    elif 'Design Pattern' in clean_q or 'Singleton' in clean_q or 'Factory' in clean_q:
        ans = "The Singleton pattern ensures a class has only one instance and provides global access to it, implemented thread-safely using Bill Pugh's static holder class or Double-Checked Locking with `volatile`. Factory Method defines an interface for creating objects, delegating instantiation to subclasses. Strategy pattern defines a family of algorithms, encapsulating each one and making them interchangeable at runtime via composition."
        logic = "Interviewers test whether you understand thread safety in Singletons (`volatile` preventing instruction reordering) and open-closed flexibility in Strategy."
        code = "public class Singleton {\n    private Singleton() {}\n    private static class Holder { static final Singleton INSTANCE = new Singleton(); }\n    public static Singleton getInstance() { return Holder.INSTANCE; }\n}"
    elif 'Parking Lot' in clean_q:
        ans = "A Parking Lot LLD system models multiple floors with designated spot types (Compact, Large, Handicapped, Electric). Core classes include `ParkingLot` (Singleton), `ParkingFloor`, `ParkingSpot`, `Vehicle` (abstract: Car, Bike, Truck), `Ticket`, and `Payment`. Strategy pattern determines parking assignment (nearest to entrance) and fee calculation (hourly vs vehicle type rate)."
        logic = "The gold-standard LLD interview problem. Evaluates clean class relationships, encapsulation, and extensible design patterns."
        code = "public class Ticket {\n    private String ticketId; private LocalDateTime entryTime;\n    private ParkingSpot spot; private Vehicle vehicle;\n}"
    elif 'Vending Machine' in clean_q:
        ans = "A Vending Machine LLD is best designed using the State Pattern to eliminate complex nested `if-else` conditionals. Core states are `IdleState`, `HasMoneyState`, `DispensingState`, and `SoldOutState`, all implementing a common `VendingMachineState` interface. State transitions occur deterministically: inserting money transitions from Idle to HasMoney; selecting a product transitions to Dispensing; releasing product transitions back to Idle."
        logic = "Interviewers check whether you use the State Pattern to encapsulate state-specific behavior cleanly."
        code = "public interface VendingState {\n    void insertCoin(int amount); void selectItem(String code); void dispense();\n}"
    elif 'Scaling' in clean_q or 'URL Shortener' in clean_q or 'Bitly' in clean_q:
        ans = "A Scalable URL Shortener (Bitly) converts 64-bit auto-incrementing IDs into compact alphanumeric strings using Base62 encoding (`[a-zA-Z0-9]`), yielding 62^7 = 3.5 Trillion unique 7-character URLs. Architecture: Nginx Load Balancers -> Stateless Application Servers -> Redis Read-Through Cache (80/20 rule: caching top 20% URLs eliminates 80% DB reads) -> Sharded PostgreSQL or Cassandra database storing `(id, short_url, long_url, user_id, created_at)` with Bloom filters to detect non-existent keys."
        logic = "High-frequency System Design interview question. Tests estimation math, Base62 vs hashing trade-offs, caching, and database partitioning."
        code = "// Base62: Characters = 0-9a-zA-Z (62 chars). ID 125 -> Base62 'cb'"
    elif 'project' in clean_q.lower() or 'resume' in clean_q.lower():
        ans = "When presenting your capstone project, structure your 2-minute pitch using the STAR framework: 1) Situation & Goal: Problem statement and user scale. 2) Architecture: Frontend stack, REST/GraphQL APIs, backend microservices, caching layer, and database selection. 3) Technical Challenge & Trade-offs: Describe a specific bottleneck (e.g., race conditions during checkout, slow database joins) and how you solved it (e.g., Redis caching, optimistic locking). 4) Result & Metrics: Quantifiable latency reduction, test coverage, and throughput."
        logic = "Interviewers want to see that you actually wrote the project rather than cloned a tutorial. They test depth on trade-offs and failure handling."
        code = "// Structure: Context (15s) -> Architecture (45s) -> Technical Bottleneck & Resolution (45s) -> Impact (15s)"
    else:
        ans = f"In technical engineering interviews, '{clean_q}' is analyzed by breaking down its fundamental definition, internal architectural operation, and production trade-offs. You should explain the underlying mechanism, contrast it with alternatives, and provide concrete real-world usage."
        logic = "Interviewers evaluate structured technical articulation: definition first, internal execution mechanics second, and production trade-offs third."
        code = f"// Architectural principle for {clean_q}"

    return ans, logic, code

if __name__ == '__main__':
    enrich_all_days('lib/data/interviewReadyDays.json')
