import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Load seed data
const seedPath = path.resolve(__dirname, 'src/data/seed_data.json');
let seedData = {
  SEED_PRODUCTS: [] as any[],
  SEED_TESTIMONIALS: [] as any[],
  SEED_GAMES: [] as any[]
};

if (fs.existsSync(seedPath)) {
  try {
    seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  } catch (err) {
    console.error('Error loading seed data:', err);
  }
}

// In-Memory Database State
let products = [...(seedData.SEED_PRODUCTS || [])];
let testimonials = [...(seedData.SEED_TESTIMONIALS || [])];
let games = [...(seedData.SEED_GAMES || [])];

let manualDestinations = [
  {
    id: "mp-qris-demo",
    type: "qris",
    name: "QRIS All Payment",
    account_name: "WillJustPlay Store",
    account_number: "NMID-085693161480",
    image: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226580016ID.CO.QRIS.WWW011893600914000000000002150856931614800303UMI51440014ID.CO.QRIS.WWW02150856931614800303UMI5204599953033605802ID5912WillJustPlay6007Jakarta61051234062070703A0163041234",
    is_active: true,
    seq: 0,
  },
  {
    id: "mp-bca-demo",
    type: "bank",
    name: "Bank BCA",
    account_name: "Will Business",
    account_number: "8735129481",
    image: "",
    is_active: true,
    seq: 1,
  },
  {
    id: "mp-mandiri-demo",
    type: "bank",
    name: "Bank Mandiri",
    account_name: "Will Business",
    account_number: "1370019284712",
    image: "",
    is_active: true,
    seq: 2,
  },
  {
    id: "mp-dana-demo",
    type: "ewallet",
    name: "DANA / GoPay / OVO",
    account_name: "Will Business",
    account_number: "085693161480",
    image: "",
    is_active: true,
    seq: 3,
  }
];

let socialLinks = [
  {
    id: "sl-facebook-demo",
    platform: "facebook",
    name: "Facebook Official",
    url: "https://www.facebook.com/share/1Ey74rNDVi/",
    is_active: true,
    seq: 0,
  },
  {
    id: "sl-whatsapp-demo",
    platform: "whatsapp",
    name: "WhatsApp CS 24/7",
    url: "https://wa.me/6285693161480",
    is_active: true,
    seq: 1,
  },
  {
    id: "sl-telegram-demo",
    platform: "telegram",
    name: "Telegram Group",
    url: "https://t.me/willjustplay",
    is_active: true,
    seq: 2,
  }
];

let paykitaConfig = {
  enabled: true,
  api_key: "DEMO_PAYKITA_KEY",
  merchant_code: "DEMO_WJP",
  environment: "sandbox"
};

let users = [
  {
    id: "usr-admin",
    email: "admin@willjustplay.com",
    name: "Will Admin",
    role: "admin",
    wishlist: [],
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "usr-demo",
    email: "user@demo.com",
    name: "Sultan Gamer",
    role: "buyer",
    wishlist: ["ml-sultan-mythic"],
    is_verified: true,
    created_at: new Date().toISOString(),
  }
];

let transactions: any[] = [
  {
    session_id: "WJP-DEMO-001",
    provider: "manual",
    destination_id: "mp-qris-demo",
    destination_name: "QRIS All Payment",
    product_id: "ml-sultan-mythic",
    product_title: "Akun Sultan Mythic Glory — 320 Skin & 120 Hero",
    product_type: "product",
    buyer_name: "Budi Gamer",
    buyer_email: "budi@gmail.com",
    buyer_whatsapp: "081234567890",
    delivery_info: "Login Moonton: budi.mythic@gmail.com | Sandi: WjpSultan#2026",
    user_id: "usr-demo",
    amount: 4500000,
    currency: "idr",
    status: "paid",
    payment_status: "paid",
    payment_proof: "https://images.unsplash.com/photo-1554415707-9e4466b404c0?w=400",
    has_proof: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 23).toISOString(),
  }
];

