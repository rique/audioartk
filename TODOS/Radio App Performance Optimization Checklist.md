Integrating these features will transform your radio from a standard web app into a high-performance media platform. Given your 13 years of experience, you’ll likely recognize this as moving from "Basic CRUD" to "High-Throughput Systems" architecture.  
Here is your implementation checklist:

## **1\. Database & Sync Strategy (The "DB-as-Cache" Layer)**

This moves the heavy lifting from the CPU/Disk to the Database.

* \[ \] **Schema Update:** Add title, artist, album, duration, and file\_mtime columns to your Tracks model.  
* \[ \] **Indexing:** Ensure track\_uuid and artist are indexed in PostgreSQL for fast sorting/searching.  
* \[ \] **Initial Migration Script:** Write a one-time Django management command to loop through existing MP3s, parse ID3 tags, and populate the new columns.  
* \[ \] **Sync-on-Demand Logic:** \- \[ \] In loadTrackList, compare the current file os.path.getmtime() with the stored file\_mtime.  
  * \[ \] Only trigger the mutagen ID3 parser if the disk timestamp is newer.  
  * \[ \] Update the database record immediately after a re-parse so the next request is fast.

## **2\. High-Efficiency Backend Streaming**

This prevents the "Gateway Timeout" error by sending data as it’s ready.

* \[ \] **Iterator Implementation:** Refactor loadTrackList to use .iterator() on the Django QuerySet to keep memory usage low.  
* \[ \] **StreamingHttpResponse:** \- \[ \] Wrap the logic in a generator function that yields JSON fragments (e.g., yield json.dumps(track)).  
  * \[ \] Manually handle the JSON array syntax (\[ and ,) within the generator to ensure it’s a valid object upon arrival.  
* \[ \] **Gzip Compression:** Ensure NGINX is configured to gzip JSON responses to reduce the payload size for 20,000 strings.

## **3\. Frontend "Virtual Grid" (The DOM Stability Layer)**

This solves the browser-side performance bottleneck.

* \[ \] **Data Store Setup:** Ensure your frontend can hold the 20k objects in a simple JavaScript array (memory is cheap; DOM nodes are expensive).  
* \[ \] **Virtualization Engine:** \- \[ \] Choose a strategy: Either a library (like Clusterize.js) or a custom implementation using a "Scroll Listener."  
  * \[ \] **Row Height Calculation:** Define a fixed height for your grid rows so the scroll math remains consistent.  
* \[ \] **The "Pinterest" Buffer:** Implement "Look-ahead" rendering (rendering 10 items above and below the fold) to prevent white space during fast scrolling.  
* \[ \] **GridMediator:** \- \[ \] Hook into the scroll event of the main container.  
  * \[ \] Update the innerHTML or React/Vue state of only the visible "slots" in the grid.

## **4\. Integration & Testing**

* \[ \] **Mediator Decoupling:** Ensure the PlaybackMediator is the only thing telling the Virtual Grid which index is "Active," so the Grid doesn't have to search through 20k items itself.  
* \[ \] **Stress Test:** Load a folder with 5,000+ items and monitor the "Time to First Byte" vs. "Time to Interactive."  
* \[ \] **External Edit Test:** Modify a file's metadata in an external player (like VLC or iTunes) and verify that your "Sync-on-Demand" catches the change on the next refresh.

**Which of these feels like the biggest priority to tackle first—the backend database migration or the frontend grid virtualization?**