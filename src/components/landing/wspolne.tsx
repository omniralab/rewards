"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function Sekcja({ id, children, className = "", invert = false }: { id?: string; children: ReactNode; className?: string; invert?: boolean }) {
  return (
    <section id={id} {...(invert ? { "data-invert": "" } : {})} className={`px-4 py-20 sm:px-8 md:py-28 ${className}`}>
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}

export function Naglowek({ brow, tytul, lead, className = "" }: { brow: string; tytul: ReactNode; lead?: ReactNode; className?: string }) {
  return (
    <Wejscie className={`max-w-[760px] ${className}`}>
      <div className="label eyebrow">{brow}</div>
      <h2 className="display mt-4 text-[length:var(--t-h2)] leading-[1.05]">{tytul}</h2>
      {lead ? <p className="mt-5 max-w-[62ch] text-[length:var(--t-lead)] leading-relaxed text-dim">{lead}</p> : null}
    </Wejscie>
  );
}

export function Wejscie({ children, className = "", opoznienie = 0 }: { children: ReactNode; className?: string; opoznienie?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: opoznienie }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
