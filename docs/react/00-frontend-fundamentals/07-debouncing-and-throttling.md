# Debouncing and Throttling

Debouncing and throttling are two ways to control how often a function runs when events fire rapidly.

They matter for:

- search inputs
- resize handlers
- scroll listeners
- drag interactions
- analytics event emission

If you do not control high-frequency events, the page wastes CPU and user interactions feel worse.

---

## Debounce

Debounce waits until the event has stopped firing for a given amount of time.

Mental model:

- keep resetting the timer
- run once after the user pauses

Best for:

- search boxes
- autosave
- validation after typing stops

```ts
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

---

## Throttle

Throttle guarantees execution at most once per interval.

Mental model:

- allow one call now
- suppress extra calls until the window ends

Best for:

- scroll position updates
- resize recalculation
- mousemove / pointer tracking

```ts
function throttle<T extends (...args: any[]) => void>(fn: T, interval: number) {
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRun >= interval) {
      lastRun = now;
      fn(...args);
    }
  };
}
```

---

## Difference in Plain English

Debounce:

- "Wait until the noise stops, then run once."

Throttle:

- "Run at a controlled rate while the noise continues."

That is the interview answer in one line.

---

## Which One to Use

Use debounce when the final value matters more than intermediate values.

Examples:

- user stops typing
- user finishes resizing

Use throttle when intermediate updates still matter, but not at full event frequency.

Examples:

- update scroll progress bar
- reposition floating UI while dragging

---

## React Considerations

In React, two things matter:

- stable function identity
- cleanup on unmount

If you recreate the debounced function every render, the timer logic resets and the optimization breaks.

```tsx
import { useMemo, useEffect } from 'react';

function SearchBox() {
  const debouncedSearch = useMemo(
    () => debounce((value: string) => console.log(value), 300),
    []
  );

  useEffect(() => {
    return () => {
      // if your debounce implementation exposes cancel(), call it here
    };
  }, []);

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

---

## Pitfalls

- debouncing a function that must feel immediate
- throttling a search input and sending too many requests anyway
- forgetting cleanup for delayed side effects
- using long delays that make the UI feel laggy

These are control tools, not "make everything slower" tools.

---

## Interview Answer

### Debounce vs throttle?

Debounce waits until rapid events stop and then runs once. Throttle limits execution to at most once per time window while events continue firing.

### When would you use each?

Use debounce for search or autosave where the final user input matters. Use throttle for scroll, resize, or pointer movement where you still want periodic updates without running on every event.
