import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, Server, Users } from 'lucide-react';
import type { ProductInfo, ResolveInviteResponse } from '@/boost/lib/api';
import { resolveInvite, createOrder, fmtPrice } from '@/boost/lib/api';

interface BoostModalProps {
  product: ProductInfo;
  open: boolean;
  onClose: () => void;
}

type Step = 'invite' | 'quantity' | 'payment';

export function BoostModal({ product, open, onClose }: BoostModalProps) {
  const [step,          setStep]          = useState<Step>('invite');
  const [inviteInput,   setInviteInput]   = useState('');
  const [serverInfo,    setServerInfo]    = useState<ResolveInviteResponse | null>(null);
  const [quantity,      setQuantity]      = useState(2);
  const [email,         setEmail]         = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingPay,    setLoadingPay]    = useState(false);
  const [error,         setError]         = useState('');

  const unitPrice  = product.unitPrice ?? 0;
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
  const maxQty     = Math.min(product.maxQty, product.stock);

  function reset() {
    setStep('invite');
    setInviteInput('');
    setServerInfo(null);
    setQuantity(2);
    setEmail('');
    setError('');
    setLoadingInvite(false);
    setLoadingPay(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleResolveInvite() {
    if (!inviteInput.trim()) { setError('Please enter an invite link.'); return; }
    setError('');
    setLoadingInvite(true);
    try {
      const result = await resolveInvite(inviteInput.trim());
      if (!result.valid) { setError(result.error ?? 'Invalid invite link.'); return; }
      setServerInfo(result);
      setStep('quantity');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify invite. Please try again.');
    } finally {
      setLoadingInvite(false);
    }
  }

  async function handlePay() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.'); return;
    }
    setError('');
    setLoadingPay(true);
    try {
      const result = await createOrder({
        product:    product.id,
        quantity,
        email:      email.trim(),
        inviteCode: serverInfo?.inviteCode ?? inviteInput.trim(),
      });
      window.location.href = result.invoiceUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create order. Please try again.');
      setLoadingPay(false);
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  };

  const modalStyle: React.CSSProperties = {
    background: '#0a0a0c',
    border: '1px solid rgba(255, 255, 255,0.25)',
    borderRadius: 18,
    width: '100%', maxWidth: 480,
    maxHeight: '90vh', overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 0 60px rgba(255, 255, 255,0.15)',
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle}>
          <Dialog.Content style={modalStyle} asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
            >
              {/* Header */}
              <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Dialog.Title style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>
                    {product.title}
                  </Dialog.Title>
                  <p style={{ color: '#9A9A9E', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
                    Step {step === 'invite' ? 1 : step === 'quantity' ? 2 : 3} of 3
                  </p>
                </div>
                <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#9A9A9E', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Step indicator */}
              <div style={{ padding: '1rem 1.5rem 0', display: 'flex', gap: '0.4rem' }}>
                {(['invite','quantity','payment'] as Step[]).map((s, i) => (
                  <div key={s} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: (['invite','quantity','payment'] as Step[]).indexOf(step) >= i
                      ? 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)'
                      : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>

              <div style={{ padding: '1.5rem' }}>
                <AnimatePresence mode="wait">

                  {/* ── STEP 1: Enter Invite ── */}
                  {step === 'invite' && (
                    <motion.div key="invite" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p style={{ color: '#9A9A9E', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                        Enter your Discord server invite link. We'll fetch the server info so you can confirm before paying.
                      </p>
                      <label style={{ display: 'block', color: '#fff', fontSize: '0.87rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Discord Invite Link
                      </label>
                      <input
                        className="input-boost"
                        type="text"
                        placeholder="https://discord.gg/yourserver"
                        value={inviteInput}
                        onChange={(e) => { setInviteInput(e.target.value); setError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleResolveInvite()}
                        disabled={loadingInvite}
                      />
                      {error && (
                        <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={13} /> {error}
                        </p>
                      )}
                      <button
                        onClick={handleResolveInvite}
                        disabled={loadingInvite || !inviteInput.trim()}
                        className="btn-boost"
                        style={{ width: '100%', marginTop: '1.25rem' }}
                      >
                        {loadingInvite ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />Checking Server...</> : 'Check Server →'}
                      </button>
                    </motion.div>
                  )}

                  {/* ── STEP 2: Quantity + server confirm ── */}
                  {step === 'quantity' && serverInfo?.valid && (
                    <motion.div key="quantity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      {/* Server card */}
                      <div style={{
                        background: 'rgba(255, 255, 255,0.06)', border: '1px solid rgba(255, 255, 255,0.2)',
                        borderRadius: 12, padding: '1rem', marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                      }}>
                        {serverInfo.serverIcon ? (
                          <img src={serverInfo.serverIcon} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255, 255, 255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Server size={22} style={{ color: '#FFFFFF' }} />
                          </div>
                        )}
                        <div>
                          <p style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{serverInfo.serverName}</p>
                          {serverInfo.memberCount != null && (
                            <p style={{ color: '#9A9A9E', fontSize: '0.82rem', margin: '0.2rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Users size={12} /> {serverInfo.memberCount.toLocaleString()} members
                            </p>
                          )}
                          <p style={{ color: '#6a6a6e', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>discord.gg/{serverInfo.inviteCode}</p>
                        </div>
                      </div>

                      {/* Quantity selector - buttons ONLY, no text input */}
                      <label style={{ display: 'block', color: '#fff', fontWeight: 600, fontSize: '0.87rem', marginBottom: '0.75rem' }}>
                        Boost Quantity
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <button className="qty-btn" onClick={() => setQuantity((q) => Math.max(product.minQty, q - 1))} disabled={quantity <= product.minQty}>−</button>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', minWidth: 40, textAlign: 'center' }}>{quantity}</span>
                        <button className="qty-btn" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}>+</button>
                        <span style={{ color: '#9A9A9E', fontSize: '0.82rem' }}>boosts · 1 month</span>
                      </div>
                      <p style={{ color: '#6a6a6e', fontSize: '0.78rem', marginBottom: '1.25rem' }}>
                        Min {product.minQty} - Max {maxQty} boosts
                      </p>

                      {/* Price display */}
                      <div style={{
                        background: 'rgba(255, 255, 255,0.06)', border: '1px solid rgba(255, 255, 255,0.15)',
                        borderRadius: 10, padding: '0.9rem 1rem', marginBottom: '1.25rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ color: '#9A9A9E', fontSize: '0.88rem' }}>{quantity} boosts �- {fmtPrice(unitPrice)}</span>
                        <span className="gradient-text" style={{ fontWeight: 900, fontSize: '1.2rem' }}>{fmtPrice(totalPrice)}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setStep('invite')} className="btn-ghost" style={{ flex: 1 }}>← Back</button>
                        <button onClick={() => setStep('payment')} className="btn-boost" style={{ flex: 2 }}>Continue →</button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 3: Email + Pay ── */}
                  {step === 'payment' && (
                    <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      {/* Server confirmation again */}
                      <div style={{
                        background: 'rgba(255, 255, 255,0.06)', border: '1px solid rgba(255, 255, 255,0.2)',
                        borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                      }}>
                        {serverInfo?.serverIcon && (
                          <img src={serverInfo.serverIcon} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div>
                          <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{serverInfo?.serverName}</p>
                          <p style={{ color: '#9A9A9E', fontSize: '0.78rem', margin: 0 }}>{quantity} boost{quantity > 1 ? 's' : ''} · 1 month · {fmtPrice(totalPrice)}</p>
                        </div>
                      </div>

                      {/* Warning */}
                      <div style={{
                        background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.2)',
                        borderRadius: 10, padding: '0.85rem', marginBottom: '1.25rem',
                        display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                      }}>
                        <AlertTriangle size={15} style={{ color: '#ffb400', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ color: '#ffb400', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                          Boosts are applied automatically after payment. Make sure the server above is correct - boosts cannot be moved once applied.
                        </p>
                      </div>

                      {/* Email */}
                      <label style={{ display: 'block', color: '#fff', fontWeight: 600, fontSize: '0.87rem', marginBottom: '0.5rem' }}>
                        Email for order confirmation
                      </label>
                      <input
                        className="input-boost"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        disabled={loadingPay}
                        style={{ marginBottom: '1.25rem' }}
                      />

                      {error && (
                        <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={13} /> {error}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setStep('quantity')} className="btn-ghost" style={{ flex: 1 }} disabled={loadingPay}>← Back</button>
                        <button onClick={handlePay} className="btn-boost" style={{ flex: 2 }} disabled={loadingPay}>
                          {loadingPay ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />Processing...</> : `Pay ${fmtPrice(totalPrice)} →`}
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
