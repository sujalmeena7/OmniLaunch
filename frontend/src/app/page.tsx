"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoBar from "@/components/landing/LogoBar";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import LiveDemo from "@/components/landing/LiveDemo";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="landing-page-bg" style={{ minHeight: "100vh", position: "relative" }}>
      <Navbar />
      <Hero />
      <LogoBar />
      <HowItWorks />
      <Features />
      <LiveDemo />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
