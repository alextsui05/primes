import type { Route } from "./+types/home";
import { PrimesList } from "../components/PrimesList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Infinite Primes" },
    { name: "description", content: "Scroll to load prime numbers in chunks of 100." },
  ];
}

export default function Home() {
  return <PrimesList />;
}
