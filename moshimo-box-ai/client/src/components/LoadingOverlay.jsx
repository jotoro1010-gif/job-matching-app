export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-box-bg/90 flex flex-col items-center justify-center z-10 rounded-2xl">
      <div className="w-24 h-24 rounded-full bg-box-accent animate-glow blur-xl" />
      <p className="mt-6 text-white/80 animate-pulse">もしもの世界を紡いでいます...</p>
    </div>
  );
}
