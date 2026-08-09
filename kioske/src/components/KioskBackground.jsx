import AshokaChakra from "./AshokaChakra.jsx";

export default function KioskBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f4f6fb]">
      <div className="absolute -left-52 -top-52 h-[38rem] w-[38rem] rounded-full bg-saffron/[0.07] blur-[150px]" />
      <div className="absolute -bottom-52 -right-52 h-[38rem] w-[38rem] rounded-full bg-indiagreen/[0.07] blur-[150px]" />
      <div className="absolute right-8 top-32 hidden text-[#0a1a3d]/[0.028] xl:block">
        <AshokaChakra size={620} spin />
      </div>
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(#0a1a3d 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
