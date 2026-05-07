export function AmbientBackground() {
  return (
    <>
      {/* Vibrant Ambient Background Colors */}
      <div className="fixed -top-[20%] -left-[10%] w-[70vw] h-[70vh] rounded-full bg-wc-blue/25 blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="fixed top-[10%] -right-[10%] w-[60vw] h-[60vh] rounded-full bg-wc-red/20 blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="fixed -bottom-[20%] left-[10%] w-[80vw] h-[60vh] rounded-full bg-wc-green/20 blur-[140px] pointer-events-none mix-blend-screen" />
    </>
  );
}
