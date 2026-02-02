# Project Ideas

## Project Idea: Comprehensive Suite of Code Actions & Refactorings

### Abstract
Modern development isn't just about writing code; it's about evolving it. Code Actions (Quick Fixes and Refactorings) are essential for developer productivity, automating tedious tasks like generating boilerplate, fixing compilation errors, or restructuring logic.

This project focuses on building a rich library of Code Actions for clice. The goal is to port essential features from existing tools (like Clangd) and implement new, innovative refactorings that leverage our server's architecture, transforming it into a powerful assistant for C++ developers.

### The Problem
Currently, clice has a basic infrastructure for Code Actions but lacks the breadth of features found in mature IDEs. Developers still have to manually copy-paste function signatures to create definitions, manually fill out `switch` statements, or rewrite generic code by hand. This breaks the "Flow" state and introduces human error.

### Project Goals
The project is divided into three tiers of complexity:

1.  **Essential "Quick Fixes" (The Basics):**
    * **Create Definition:** Automatically generate the function body in a `.cpp` file based on a declaration in a `.h` file (handling namespaces and class qualifiers correctly).
    * **Add Include:** If a type is unknown, suggest inserting the correct `#include`.
    * **Populate Switch:** Automatically generate `case` statements for all values of an `enum` in a switch block.

2.  **Structural Refactorings (Intermediate):**
    * **Extract Variable:** Turn a complex expression into a local variable.
    * **Invert if-statement:** Flip the logic of an `if-else` block (e.g., `if (a) { x } else { y }` $\to$ `if (!a) { y } else { x }`).
    * **Raw String Literals:** Convert standard string escaping to C++11 Raw String Literals (and vice-versa).
    * **Auto to Explicit:** Toggle between `auto` and the concrete type name.

3.  **Infrastructure & Polish:**
    * Ensure all actions respect the user's formatting style (e.g., clang-format).
    * Implement "Selection-based" triggers (actions that only appear when specific code is highlighted).
    * Optimize the "Tweak" framework to allow easy addition of future actions.

### Technical Details
* **AST Traversal:** The student will use the Clang AST to identify "trigger points" (e.g., is the cursor on an `enum` inside a `switch`?).
* **Source Editing:** Calculating the precise `TextEdit` operations (line/column replacements) without breaking surrounding code.
* **Porting & Adaptation:** Much of the logic can be referenced from LLVM's Clangd (`clang-tools-extra/clangd/refactor/tweaks`), but it needs to be adapted to clice's specific AST management and threading model.

### Example Scenarios

**Scenario A: Populate Switch**
*Before:*
```cpp
enum Color { RED, GREEN, BLUE };
Color c = RED;
switch(c) { ^ } // Cursor here
```
*After Action:*
```cpp
switch(c) {
    case RED: break;
    case GREEN: break;
    case BLUE: break;
}
```

**Scenario B: Create Definition**
*Header:*
```cpp
class MyClass { void doWork(int a);^ }; // Trigger here
```
*Source (Automatically updated):*
```cpp
void MyClass::doWork(int a) {
    // TODO: implementation
}
```

### Expected Outcomes
* Implementation of at least 5-8 high-value Code Actions (priority on *Create Definition* and *Populate Switch*).
* A unified framework for registering and testing new actions.
* Unit tests ensuring that code modifications are syntactically correct.

### Skills Required
* **C++ Proficiency:** Comfortable with modern C++ standards.
* **AST Manipulation:** Understanding of how source code is represented as a tree (Clang AST experience preferred but can be learned).
* **Attention to Detail:** Handling edge cases (macros, templates, comments) is crucial for refactoring tools.

### Difficulty
**Medium**. The logic for many of these actions is well-documented in the Clang community, making this an excellent project for students who want to get their hands dirty with Compiler Frontends without needing deep theoretical background in type systems.

