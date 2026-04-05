# Vanilla Media Engine (VME) — Pure JS Architecture

A sophisticated, high-performance media playback and grid management system built with **Zero Third-Party Dependencies**. This project serves as a technical demonstration of advanced software engineering patterns implemented exclusively in Vanilla JavaScript (ES2026+).

## 💡 The "Vanilla-First" Philosophy

The primary objective of this project was to solve complex UI/UX challenges—such as high-frequency state synchronization and dynamic DOM injection—without the crutch of modern frameworks like React or Vue. 

### Custom Engineered Solutions:
* **Reactive State Management:** A custom-built `ListEvents` bus that handles cross-component communication without Redux or Pinia.
* **Virtual DOM-lite Reconciliation:** Manual DOM manipulation strategies that ensure atomic updates, preserving the audio playback node's stability during full-grid re-renders.
* **The Mediator Pattern:** A centralized `PlaybackMediator` that manages the heavy lifting of context switching between the Global Search, Main Library, and Dynamic Queue.

## 🏗 Architectural Highlights

Instead of relying on library-provided hooks, the system utilizes raw browser APIs and Design Patterns to maintain a clean separation of concerns:

* **Domain-Driven Design (DDD):** Business logic for playback (shuffling, repeating, queue depletion) is strictly isolated from the rendering engine.
* **Sticky Anchor Algorithm:** A custom geometric calculation that pins the Queue UI to specific Main Grid rows, handling real-time index shifts during playback.
* **Resource Management:** Efficient memory usage through the use of Generators (`*forEachTrack`) and clean-up cycles to prevent memory leaks in a long-running SPA (Single Page Application) environment.

## 🚀 Key Technical Wins

* **Zero Dependencies:** 100% Vanilla JS, CSS3, and HTML5. No npm, no polyfills, no bloat.
* **Interrupt-Free UI:** Closing a search bar or re-rendering a 1000+ row grid never interrupts the active `AudioContext`.
* **Contextual UI Injection:** The ability to inject a sub-grid (Queue) into a parent grid (Main) while maintaining independent scroll and hover states.

## 🛠 Project Status & Roadmap

- [x] **Core Engine:** Vanilla event bus and state management.
- [x] **Mediator Layer:** Stable context-switching between Search and Library.
- [ ] **Phase 4: Manual Drag & Drop:** Native HTML5 Drag and Drop API implementation for track reordering.
- [ ] **Phase 5: LocalStorage Sync:** Custom persistence layer for session recovery.

---
*Developed by a Full Stack Architect with 13+ years of experience, focusing on the power of the native Web Platform.*