import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { Catalog } from '@/components/Catalog';
import { HowItWorks } from '@/components/HowItWorks';
import { Testimonials } from '@/components/Testimonials';
import { Footer } from '@/components/Footer';
import { ProductModal } from '@/components/ProductModal';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || res.data || []);
    } catch (err) {
      console.error(err);
      setLoadError(true);
      toast.error("Gagal memuat produk. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero products={products} />
      <Marquee />
      {loadError && !loading ? (
        <section id="katalog" className="max-w-7xl mx-auto px-4 py-20 text-center" data-testid="catalog-error">
          <p className="text-sm font-mono text-coral">Gagal memuat produk. Periksa koneksi internet kamu.</p>
          <button
            onClick={fetchProducts}
            data-testid="catalog-retry-button"
            className="mt-6 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] px-6 py-3 hover:bg-lime transition-colors"
          >
            Coba Lagi
          </button>
        </section>
      ) : (
        <Catalog products={products} loading={loading} onSelect={setSelectedProduct} />
      )}
      <HowItWorks />
      <Testimonials />
      <Footer />
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </main>
  );
}
