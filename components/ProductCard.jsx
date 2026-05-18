'use client';

import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProductCard({ product, index }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
        <div
          className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
          style={{ background: product.color + '22' }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl md:text-7xl select-none">{product.emoji}</span>
          )}
          {product.unit === 'букет' && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
              Букет
            </Badge>
          )}
        </div>
        <CardContent className="p-4 md:p-5">
          <div className="text-base md:text-sm font-medium mb-1">{product.name}</div>
          <div className="text-sm md:text-xs text-muted-foreground mb-4 line-clamp-2">
            {product.description}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-lg md:text-base font-bold">{product.price} ₽</span>
              <span className="text-sm md:text-xs text-muted-foreground"> / {product.unit}</span>
            </div>
            <Button
              size="sm"
              className="rounded-full h-10 w-10 md:h-8 md:w-8 p-0"
              onClick={handleAdd}
              variant={added ? 'secondary' : 'default'}
            >
              {added ? <Check className="h-5 w-5 md:h-4 md:w-4" /> : <Plus className="h-5 w-5 md:h-4 md:w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
