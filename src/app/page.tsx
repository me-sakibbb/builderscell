import { Nav } from "@/components/sections/nav";
import { Loader } from "@/components/sections/loader";
import { Hero } from "@/components/sections/hero";
import { Numbers } from "@/components/sections/numbers";
import { Myths } from "@/components/sections/myths";
// Temporarily hidden: Journey, Cell, Shop, Teams. Restore the imports and JSX below to bring them back.
// import { Journey } from "@/components/sections/journey";
import { Kit } from "@/components/sections/kit";
import { Playground } from "@/components/sections/playground";
import { Bootcamp } from "@/components/sections/bootcamp";
// import { Cell } from "@/components/sections/cell";
import { Curriculum } from "@/components/sections/curriculum";
import { Mentors } from "@/components/sections/mentors";
// import { Shop } from "@/components/sections/shop";
// import { Teams } from "@/components/sections/teams";
import { Outcome } from "@/components/sections/outcome";
import { Join } from "@/components/sections/join";
import { Footer } from "@/components/sections/footer";
import { RevealRoot } from "@/components/ui/reveal";
import { Canvas3D } from "@/components/three";

export default function Home() {
  return (
    <>
      <Loader />
      <Nav />
      <main>
        <Hero />
        <Numbers />
        <Myths />
        {/* Bootcamp temporarily takes Journey's slot; it originally sat after Playground. */}
        {/* <Journey /> */}
        <Bootcamp />
        <Kit />
        <Playground />
        {/* <Cell /> */}
        <Curriculum />
        <Mentors />
        {/* <Shop /> */}
        {/* <Teams /> */}
        <Outcome />
        <Join />
      </main>
      <Footer />
      <Canvas3D />
      <RevealRoot />
    </>
  );
}
