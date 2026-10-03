import NavBar from '@/components/NavBar'
import HeroV2 from '@/components/v2/HeroV2'
import MarqueeBar from '@/components/MarqueeBar'
import DemoSection from '@/components/v2/DemoSection'
import WhyNowSection from '@/components/v2/WhyNowSection'
import SolutionSection from '@/components/SolutionSection'
import WorkSection from '@/components/v2/WorkSection'
import HowSection from '@/components/HowSection'
import VerticalsSection from '@/components/VerticalsSection'
import PricingSection from '@/components/PricingSection'
import NewWorldTeaser from '@/components/NewWorldTeaser'
import FounderSection from '@/components/v2/FounderSection'
import InvestorStrip from '@/components/v2/InvestorStrip'
import PaySection from '@/components/PaySection'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <HeroV2 />
        <MarqueeBar />
        <DemoSection />
        <WhyNowSection />
        <SolutionSection />
        <WorkSection />
        <HowSection />
        <VerticalsSection />
        <PricingSection />
        <NewWorldTeaser />
        <FounderSection />
        <InvestorStrip />
        <PaySection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
