'use client';

export default function GlobalError({ error, unstable_retry }) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center bg-background text-foreground">
        <div className="text-5xl mb-4">💥</div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Критическая ошибка</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">Что-то пошло совсем не так. Попробуйте обновить страницу.</p>
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Обновить страницу
        </button>
      </body>
    </html>
  );
}