### Mentors
[ykiko](https://github.com/16bit-ykiko)

## Intelligent Code Completion for C++ Templates via Heuristic Type Resolution

### Abstract
C++ templates are notoriously difficult for language servers to handle. When writing code inside an uninstantiated template, tools usually fail to provide code completion, go-to-definition, or hover information because the types are "dependent" on unknown template arguments.

This project aims to implement and perfect a **Heuristic Type Resolver** for clice. By assuming the primary template definition and simulating template argument substitution, we can provide rich IntelliSense features inside templates, significantly improving the developer experience for generic programming.

### The Problem
Consider the following C++ code:

```cpp
template <typename T>
struct Wrapper {
    std::vector<std::vector<T>> container;

    void process() {
        // Issue: Language servers usually don't know what 'container[0]' returns here.
        // It returns a dependent type (e.g., std::vector<T>&), so completion fails.
        container[0].^ 
    }
};
```

In standard compilation, the compiler cannot know the members of `container[0]` until `Wrapper` is instantiated with a concrete type (due to potential template specializations). However, 99% of the time, users expect the tool to assume the **primary template** definition is used.

See also [improve code completion inside templates](https://github.com/clangd/clangd/issues/443) and [pseudo Template Instantiation in clang](https://discourse.llvm.org/t/pseudo-template-instantiation-in-clang/81406).

### Current Status
We have a prototype/demo implementation ported from experimental Clangd patches. It implements a basic `TemplateResolver` capable of:
1.  Recursively simplifying nested `DependentNameType`.
2.  Performing basic "Find and Replace" of template parameters within the AST to deduce probable types.

However, the current implementation is a proof-of-concept and lacks support for complex C++ features, leading to failures in real-world STL usage.

### Project Goals (The Scope)
The student will work on robustifying the Template Resolver. Key tasks include:

1.  **Enhance Recursive Simplification:**
    * Improve the logic to unwrap complex nested types (e.g., `typename A<T>::B::type`).
    * Implement logic to "see through" standard type aliases (like `std::vector<T>::reference` $\to$ `T&`).

2.  **Handle Edge Cases in Template Instantiation:**
    * **Default Template Arguments:** Correctly handle cases like `template <typename T, typename U = int>` where `U` might be implicit.
    * **Variadic Templates:** Support argument unpacking for `template <typename... Args>`.
    * **Depth Mismatch:** Fix existing bugs where nested template depths cause deduction failures (as discussed in previous research).

3.  **LSP Feature Integration:**
    * Ensure the resolved types flow correctly into Code Completion, Hover, and Go-to-Definition services.
    * Provide "Inlay Hints" for dependent variables to show users what the tool *thinks* the type is.

### Technical Details & Approach
The core of this project involves manipulating the Clang AST (assuming your server is Clang-based) without triggering full template instantiation.
* **Heuristic Strategy:** Instead of waiting for a concrete `T`, we treat `T` as a placeholder and symbolically execute lookups on the primary template `std::vector`.
* **Mechanism:**
    * Locate the primary template declaration.
    * Map the provided arguments to parameters.
    * Use `Sema` or custom logic to substitute types (e.g., transforming `std::vector<T>::iterator` into the actual iterator class definition).

### Expected Outcomes
* A robust `HeuristicResolver` module integrated into clice.
* Working code completion for common STL containers (vector, map) inside template functions.
* A comprehensive test suite covering nested templates, type aliases, and default arguments.

### Skills Required
* **Advanced C++:** Familiarity with Template Metaprogramming (SFINAE, partial specialization).
* **Compiler Frontend Knowledge:** Understanding of Abstract Syntax Trees (AST), Types (Dependent vs. Concrete), and basic Lookup rules. (Experience with Clang AST is a huge plus).
* **Problem Solving:** Ability to debug complex recursive algorithms.

### Difficulty
**Hard**. This involves deep dives into the C++ type system and handling cases where the standard "rules" of C++ compilation must be bent to provide a good user experience.

### Mentors

[ykiko](https://github.com/16bit-ykiko)