let reviews: any[] = [
  {
    id: "rev-1",
    product_id: "ml-sultan-mythic",
    session_id: "WJP-DEMO-001",
    user_id: "usr-demo",
    user_name: "Budi Gamer",
    rating: 5,
    comment: "Proses cepat banget cuma 5 menit langsung dikasih data akunnya. Akun aman dan skin lengkap!",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    reply: "Terima kasih sudah berbelanja di WillJustPlay! Selamat bermain ya kak!"
  }
];

// Helper: current user from auth header
function getAuthUser(req: Request) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '').trim();
  if (token === 'admin-token') {
    return users.find(u => u.role === 'admin') || users[0];
  }
  return users.find(u => u.id === token || u.email === token) || users[0];
}

/* =========================================================
   PUBLIC STORE ROUTES
========================================================= */

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/products', (req, res) => {
  const { game, category, featured, search } = req.query;
  let result = [...products];

  if (game) {
    result = result.filter(p => p.game?.toLowerCase() === String(game).toLowerCase());
  }
  if (category) {
    result = result.filter(p => p.category?.toLowerCase() === String(category).toLowerCase());
  }
  if (featured === 'true') {
    result = result.filter(p => p.featured);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(p => 
      p.title?.toLowerCase().includes(q) || 
      p.game?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

app.get('/api/products/:id', (req, res) => {
  const prod = products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ detail: 'Produk tidak ditemukan' });
  res.json(prod);
});

app.get('/api/games', (req, res) => {
  res.json(games.filter(g => g.is_active !== false));
});

app.get('/api/testimonials', (req, res) => {
  res.json(testimonials);
});

app.get('/api/social-links', (req, res) => {
  res.json(socialLinks.filter(s => s.is_active));
});

/* =========================================================
   TOPUP ROUTES
========================================================= */

app.get('/api/topup/games', (req, res) => {
  res.json(games.filter(g => g.is_active !== false));
});

app.get('/api/topup/games/:slug', (req, res) => {
  const game = games.find(g => g.slug === req.params.slug || g.id === req.params.slug);
  if (!game) return res.status(404).json({ detail: 'Game tidak ditemukan' });
  res.json(game);
});

app.get('/api/topup/games/:slug/denominations', (req, res) => {
  const game = games.find(g => g.slug === req.params.slug || g.id === req.params.slug);
  if (!game) return res.status(404).json({ detail: 'Game tidak ditemukan' });
  res.json(game.denominations || []);
});

app.post('/api/topup/validate', (req, res) => {
  const { game, fields } = req.body;
  // Simulated nickname validation
  const userId = fields?.user_id || 'Player';
  res.json({
    valid: true,
    nickname: `Player_${userId.slice(-4) || 'VIP'}`,
    zone: fields?.server_id || 'ID'
  });
});

/* =========================================================
   PAYMENT ROUTES
========================================================= */

app.get('/api/payments/methods', (req, res) => {
  res.json([
    { id: 'manual', label: 'Transfer Manual & QRIS Instant' },
    { id: 'paykita', label: 'QRIS Otomatis (PayKita)' }
  ]);
});

app.get('/api/payments/manual-destinations', (req, res) => {
  res.json(manualDestinations.filter(d => d.is_active));
});

