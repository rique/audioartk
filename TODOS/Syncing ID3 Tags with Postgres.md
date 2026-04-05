That is a classic "Source of Truth" dilemma. You are prioritizing the **integrity** of the file over the **performance** of the database, which is a common concern in media-heavy applications. However, at 20,000 tracks, 20,000 disk I/O operations will eventually cause your NGINX/Django connection to timeout.  
Here is how to bridge that gap: keep the file as the master, but use the database as a "high-speed cache."

## ---

**1\. The "Sync-on-Demand" Strategy**

Instead of parsing 20,000 files every time a user refreshes, you can use a **Last Modified** check.

1. Store the ID3 data in Postgres.  
2. Store a file\_mtime (last modified time) column in Postgres.  
3. **The Optimization:** When you load the list, only re-parse the ID3 tag **if** the file's current mtime on disk is newer than what’s in the DB.

This gives you the speed of a database query for 19,995 tracks and the accuracy of a disk-parse for the 5 tracks you just edited in another player.

## ---

**2\. Virtualizing the Grid (The "Pinterest" Approach)**

You are absolutely right—rendering 20,000 rows will freeze the browser. The technique you're looking for is called **DOM Virtualization** (or Windowing).  
Instead of creating 20,000 \<tr\> elements, you create a "Window" of about 30-50 rows. As the user scrolls, you calculate which tracks should be visible based on the scrollTop and simply swap the data inside those existing 50 rows.

## **How the Mediator handles this:**

* **TracklistStore:** Holds the massive array of 20,000 JSON objects in memory (JavaScript handles 20k objects in an array very easily).  
* **GridMediator:** Listens for scroll events on the container.  
* **The Logic:** 1\. Calculate: const startIndex \= Math.floor(container.scrollTop / rowHeight);  
  2\. Slice the array: const visibleTracks \= allTracks.slice(startIndex, startIndex \+ 50);  
  3\. Update the 50 DOM nodes with the new data.

## ---

**3\. The StreamingHttpResponse for 20k JSON Objects**

If you want to stick with your current ID3-on-the-fly logic but avoid the "White Screen of Death" while the user waits for 20,000 files to be parsed, you can stream the JSON.  
This allows the frontend to receive the first 100 tracks and **start rendering the grid** while the backend is still grinding away at the remaining 19,900.

## **The Django Implementation:**

Python

import json  
from django.http import StreamingHttpResponse

def loadTrackList(request):  
    def stream\_json\_tracks():  
        yield '{"success": true, "tracklist": \['  
          
        tracks\_query \= Tracks.objects.all().iterator() \# Use iterator() to save Django memory  
        first \= True  
          
        for trk in tracks\_query:  
            if not first:  
                yield ','  
              
            \# \--- Your existing ID3 logic here \---  
            \# (Note: This is still slow, but the UI can start updating immediately)  
            track\_data \= {  
                'uuid': trk.track\_uuid,  
                'title': extract\_title(trk.track\_uuid), \# helper function  
                'artist': extract\_artist(trk.track\_uuid),  
                \# ...  
            }  
              
            yield json.dumps(track\_data)  
            first \= False  
              
        yield '\]}'

    return StreamingHttpResponse(stream\_json\_tracks(), content\_type="application/json")

## **The Frontend "Streaming" Challenge:**

Standard fetch().then(res \=\> res.json()) won't work here because .json() waits for the **entire** stream to finish. To benefit from streaming, you need to use a **NDJSON** (Newline Delimited JSON) pattern or a library like oboe.js that can parse a JSON stream as it arrives.

## ---

**4\. Architectural Summary**

Since you are a Full Stack developer with 13 years of experience, I'd suggest this hybrid approach for your "JS Radio":

1. **Backend:** Use a management command or a background task to **pre-parse** ID3 data into your Postgres columns. (Treating the DB as a cache).  
2. **Web Frontend:** Implement the **Virtual Grid** Mediator. Even 1,000 tracks will feel slow without virtualization.  
3. **Media Mediator:** Since the User Summary mentioned your focus on **Backend** over **UI/UX**, using a library like Clusterize.js or TanStack Virtual could save you a lot of headache in the browser.

**How are you planning to trigger the re-sync if the user edits an ID3 tag externally? Would a "Refresh Library" button satisfy your sync concerns?**