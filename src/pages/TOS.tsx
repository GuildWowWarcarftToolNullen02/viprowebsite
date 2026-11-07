import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';

export default function TOS() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-b border-white/10 pb-8"
        >
          <h1 className="text-4xl font-black text-white mb-4">TERMS OF SERVICE</h1>
          <p className="text-muted-foreground">Last Updated: October 24, 2023</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-white max-w-none"
        >
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing, purchasing, or using any software, tools, or services provided by MSK Hub ("we", "us", or "our"), you ("User", "you") agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Use of Service & Software</h2>
            <p className="mb-4">
              MSK Hub provides software tools for educational, testing, and automation purposes. You agree to use these tools responsibly and in compliance with all applicable local, state, national, and international laws.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>You may not reverse engineer, decompile, or crack our software.</li>
              <li>You may not share, resell, or distribute your license key.</li>
              <li>Software is provided "as is" and intended for personal use by the license holder only.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. Prohibited Activities</h2>
            <p className="mb-4">
              Users are strictly prohibited from using MSK Hub software for malicious purposes, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Deploying ransomware, malware, or destructive payloads.</li>
              <li>Targeting critical infrastructure or emergency services.</li>
              <li>Engaging in illegal harassment, doxing, or threats.</li>
            </ul>
            <p>
              We reserve the right to revoke software access immediately and without refund if a user is found violating these conditions.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Payments, Subscriptions, and Refunds</h2>
            <p className="mb-4">
              All sales are strictly final. Due to the digital nature of the software and license keys, we do not offer refunds under any circumstances.
            </p>
            <p className="mb-4">
              Cryptocurrency payments are verified manually via our Discord ticketing system. License delivery occurs only after the transaction is fully confirmed on the respective blockchain.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">
              MSK Hub and its developers shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our software. You use the tools entirely at your own risk. We are not responsible for any bans, restrictions, or actions taken against your accounts by third-party platforms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms of Service at any time. Continued use of our software after any such changes constitutes your consent to such changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Contact</h2>
            <p>
              For legal inquiries, support, or questions regarding these terms, please contact our administration team via our official Discord server.
            </p>
          </section>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
