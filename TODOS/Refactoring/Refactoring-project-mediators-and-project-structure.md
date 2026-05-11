Based on the files and project structure you’ve provided, I’ve conducted a critical audit. You are correct—there is a significant "architectural drift" where the same patterns are being implemented in conflicting ways.

### ---

**1\. Critical Audit: The Mediators**

Currently, your mediators are a mix of **Singleton Objects** (e.g., PlaybackMediator) and the newer **Class-based approach** we discussed earlier.

**The Inconsistencies:**

* **Direct DOM Access in Mediators**: PlayerControlMediator.js is doing document.querySelector('.cnt-overlay'). This violates the Mediator pattern; the mediator should only talk to **Components**, never the DOM directly.

* **Initialization Fragmentation**: Some use init(...), some use \_bindEvents(), and others use \_setupSubscriptions(). When you scale to a "V1", debugging "who is listening to what" will be a nightmare.

* **Internal State Leaks**: PlaybackMediator.js tracks \_comingNextFired, while PlaybackNotificationMediator.js tracks \_isNextTrackfired. This duplicated logic means your UI notification might think a track is coming, but the grid doesn't, causing visual desync.

**The Fix:**  
Standardize all mediators in ui/mediators/ to follow the exact same class structure as TrackArtMediator:

1. **Constructor**: For dependency injection.  
2. **Setup()**: For event binding.  
3. **Destroy()**: For cleanup.

### ---

**2\. Critical Audit: Project Structure**

Your current structure is "feature-heavy" but "layer-light."  
**The Issues:**

* **Visuals Overload**: ui/visuals/ is incredibly nested (e.g., ui/visuals/graphs/engines/...). This deep nesting makes imports difficult to manage and suggests that the visualizers are becoming a "sub-app" rather than a component of the UI.  
* **The "Core" Identity Crisis**: ContextDecorators.js and Utils.js are in core, but they are often UI-specific.  
* **Missing API Layer**: You have HttpClient.js, but no dedicated services/ layer. Your components or mediators are likely calling the API directly, which makes switching to your future "Backend" folder harder.

**Proposed Structure Refactor:**

Plaintext

frontend/js/src/  
├── app.js (Entry point)  
├── core/ (Pure logic: EventBus, HttpClient)  
├── data/ (NEW: API Services, LocalStorage adapters)  
├── domain/ (Entities: Track, Playlist; State: AudioPlayer)  
└── ui/  
    ├── base/ (HTMLItem.js, BaseComponent.js)  
    ├── components/ (Re-usable units: ProgressBar, SideBarItem)  
    ├── containers/ (High-level views: PlayerUI, GridView)  
    ├── mediators/ (Standardized Classes ONLY)  
    └── visuals/ (Flattened: move engines/strategies up one level)

### ---

**3\. The Path to V1: Addressing the "Most Important"**

Since **UI Redesign** is your priority, you must stop the "DOM bleeding" immediately.

* **HTMLItem as the Gatekeeper**: No mediator or component should ever use document.querySelector again. If PlayerControlMediator needs to hide the overlay, it should call this.overlayComponent.hide().  
* **CSS Variable Injection**: Your ui/base/HTMLItem should handle themes. This allows you to redesign the UI by changing a single theme object without touching the JavaScript logic of your 20K track grid.

### **4\. Planning for 20K+ Tracks**

The structure you have now will fail at 20,000 tracks because GridView.js and RowTemplates.js appear to be creating real DOM nodes for every track.

* **Immediate Action**: Move RowTemplates.js from grid/ to a base/ or components/ folder and turn it into a **Flyweight Pattern**.  
* **The Backend**: When you create your backend/ folder, focus on a **Streaming JSON Parser**. You shouldn't wait for a 5MB JSON file of 20K tracks to download before the UI shows the first 20\.

**Does the idea of moving DOM manipulation out of the Mediators and into the HTMLItem base class feel like the right first step for your refactoring?**