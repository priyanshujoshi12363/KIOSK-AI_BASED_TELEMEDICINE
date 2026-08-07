import AshokaChakra from "./AshokaChakra.jsx";

export default function KioskBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-saffron/20 blur-[130px]" />
      <div className="absolute -bottom-44 -right-40 h-[34rem] w-[34rem] rounded-full bg-indiagreen/20 blur-[130px]" />
      <div className="absolute left-1/2 top-1/3 hidden h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-navy/10 blur-[150px] sm:block" />
      <div className="absolute right-6 top-24 hidden text-navy/[0.04] lg:block">
        <AshokaChakra size={560} spin />
      </div>
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(#01055b 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
    </div>
  );
}