// Topup checkout
app.post('/api/payments/topup/checkout', (req, res) => {
  const body = req.body;
  const game = games.find(g => g.slug === (body.game || body.slug));
  const denom = game?.denominations?.find((d: any) => d.code === (body.denomination_code || body.denomination));
  const dest = manualDestinations.find(d => d.id === body.destination_id) || manualDestinations[0];

  const orderId = `NXG-T-${Date.now()}`;
  const amount = denom ? denom.price : (body.amount || 25000);

  const tx = {
    session_id: orderId,
    provider: body.method || 'manual',
    product_type: 'topup',
    product_title: `Top-up ${game ? game.name : 'Game'} - ${denom ? denom.label : 'Nominal'}`,
    game_slug: game?.slug,
    denomination_code: denom?.code,
    denomination_label: denom?.label,
    destination_id: dest?.id,
    destination_name: dest?.name,
    amount: amount,
    buyer_name: body.buyer_name || body.name || 'Gamer',
    buyer_email: body.buyer_email || body.email || 'gamer@gmail.com',
    buyer_whatsapp: body.buyer_whatsapp || body.whatsapp || '085693161480',
    status: 'pending',
    payment_status: 'pending',
    destination: body.fields || {},
    has_proof: false,
    qris_string: "00020101021226580016ID.CO.QRIS.WWW011893600914000000000002150856931614800303UMI51440014ID.CO.QRIS.WWW02150856931614800303UMI5204599953033605802ID5912WillJustPlay6007Jakarta61051234062070703A0163041234",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  transactions.unshift(tx);
  res.json({
    order_id: orderId,
    session_id: orderId,
    checkout_url: `/payment/success?session_id=${orderId}`
  });
});

// Manual product checkout
app.post('/api/payments/manual/checkout', (req, res) => {
  const body = req.body;
  const product = products.find(p => p.id === body.product_id);
  const dest = manualDestinations.find(d => d.id === body.destination_id) || manualDestinations[0];

  const orderId = `NXG-M-${Date.now()}`;
  const tx = {
    session_id: orderId,
    provider: 'manual',
    product_id: product?.id,
    product_title: product?.title || 'Akun Game',
    product_type: 'product',
    destination_id: dest?.id,
    destination_name: dest?.name,
    amount: product?.price || 100000,
    buyer_name: body.buyer_name || body.name || 'Pembeli',
    buyer_email: body.buyer_email || body.email || 'buyer@gmail.com',
    buyer_whatsapp: body.buyer_whatsapp || body.whatsapp || '085693161480',
    delivery_info: product?.delivery_info || 'Data login akan dikirimkan via WhatsApp setelah verifikasi',
    status: 'pending',
    payment_status: 'pending',
    has_proof: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  transactions.unshift(tx);
  res.json({
    order_id: orderId,
    session_id: orderId,
    checkout_url: `/payment/success?session_id=${orderId}`
  });
});

// PayKita checkout
app.post('/api/payments/paykita/checkout', (req, res) => {
  const body = req.body;
  const product = products.find(p => p.id === body.product_id);
  const orderId = `PK-${Date.now()}`;

  const tx = {
    session_id: orderId,
    provider: 'paykita',
    product_id: product?.id,
    product_title: product?.title || 'Akun Game',
    product_type: 'product',
    amount: product?.price || 100000,
    buyer_name: body.buyer_name || body.name || 'Pembeli',
    buyer_email: body.buyer_email || body.email || 'buyer@gmail.com',
    buyer_whatsapp: body.buyer_whatsapp || body.whatsapp || '085693161480',
    delivery_info: product?.delivery_info || 'Data login dikirimkan setelah pembayaran',
    status: 'pending',
    payment_status: 'pending',
    qris_string: "00020101021226580016ID.CO.QRIS.WWW011893600914000000000002150856931614800303UMI51440014ID.CO.QRIS.WWW02150856931614800303UMI5204599953033605802ID5912WillJustPlay6007Jakarta61051234062070703A0163041234",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  transactions.unshift(tx);
  res.json({
    order_id: orderId,
    session_id: orderId,
    checkout_url: `/payment/success?session_id=${orderId}`
  });
});

// Order status polling
app.get('/api/payments/status/:sessionId', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  if (!tx) return res.status(404).json({ detail: 'Transaksi tidak ditemukan' });

  const dest = manualDestinations.find(d => d.id === tx.destination_id);
  res.json({
    ...tx,
    manual_destination: dest,
    game: tx.game_slug ? games.find(g => g.slug === tx.game_slug) : null
  });
});

// Manual proof upload
app.post('/api/payments/manual/upload-proof/:sessionId', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  if (!tx) return res.status(404).json({ detail: 'Transaksi tidak ditemukan' });

  tx.payment_proof = req.body?.proof || 'https://images.unsplash.com/photo-1554415707-9e4466b404c0?w=600';
  tx.has_proof = true;
  tx.status = 'verifying';
  tx.updated_at = new Date().toISOString();

  res.json({ message: 'Bukti transfer berhasil diunggah. Menunggu konfirmasi admin.', status: 'verifying' });
});

// PayKita sync
app.post('/api/payments/paykita/sync/:sessionId', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  if (!tx) return res.status(404).json({ detail: 'Transaksi tidak ditemukan' });
  res.json({ status: tx.payment_status });
});

