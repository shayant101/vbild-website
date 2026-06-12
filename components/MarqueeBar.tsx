const ITEMS = [
  { icon: '🍽️', label: 'Restaurants' },
  { icon: '💨', label: 'Smoke Shops' },
  { icon: '🎮', label: 'Gaming Venues' },
  { icon: '🐄', label: 'Ranches & Events' },
  { icon: '📅', label: 'Booking Venues' },
  { icon: '⚡', label: 'AI Agents' },
  { icon: '🏪', label: 'Retail' },
  { icon: '🚀', label: 'Built in Days' },
  { icon: '💡', label: 'AI-First' },
  { icon: '📱', label: 'Mobile-Optimized' },
  { icon: '🔐', label: 'Secure' },
  { icon: '🌐', label: 'Custom Domains' },
]

// Duplicate for seamless loop
const ALL = [...ITEMS, ...ITEMS]

export default function MarqueeBar() {
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee-track">
        {ALL.map((item, i) => (
          <div className="marquee-item" key={i}>
            <span>{item.icon}</span> {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
