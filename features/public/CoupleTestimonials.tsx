"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const testimonials = [
  {
    comment: "We stopped feeling like project managers and started enjoying our engagement again.",
    names: "Thandi & Michael",
    location: "Cape Town",
    image: "/assets/Engaged-Couple.jpeg",
  },
  {
    comment: "Every supplier, payment and guest detail finally lived in one calm, beautiful place.",
    names: "Naledi & James",
    location: "Johannesburg",
    image: "/vow-planner-profile-1.jpeg",
  },
  {
    comment: "Our planner and family always knew what was next, without endless message threads.",
    names: "Amina & Daniel",
    location: "Durban",
    image: "/vow-planner-profile-2.jpeg",
  },
];

export function CoupleTestimonials() {
  const { text } = useLanguage();
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % testimonials.length),
      3_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const testimonial = testimonials[active];
  return (
    <section className="story-section page-width" id="stories" aria-live="polite">
      <div className="story-photo">
        <Image
          fill
          sizes="(max-width: 760px) 100vw, 42vw"
          src={testimonial.image}
          alt={testimonial.names}
        />
      </div>
      <div className="story-copy" key={testimonial.names}>
        <p className="story-mark">“</p>
        <blockquote>{text(testimonial.comment)}</blockquote>
        <p>
          {testimonial.names} · {text("Married in")} {testimonial.location}
        </p>
        <div className="story-dots" aria-label={text("Choose testimonial")}>
          {testimonials.map((item, index) => (
            <button
              aria-label={`${text("Show story from")} ${item.names}`}
              aria-pressed={active === index}
              key={item.names}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
        <Link className="button button-primary" href="/register">
          {text("Begin your story")}
        </Link>
      </div>
    </section>
  );
}
