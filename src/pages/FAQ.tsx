import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      q: "What exactly is MSK Token-G?",
      a: "MSK Token-G is a high-performance Discord token generation software. It automates the process of creating and verifying accounts at scale, using advanced fingerprint spoofing and proxy handling to ensure high-quality tokens."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept major cryptocurrencies (LTC, BTC, ETH, USDT) and PayPal. All payments are handled manually through our Discord ticketing system - open a ticket and our team will guide you through checkout."
    },
    {
      q: "How do I receive the software after purchase?",
      a: "Once your payment is confirmed in the Discord ticket, you will receive a unique license key and a download link to the latest encrypted executable. Delivery is usually within minutes of payment confirmation."
    },
    {
      q: "Is there a monthly subscription or lifetime license?",
      a: "We offer both. You can choose a monthly subscription or a lifetime license - whichever fits your needs. Open a ticket in our Discord for current pricing on either option."
    },
    {
      q: "Do you provide refunds?",
      a: "Due to the digital and easily replicable nature of the software (and license keys), all sales are final. We do not provide refunds. Please ensure you understand what the tool does before purchasing."
    },
    {
      q: "Will this software work on Mac or Linux?",
      a: "Currently, MSK Hub tools are compiled and optimized exclusively for Windows (Windows 10/11 or Windows Server 2019+). You can run them on Mac/Linux using a Windows VPS or VM."
    },
    {
      q: "Do I need my own proxies?",
      a: "Not necessarily. Our tools work on your own IP or VPN. We recommend Mullvad VPN (mullvad.net) for privacy. If you need proxies for high-volume operations, we can point you to trusted providers in our Discord."
    },
    {
      q: "How do I get technical support?",
      a: "All support is handled exclusively through our Discord server. Verified customers get access to private support channels where our developers and community helpers can assist you."
    }
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4"
          >
            FREQUENTLY ASKED
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs sm:text-base text-muted-foreground"
          >
            Everything you need to know before joining MSK Hub.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 sm:p-6 md:p-10"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-lg font-bold text-white hover:text-white/80 py-6 data-[state=open]:text-white">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <a href="https://discord.gg/BcwHsh3zBk" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Ask in our Discord
          </a>
        </div>
      </div>
    </PageWrapper>
  );
}
