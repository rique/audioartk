Since you are moving away from Singletons and static objects, you need a dedicated place to handle the lifecycle of your mediators. In a clean architecture, this happens in an **App Factory** or a **Main Controller** during the application's bootstrap phase.

### **1\. Where to Instantiate?**

You should instantiate them in your entry point (e.g., app.js or a Main.js class). This ensures that all dependencies are ready before the user starts interacting with the UI.

### **2\. How to Instantiate?**

Instead of the mediator "finding" its components using document.querySelector, you now **inject** the components into the mediator. This makes your code testable and decoupled.  
Here is the pattern for your bootstrap logic:

JavaScript

// app.js (The Bootstrapper)

// 1\. Instantiate the "heavy lifters" (Core/Domain)  
const eventBus \= new EventBus();  
const audioEngine \= new AudioEngine(eventBus);

// 2\. Instantiate UI Components (using HTMLItem)  
const trackArtComponent \= new TrackArtComponent(document.querySelector('\#track-art-container'));  
const controlsComponent \= new ControlsComponent(document.querySelector('\#controls-container'));

// 3\. Instantiate Mediators & Inject Dependencies  
// This is the only place these "new" keywords should live for these classes  
const trackArtMediator \= new TrackArtMediator(eventBus, trackArtComponent);  
const playbackMediator \= new PlaybackMediator(eventBus, audioEngine, controlsComponent);

// 4\. Initialize them  
trackArtMediator.setup();  
playbackMediator.setup();

### ---

**3\. Who "Owns" Them?**

To avoid them being garbage collected or losing track of them, you can store them in a simple **Registry** or a Map within your main App class:

* **The App Object**: A top-level class App can hold an array or object called this.mediators \= \[\].  
* **The Benefit**: When you eventually implement a "Theme Switch" or a "Logout," you can simply loop through this.mediators.forEach(m \=\> m.destroy()) to clean up all event listeners at once.

### **Why this is better than static:**

1. **Memory Management**: You can destroy() a mediator when it’s not needed (e.g., if you move from the "Player" view to a "Settings" view).  
2. **Explicit Dependencies**: By looking at the new Mediator(...) line, you immediately see exactly what that mediator needs to function (EventBus, specific components, etc.).  
3. **No Direct DOM**: The mediator no longer cares *where* the HTML is; it only cares about the component instance you gave it.

**Should we look at how to structure the BaseMediator class so that the setup() and destroy() methods handle the EventBus subscriptions automatically?**