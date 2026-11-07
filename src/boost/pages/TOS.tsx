import { motion } from 'framer-motion';
import { Link } from 'wouter';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using boost.sessionguardvip.cc ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. We reserve the right to update these Terms at any time; continued use of the Service after changes constitutes acceptance.`,
  },
  {
    title: '2. Description of Services',
    content: `VipPro Boosts provides digital products including Discord Server Boosts, Discord Nitro tokens, and Discord account tokens (collectively, "Products"). All Products are delivered digitally. We act as a reseller of these Products and are not affiliated with, endorsed by, or sponsored by Discord Inc.`,
  },
  {
    title: '3. Digital Goods Policy - All Sales Final',
    content: `All purchases of digital Products are final and non-refundable by default. Once a digital product has been delivered, it cannot be returned. The nature of digital goods - specifically Discord tokens and Nitro accounts - means they are consumed immediately upon delivery and cannot be "undelivered" or reversed.\n\nRefunds may be considered only in the specific circumstances described in our Refund Policy, which forms part of these Terms. By completing a purchase, you acknowledge that you understand and accept this digital goods policy.`,
  },
  {
    title: '4. Discord Terms of Service Compliance',
    content: `Use of Discord Boosts, Nitro tokens, and Discord account tokens must comply with Discord's Terms of Service (discord.com/terms) and Community Guidelines. MSKHub Boosts does not endorse, encourage, or support any use of our Products that violates Discord's policies. You are solely responsible for how you use delivered Products. We are not liable for any account suspensions, bans, or penalties imposed by Discord as a result of your use of our Products.`,
  },
  {
    title: '5. Eligibility and Account Responsibility',
    content: `You must be at least 13 years of age to purchase Products (or the minimum age required by Discord in your jurisdiction). By purchasing, you represent that you meet this requirement. You are responsible for providing accurate contact information (including your email address) at the time of purchase. We are not responsible for failed deliveries due to incorrect information.`,
  },
  {
    title: '6. Payment',
    content: `All payments are processed through NowPayments, a third-party cryptocurrency payment processor. We accept cryptocurrency payments only. Prices are displayed in USD and converted at current market rates by our payment processor. You are responsible for any network fees or gas fees associated with your payment. Orders are only fulfilled after payment confirmation is received from our payment processor.`,
  },
  {
    title: '7. Prohibited Uses',
    content: `You may not use our Service for any unlawful purpose or in violation of these Terms, including but not limited to: fraud, money laundering, resale without authorization, automated scraping or API abuse, attempts to circumvent security measures, or any activity that violates applicable laws. We reserve the right to cancel any order and refuse service at our discretion.`,
  },
  {
    title: '8. Customer Dashboard',
    content: `A customer order dashboard is planned but is not currently available. Until the dashboard is live, delivered tokens and account items are shown only on the order confirmation page immediately after delivery. You are solely responsible for saving and securing delivered items at the time of delivery. We strongly recommend copying and securely storing all delivered items immediately.`,
  },
  {
    title: '9. Limitation of Liability',
    content: `To the maximum extent permitted by law, VipPro Boosts, its operators, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, resulting from: (a) your use or inability to use the Service; (b) unauthorized access to your data; (c) actions of Discord Inc. including account bans or limitations; or (d) any other matter relating to the Service. Our total liability for any claim shall not exceed the amount you paid for the specific Product giving rise to the claim.`,
  },
  {
    title: '10. Disclaimer of Warranties',
    content: `The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or that defects will be corrected.`,
  },
  {
    title: '11. Governing Law',
    content: `These Terms are governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall first be resolved through our Discord support channel before any formal proceedings. For support, join our Discord server at discord.gg/275XqNhvwa.`,
  },
  {
    title: '12. Contact',
    content: `For questions, disputes, or support regarding these Terms, please contact us through our Discord community at discord.gg/275XqNhvwa. We aim to respond to all inquiries within 48 hours.`,
  },
];

export default function TOS() {
  return (
    <div className="min-h-screen" style={{ background: '#000000', paddingTop: '80px' }}>
      {/* Subtle top glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(255, 255, 255,0.07) 0%, transparent 70%)' }} />

      <div className="max-w-3xl mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(255, 255, 255,0.1)', border: '1px solid rgba(255, 255, 255,0.25)', color: '#FFFFFF' }}>
            Legal Document
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p style={{ color: '#9A9A9E' }}>
            Last updated: October 2026 &nbsp;·&nbsp; Effective immediately upon use of the Service
          </p>
          <div className="mt-4 h-px" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255,0.5), transparent)' }} />
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-6 mb-8"
          style={{ background: '#111113', border: '1px solid rgba(255, 255, 255,0.12)' }}>
          <p style={{ color: '#9A9A9E', lineHeight: 1.75 }}>
            These Terms of Service govern your use of boost.sessionguardvip.cc and all products purchased through it.
            Please read them carefully. By placing an order, you agree to be bound by these Terms.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="rounded-xl p-6"
              style={{ background: '#0d0b12', border: '1px solid rgba(255, 255, 255,0.08)' }}>
              <h2 className="text-lg font-bold text-white mb-3">{section.title}</h2>
              <p style={{ color: '#9A9A9E', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-6 flex flex-wrap gap-4 items-center"
          style={{ borderTop: '1px solid rgba(255, 255, 255,0.1)' }}>
          <Link href="/">
            <a className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all"
              style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' }}>
              ← Back to Store
            </a>
          </Link>
          <Link href="/privacy">
            <a className="text-sm underline" style={{ color: '#9A9A9E' }}>Privacy Policy</a>
          </Link>
          <Link href="/refund">
            <a className="text-sm underline" style={{ color: '#9A9A9E' }}>Refund Policy</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