/* =========================================================
   AUTH ROUTES
========================================================= */

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email dan password diperlukan' });
  }

  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'admin@willjustplay.com' || cleanEmail === 'admin') {
    const valid = password === 'WillPlay#Admin2026' || password === 'admin123' || password === 'admin' || password === 'NEXUS-ADMIN-8888';
    if (!valid) {
      return res.status(401).json({ detail: 'Password admin salah. Gunakan: WillPlay#Admin2026 atau admin123' });
    }
    const admin = users.find(u => u.role === 'admin') || users[0];
    return res.json({
      token: 'admin-token',
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        wishlist: admin.wishlist
      }
    });
  }

  let user = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    // Demo auto-create buyer for convenient testing
    user = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      role: 'buyer',
      wishlist: [],
      is_verified: true,
      created_at: new Date().toISOString()
    };
    users.push(user);
  }

  res.json({
    token: user.id,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      wishlist: user.wishlist
    }
  });
});

app.post('/api/auth/admin-login', (req, res) => {
  const { password } = req.body;
  // Accepts 'WillPlay#Admin2026' or 'admin123' or 'admin'
  const valid = password === 'WillPlay#Admin2026' || password === 'admin123' || password === 'admin' || password === 'NEXUS-ADMIN-8888';
  if (!valid) {
    return res.status(401).json({ detail: 'Password admin salah. Coba: WillPlay#Admin2026 atau admin123' });
  }

  const admin = users.find(u => u.role === 'admin') || users[0];
  res.json({
    token: 'admin-token',
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin',
      wishlist: admin.wishlist
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email dan password dibutuhkan' });
  }

  let existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: 'Email sudah terdaftar' });
  }

  const user = {
    id: `usr-${Date.now()}`,
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
    role: 'buyer',
    wishlist: [],
    is_verified: true,
    created_at: new Date().toISOString()
  };
  users.push(user);

  res.json({
    message: 'Akun berhasil dibuat. Selamat datang!',
    token: user.id,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      wishlist: user.wishlist
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ detail: 'Unauthorized' });
  res.json({ user });
});

app.get('/api/auth/email-status', (req, res) => {
  res.json({ is_configured: false });
});

app.post('/api/auth/forgot-password', (req, res) => {
  res.json({ message: 'Tautan reset password telah dikirim ke email Anda.' });
});

app.post('/api/auth/reset-password', (req, res) => {
  res.json({ message: 'Password berhasil diatur ulang. Silakan login kembali.' });
});

app.post('/api/auth/verify-email', (req, res) => {
  res.json({ message: 'Email berhasil diverifikasi.' });
});

app.post('/api/auth/resend-verification', (req, res) => {
  res.json({ message: 'Email verifikasi telah dikirim ulang.' });
});

/* =========================================================
   USER ACCOUNT ROUTES
========================================================= */

app.get('/api/me/orders', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.json(transactions.slice(0, 5));
  res.json(transactions.filter(t => t.user_id === user.id || t.buyer_email === user.email));
});

app.get('/api/me/wishlist', (req, res) => {
  const user = getAuthUser(req);
  res.json(user?.wishlist || []);
});

