'use client';

import { useEffect } from 'react';

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl md:text-2xl font-bold mb-2">Что-то пошло не так</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">Произошла ошибка при загрузке страницы. Попробуйте ещё раз.</p>
      <button
        onClick={() => unstable_retry()}
        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Попробовать снова
      </button>
    </div>
  );
}
