import NavBar from '@/components/NavBar'
import HeroSection from '@/components/HeroSection'
import MarqueeBar from '@/components/MarqueeBar'
import ProblemSection from '@/components/ProblemSection'
import SolutionSection from '@/components/SolutionSection'
import VerticalsSection from '@/components/VerticalsSection'
import PortfolioSection from '@/components/PortfolioSection'
import NewWorldTeaser from '@/components/NewWorldTeaser'
import HowSection from '@/components/HowSection'
import PricingSection from '@/components/PricingSection'
import PaySection from '@/components/PaySection'
import VisionSection from '@/components/VisionSection'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <MarqueeBar />
        <ProblemSection />
        <SolutionSection />
        <VerticalsSection />
        <PortfolioSection />
        <NewWorldTeaser />
        <HowSection />
        <PricingSection />
        <PaySection />
        <VisionSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