app.post('/api/me/wishlist/:productId', (req, res) => {
  const user = getAuthUser(req) || users[0];
  const pid = req.params.productId;
  const idx = user.wishlist.indexOf(pid);
  if (idx >= 0) {
    user.wishlist.splice(idx, 1);
  } else {
    user.wishlist.push(pid);
  }
  res.json({ wishlist: user.wishlist, in_wishlist: user.wishlist.includes(pid) });
});

app.get('/api/reviews/mine', (req, res) => {
  res.json(reviews);
});

app.get('/api/reviews/eligibility/:sessionId', (req, res) => {
  res.json({ eligible: true });
});

app.post('/api/reviews', (req, res) => {
  const newRev = {
    id: `rev-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString()
  };
  reviews.unshift(newRev);
  res.status(201).json(newRev);
});

app.get('/api/products/:productId/reviews', (req, res) => {
  res.json(reviews.filter(r => r.product_id === req.params.productId));
});

/* =========================================================
   ADMIN ROUTES
========================================================= */

app.get('/api/admin/products', (req, res) => {
  res.json(products);
});

app.post('/api/admin/products', (req, res) => {
  const newProd = {
    id: `p-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString()
  };
  products.unshift(newProd);
  res.status(201).json(newProd);
});

app.put('/api/admin/products/:productId', (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.productId);
  if (idx < 0) return res.status(404).json({ detail: 'Produk tidak ditemukan' });
  products[idx] = { ...products[idx], ...req.body };
  res.json(products[idx]);
});

app.delete('/api/admin/products/:productId', (req, res) => {
  products = products.filter(p => p.id !== req.params.productId);
  res.json({ message: 'Produk berhasil dihapus' });
});

app.get('/api/admin/orders', (req, res) => {
  res.json(transactions);
});

app.get('/api/admin/orders/:sessionId', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  if (!tx) return res.status(404).json({ detail: 'Order tidak ditemukan' });
  res.json(tx);
});

app.get('/api/admin/orders/:sessionId/proof', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  res.json({ proof_url: tx?.payment_proof || 'https://placehold.co/600x800/png?text=Bukti+Transfer' });
});

app.post('/api/admin/orders/:sessionId/approve', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  if (!tx) return res.status(404).json({ detail: 'Order tidak ditemukan' });
  tx.status = 'paid';
  tx.payment_status = 'paid';
  tx.delivery_info = tx.delivery_info || 'Data akun / Diamond telah dikirimkan ke kontak WhatsApp buyer';
  tx.updated_at = new Date().toISOString();
  res.json({ message: 'Order berhasil disetujui (Approved)', order: tx });
});

app.post('/api/admin/orders/:sessionId/reject', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  if (!tx) return res.status(404).json({ detail: 'Order tidak ditemukan' });
  tx.status = 'rejected';
  tx.payment_status = 'failed';
  tx.updated_at = new Date().toISOString();
  res.json({ message: 'Order telah ditolak (Rejected)', order: tx });
});

app.post('/api/admin/orders/:sessionId/sync', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  res.json(tx || {});
});

app.get('/api/admin/topup/orders', (req, res) => {
  res.json(transactions.filter(t => t.product_type === 'topup'));
});

app.post('/api/admin/topup/orders/:sessionId/complete', (req, res) => {
  const tx = transactions.find(t => t.session_id === req.params.sessionId);
  if (tx) {
    tx.status = 'paid';
    tx.payment_status = 'paid';
  }
  res.json({ message: 'Topup selesai', order: tx });
});

app.post('/api/admin/upload', (req, res) => {
  // Returns image URL or default placeholder
  const url = req.body?.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800';
  res.json({ url });
});

app.post('/api/admin/reset', (req, res) => {
  products = [...(seedData.SEED_PRODUCTS || [])];
  testimonials = [...(seedData.SEED_TESTIMONIALS || [])];
  games = [...(seedData.SEED_GAMES || [])];
  res.json({ message: 'Database reset to default seed data' });
});

