import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import type { ProductInfo } from '@/boost/lib/api';
import { createOrder, fmtPrice } from '@/boost/lib/api';

interface NitroModalProps {
  product: ProductInfo;
  open: boolean;
  onClose: () => void;
}

export function NitroModal({ product, open, onClose }: NitroModalProps) {
  const [step,       setStep]       = useState<1 | 2>(1);
  const [qtyInput,   setQtyInput]   = useState('2');
  const [email,      setEmail]      = useState('');
  const [loadingPay, setLoadingPay] = useState(false);
  const [error,      setError]      = useState('');
  const [qtyError,   setQtyError]   = useState('');

  const unitPrice  = product.unitPrice ?? 0;
  const parsedQty  = parseInt(qtyInput, 10);
  const validQty   = !isNaN(parsedQty) && Number.isInteger(parsedQty) && parsedQty >= product.minQty && parsedQty <= Math.min(product.maxQty, product.stock);
  const totalPrice = validQty ? Math.round(unitPrice * parsedQty * 100) / 100 : 0;

  function reset() { setStep(1); setQtyInput('2'); setEmail(''); setError(''); setQtyError(''); setLoadingPay(false); }
  function handleClose() { reset(); onClose(); }

  function validateQty(): boolean {
    const q = parseInt(qtyInput, 10);
    if (isNaN(q) || !Number.isInteger(q)) { setQtyError('Please enter a whole number.'); return false; }
    if (q < product.minQty) { setQtyError(`Minimum quantity is ${product.minQty}.`); return false; }
    const max = Math.min(product.maxQty, product.stock);
    if (q > max) { setQtyError(`Maximum available is ${max}.`); return false; }
    setQtyError('');
    return true;
  }

  function handleContinue() {
    if (!validateQty()) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.'); return;
    }
    setError('');
    setStep(2);
  }

  async function handlePay() {
    if (!validateQty()) return;
    setError('');
    setLoadingPay(true);
    try {
      const result = await createOrder({ product: product.id, quantity: parsedQty, email: email.trim() });
      window.location.href = result.invoiceUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create order. Please try again.');
      setLoadingPay(false);
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  };
  const modalStyle: React.CSSProperties = {
    background: '#0a0a0c', border: '1px solid rgba(255, 255, 255,0.25)',
    borderRadius: 18, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 0 60px rgba(255, 255, 255,0.15)',
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle}>
          <Dialog.Content style={modalStyle} asChild>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
              <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Dialog.Title style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>{product.title}</Dialog.Title>
                  <p style={{ color: '#9A9A9E', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>Step {step} of 2</p>
                </div>
                <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#9A9A9E', cursor: 'pointer', padding: 4, borderRadius: 6 }}><X size={20} /></button>
              </div>

              <div style={{ padding: '0 1.5rem 0.5rem', display: 'flex', gap: '0.4rem', marginTop: '1rem' }}>
                {[1,2].map((s) => (
                  <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? 'linear-gradient(120deg, #555555 0%, #C0C0C0 28%, #FFFFFF 48%, #999999 68%, #E8E8E8 85%, #666666 100%)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                ))}
              </div>

              <div style={{ padding: '1.5rem' }}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      {/* Warning */}
                      <div style={{ background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.2)', borderRadius: 10, padding: '0.9rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <AlertTriangle size={15} style={{ color: '#ffb400', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ color: '#ffb400', fontSize: '0.8rem', lineHeight: 1.55 }}>
                          <strong>Important:</strong> Save your Nitro tokens immediately after purchase. The customer dashboard is not yet available - your tokens will not be saved there. Copy and store them securely right after delivery.
                        </div>
                      </div>

                      {/* Quantity */}
                      <label style={{ display: 'block', color: '#fff', fontWeight: 600, fontSize: '0.87rem', marginBottom: '0.5rem' }}>
                        Quantity <span style={{ color: '#9A9A9E', fontWeight: 400 }}>({product.minQty}-{Math.min(product.maxQty, product.stock)})</span>
                      </label>
                      <input
                        className="input-boost"
                        type="number"
                        min={product.minQty}
                        max={Math.min(product.maxQty, product.stock)}
                        value={qtyInput}
                        onChange={(e) => { setQtyInput(e.target.value); setQtyError(''); }}
                        onBlur={validateQty}
                        style={{ marginBottom: qtyError ? '0.35rem' : '1rem' }}
                      />
                      {qtyError && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={12} /> {qtyError}</p>}

                      {/* Price preview */}
                      {validQty && (
                        <div style={{ background: 'rgba(255, 255, 255,0.06)', border: '1px solid rgba(255, 255, 255,0.15)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#9A9A9E', fontSize: '0.88rem' }}>{parsedQty} tokens �- {fmtPrice(unitPrice)}</span>
                          <span className="gradient-text" style={{ fontWeight: 900, fontSize: '1.2rem' }}>{fmtPrice(totalPrice)}</span>
                        </div>
                      )}

                      {/* Email */}
                      <label style={{ display: 'block', color: '#fff', fontWeight: 600, fontSize: '0.87rem', marginBottom: '0.5rem' }}>Email</label>
                      <input
                        className="input-boost"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        style={{ marginBottom: '1.25rem' }}
                      />

                      {error && <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={13} /> {error}</p>}

                      <button onClick={handleContinue} className="btn-boost" style={{ width: '100%' }}>Continue →</button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      {/* Summary */}
                      <div style={{ background: 'rgba(255, 255, 255,0.06)', border: '1px solid rgba(255, 255, 255,0.2)', borderRadius: 12, padding: '1.1rem', marginBottom: '1.25rem' }}>
                        <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Order Summary</h4>
                        {[
                          { label: 'Product',   value: product.title },
                          { label: 'Quantity',  value: `${parsedQty} tokens` },
                          { label: 'Unit price', value: fmtPrice(unitPrice) },
                          { label: 'Email',     value: email },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ color: '#9A9A9E', fontSize: '0.85rem' }}>{label}</span>
                            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid rgba(255, 255, 255,0.15)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>Total</span>
                          <span className="gradient-text" style={{ fontWeight: 900, fontSize: '1.3rem' }}>{fmtPrice(totalPrice)}</span>
                        </div>
                      </div>

                      {/* Warning again (simplified) */}
                      <div style={{ background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.15)', borderRadius: 10, padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                        <AlertTriangle size={14} style={{ color: '#ffb400', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ color: '#ffb400', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>
                          Save your tokens immediately after delivery. Dashboard coming soon.
                        </p>
                      </div>

                      {error && <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={13} /> {error}</p>}

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1 }} disabled={loadingPay}>← Back</button>
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
