"use client";

import { Users, Building2, Quote } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { GradientOrb } from "@/components/motion/GradientOrb";
import { MissionIllustration } from "@/components/illustrations/MissionIllustration";

type AboutContentProps = {
  title: string;
  intro: string;
  paragraph2: string;
  paragraph3: string;
  mission: string;
};

export function AboutContent({ title, intro, paragraph2, paragraph3, mission }: AboutContentProps) {
  return (
    <>
      <section className="relative overflow-hidden bg-primary-50/50 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <Reveal>
            <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">{title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-primary-900/80">{intro}</p>
          </Reveal>
          <Reveal delay={0.15} className="mx-auto aspect-square w-full max-w-sm">
            <MissionIllustration className="h-full w-full" />
          </Reveal>
        </div>
      </section>

      <StaggerGrid className="mx-auto mt-14 grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2">
        <StaggerItem>
          <Card className="flex h-full flex-col">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-base leading-relaxed text-primary-900/80">{paragraph2}</p>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="flex h-full flex-col">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="text-base leading-relaxed text-primary-900/80">{paragraph3}</p>
          </Card>
        </StaggerItem>
      </StaggerGrid>

      <section className="relative mt-16 overflow-hidden bg-mauve-50 px-4 py-20 sm:px-6">
        <GradientOrb
          colors={["var(--color-mauve-200)", "var(--color-mauve-100)"]}
          className="pointer-events-none absolute -top-20 -end-20 h-72 w-72 opacity-50"
        />
        <Reveal className="relative mx-auto max-w-2xl text-center">
          <Quote className="mx-auto h-10 w-10 text-mauve-300" aria-hidden="true" />
          <p className="mt-4 text-xl font-semibold leading-relaxed text-primary-800 sm:text-2xl">{mission}</p>
        </Reveal>
      </section>
    </>
  );
}