app.get('/api/admin/reviews', (req, res) => {
  res.json(reviews);
});

app.post('/api/admin/reviews/:id/reply', (req, res) => {
  const rev = reviews.find(r => r.id === req.params.id);
  if (rev) rev.reply = req.body.reply;
  res.json(rev);
});

app.delete('/api/admin/reviews/:id', (req, res) => {
  reviews = reviews.filter(r => r.id !== req.params.id);
  res.json({ message: 'Review dihapus' });
});

app.get('/api/admin/payments/manual-destinations', (req, res) => {
  res.json(manualDestinations);
});

app.post('/api/admin/payments/manual-destinations', (req, res) => {
  const dest = { id: `mp-${Date.now()}`, ...req.body };
  manualDestinations.push(dest);
  res.status(201).json(dest);
});

app.put('/api/admin/payments/manual-destinations/:id', (req, res) => {
  const idx = manualDestinations.findIndex(d => d.id === req.params.id);
  if (idx >= 0) manualDestinations[idx] = { ...manualDestinations[idx], ...req.body };
  res.json(manualDestinations[idx]);
});

app.delete('/api/admin/payments/manual-destinations/:id', (req, res) => {
  manualDestinations = manualDestinations.filter(d => d.id !== req.params.id);
  res.json({ message: 'Destinasi dihapus' });
});

app.get('/api/admin/social-links', (req, res) => {
  res.json(socialLinks);
});

app.post('/api/admin/social-links', (req, res) => {
  const sl = { id: `sl-${Date.now()}`, ...req.body };
  socialLinks.push(sl);
  res.status(201).json(sl);
});

app.put('/api/admin/social-links/:id', (req, res) => {
  const idx = socialLinks.findIndex(s => s.id === req.params.id);
  if (idx >= 0) socialLinks[idx] = { ...socialLinks[idx], ...req.body };
  res.json(socialLinks[idx]);
});

app.delete('/api/admin/social-links/:id', (req, res) => {
  socialLinks = socialLinks.filter(s => s.id !== req.params.id);
  res.json({ message: 'Link dihapus' });
});

app.get('/api/admin/games', (req, res) => {
  res.json(games);
});

app.post('/api/admin/games', (req, res) => {
  const g = { id: `g-${Date.now()}`, ...req.body };
  games.push(g);
  res.status(201).json(g);
});

app.put('/api/admin/games/:id', (req, res) => {
  const idx = games.findIndex(g => g.id === req.params.id);
  if (idx >= 0) games[idx] = { ...games[idx], ...req.body };
  res.json(games[idx]);
});

app.delete('/api/admin/games/:id', (req, res) => {
  games = games.filter(g => g.id !== req.params.id);
  res.json({ message: 'Game dihapus' });
});

app.get('/api/admin/payments/paykita', (req, res) => {
  res.json(paykitaConfig);
});

app.put('/api/admin/payments/paykita', (req, res) => {
  paykitaConfig = { ...paykitaConfig, ...req.body };
  res.json(paykitaConfig);
});

app.post('/api/admin/payments/paykita/test', (req, res) => {
  res.json({ success: true, message: 'Koneksi PayKita berhasil diverifikasi' });
});

app.get('/api/admin/topup/vendors', (req, res) => {
  res.json([
    { id: 'v-digiflazz', name: 'Digiflazz Direct', status: 'connected', balance: 1450000 },
    { id: 'v-apigames', name: 'ApiGames Auto', status: 'connected', balance: 820000 }
  ]);
});

app.get('/api/admin/topup/vendors/catalog', (req, res) => {
  res.json([
    { id: 'v-digiflazz', name: 'Digiflazz' },
    { id: 'v-apigames', name: 'ApiGames' }
  ]);
});

/* =========================================================
   Vite Dev Server Integration & Static Production Serving
========================================================= */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WillJustPlay server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
