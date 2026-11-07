import { motion } from 'framer-motion';
import { Link } from 'wouter';

const sections = [
  {
    title: 'What Information We Collect',
    content: `When you make a purchase, we collect the following information:

• **Email address** - provided by you at checkout, used to associate your order with a contact point for support.
• **Order details** - the product you purchased, the quantity, and the total price paid.
• **Payment reference IDs** - transaction identifiers provided by our payment processor (NowPayments) to track payment status. We do not receive or store your crypto wallet details beyond what NowPayments shares with us.
• **IP address** - logged temporarily for fraud prevention and abuse protection. Not used for tracking or marketing.

We do NOT collect:
• Credit card numbers or banking information (all payments are handled entirely by NowPayments).
• Discord account credentials or passwords.
• Personal identity documents.`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use the information we collect solely to:

• Process and fulfill your order.
• Contact you if there is an issue with your order (using the email address you provided).
• Detect and prevent fraudulent activity.
• Resolve disputes if they arise.

We do not use your information for targeted advertising, profiling, or any purpose unrelated to your order.`,
  },
  {
    title: 'Data Storage and Retention',
    content: `Your order data (email, product, quantity, payment reference) is stored in our secure database. We retain order records for a reasonable period to handle disputes, chargebacks, and support requests - typically 90 days after order completion, after which records may be anonymized or deleted.

Delivered token strings are stored temporarily to allow retrieval on the order confirmation page. Once the customer dashboard is available, we intend to allow users to delete their token history on request.`,
  },
  {
    title: 'No Sale of Personal Data',
    content: `We do not sell, rent, trade, or otherwise transfer your personal information to third parties for commercial purposes. Your data is never shared with advertisers or data brokers.

We may share data with:
• **NowPayments** - our payment processor, solely for payment processing. Subject to their privacy policy at nowpayments.io.
• **Law enforcement** - only if required by a valid legal obligation.`,
  },
  {
    title: 'Cookies and Tracking',
    content: `Our website does not use tracking cookies or third-party analytics scripts. We may use browser local storage for functional purposes such as remembering your session within a single visit. No persistent tracking identifiers are set.`,
  },
  {
    title: 'Security',
    content: `We take reasonable technical measures to protect your data, including encrypted connections (HTTPS), rate limiting, and access controls on our databases. However, no system is completely secure. We recommend you use a unique email address when purchasing and do not share your order confirmation URL with others, as it contains your order ID.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to:
• Request a copy of the data we hold about you.
• Request correction of inaccurate data.
• Request deletion of your data, subject to our legal and operational obligations.

To exercise any of these rights, contact us via our Discord server (discord.gg/275XqNhvwa) with your order ID or email address. We will respond within 30 days.`,
  },
  {
    title: "Children's Privacy",
    content: `Our Service is not directed at children under the age of 13 (or the minimum age required by Discord in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact us and we will delete it promptly.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of the Service after changes constitutes acceptance of the revised policy.`,
  },
  {
    title: 'Contact Us',
    content: `If you have any questions or concerns about this Privacy Policy or how your data is handled, please reach out via our Discord community at discord.gg/275XqNhvwa. We aim to respond to all privacy-related inquiries within 48 hours.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ background: '#000000', paddingTop: '80px' }}>
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
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p style={{ color: '#9A9A9E' }}>
            Last updated: October 2026 &nbsp;·&nbsp; Applies to boost.sessionguardvip.cc
          </p>
          <div className="mt-4 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255,0.5), transparent)' }} />
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-6 mb-8"
          style={{ background: '#111113', border: '1px solid rgba(255, 255, 255,0.12)' }}>
          <p style={{ color: '#9A9A9E', lineHeight: 1.75 }}>
            At VipPro Boosts, we respect your privacy. This policy explains what data we collect
            when you use our service, how we use it, and your rights over that data. We keep things
            simple: we collect only what is necessary to fulfill your order.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.04 }}
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
            <a className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' }}>
              ← Back to Store
            </a>
          </Link>
          <Link href="/tos">
            <a className="text-sm underline" style={{ color: '#9A9A9E' }}>Terms of Service</a>
          </Link>
          <Link href="/refund">
            <a className="text-sm underline" style={{ color: '#9A9A9E' }}>Refund Policy</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
