import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, ShieldAlert } from 'lucide-react';

export default function Contact() {
  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-3 sm:mb-4"
          >
            COMMUNICATION
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Direct lines to the MSK Hub development and support team.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 sm:p-10 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white mb-6">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Discord Community</h2>
            <p className="text-muted-foreground mb-8">
              Our primary hub for support, purchases, announcements, and community chat. Open a ticket for fast assistance.
            </p>
            <a href="https://discord.gg/BcwHsh3zBk" target="_blank" rel="noopener noreferrer" className="btn-primary w-full max-w-xs mt-auto">
              Join Server
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-10 flex flex-col items-center text-center opacity-70"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white mb-6 border border-white/10">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Email Support</h2>
            <p className="text-muted-foreground mb-8">
              For business inquiries, DMCA, or issues requiring external communication outside of Discord.
            </p>
            <div className="mt-auto px-6 py-3 border border-white/10 rounded-lg bg-black/50 text-sm text-muted-foreground w-full max-w-xs">
              Coming Soon
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass-card p-6 border-l-4 border-l-white/50 flex items-start gap-4"
        >
          <ShieldAlert className="text-white mt-1 flex-shrink-0" />
          <div>
            <h4 className="text-white font-bold mb-1">Beware of Impersonators</h4>
            <p className="text-sm text-muted-foreground">
              MSK Hub staff will never DM you first to offer discounts or request passwords. All official transactions occur through our designated Discord ticketing system. Verify server invites match <code className="bg-black/50 px-1 rounded text-accent">discord.gg/BcwHsh3zBk</code>.
            </p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
