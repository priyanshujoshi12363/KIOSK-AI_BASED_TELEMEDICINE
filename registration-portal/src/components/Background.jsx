import AshokaChakra from "./AshokaChakra.jsx";

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-saffron/20 blur-[130px]" />
      <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-indiagreen/20 blur-[130px]" />
      <div className="absolute left-1/2 top-1/3 hidden h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-navy/10 blur-[150px] sm:block" />
      <div className="absolute right-4 top-24 hidden text-navy/5 lg:block">
        <AshokaChakra size={520} spin />
      </div>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}
