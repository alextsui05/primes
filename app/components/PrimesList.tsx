import React from "react";
import { NavLink, useSearchParams } from "react-router";

const CHUNK_SIZE = 100;

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  const limit = Math.floor(Math.sqrt(n));
  for (let i = 2; i <= limit; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

async function nextPrimesChunk(current: number, count = CHUNK_SIZE): Promise<number[]> {
  const out: number[] = [];
  let candidate = Math.max(current, 2);

  // Ensure we start at 2 then iterate through odds only after 2
  if (candidate <= 2) candidate = 2;
  while (out.length < count) {
    if (isPrime(candidate)) {
      out.push(candidate);
    }
    candidate++;
  }
  await sleep(1);
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PrimesList() {
  const [primes, setPrimes] = React.useState<number[]>([]);
  const primesRef = React.useRef<number[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const isLoadingRef = React.useRef<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [start, setStart] = React.useState<number>(2);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    primesRef.current = primes;
  }, [primes]);

  React.useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const loadMore = React.useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    const chunk = await nextPrimesChunk(primesRef.current[primesRef.current.length - 1] ?? 2, CHUNK_SIZE);
    setPrimes((prev) => {
      return prev.concat(chunk);
    });

    isLoadingRef.current = false;
    setIsLoading(false);
  }, []);

  const restart = React.useCallback(async (startingValue: number) => {
    isLoadingRef.current = true;
    setIsLoading(true);
    
    setStart(startingValue);
    setPrimes(await nextPrimesChunk(startingValue, CHUNK_SIZE));
    setSearchParams({ n: startingValue.toString() });

    isLoadingRef.current = false;
    setIsLoading(false);
  }, []);

  // Seed first 100 primes on mount (client only)
  React.useEffect(() => {
    const startingValue = parseInt(searchParams.get("n") ?? "2");
    restart(startingValue);
  }, []);

  // Infinite scroll using IntersectionObserver
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadMore();
        }
      }
    }, {
      root: null,
      rootMargin: "200px", // start loading a bit before reaching bottom
      threshold: 0,
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
    }
  }, []);

  return (
    <main className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Infinite Primes</h1>
      <p className="mb-4 text-gray-600">Scroll down to load more prime numbers in chunks of {CHUNK_SIZE}.</p>
      <p>
        You can also specify the query parameter <code>n</code> to start from a different number.
        For example, you can <NavLink
          to="?n=1000000007" 
          className="text-blue-600 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            restart(1000000007);
          }}
        >start from the 1000000007th prime
        </NavLink>
        by typing in <code>?n=1000000007</code> in the URL.
      </p>

      <p className="flex items-center gap-2 my-4">
        <label htmlFor="start">Start from:</label>
        <input className="border border-gray-200 rounded p-2" type="number" min="2" max="2147483647" id="start" value={start} onChange={(e) => restart(parseInt(e.target.value))} />
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={() => restart(Math.floor(Math.random() * 2147483647))}>I'm feeling lucky</button>
      </p>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {primes.map((p, idx) => (
          <li
            key={idx}
            className="rounded border border-gray-200 p-2 text-center bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm"
            aria-label={`prime-${p}`}
          >
            {p}
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} className="h-12" />
      {isLoading && (
        <div className="py-4 text-center text-gray-500">Loading…</div>
      )}
    </main>
  );
}

export default PrimesList;