import { useKiosk } from "./context/KioskContext.jsx";
import KioskShell from "./components/KioskShell.jsx";
import Splash from "./screens/Splash.jsx";
import Home from "./screens/Home.jsx";
import Welcome from "./screens/Welcome.jsx";
import Scan from "./screens/Scan.jsx";
import Agent from "./screens/Agent.jsx";
import Consult from "./screens/Consult.jsx";
import Done from "./screens/Done.jsx";
import Emergency from "./screens/Emergency.jsx";

const screens = {
  HOME: Home,
  WELCOME: Welcome,
  SCAN: Scan,
  AGENT: Agent,
  CONSULT: Consult,
  DONE: Done,
  EMERGENCY: Emergency,
};

export default function App() {
  const { step } = useKiosk();

  if (step === "SPLASH") {
    return <Splash />;
  }

  const Screen = screens[step] || Home;
  return (
    <KioskShell>
      <Screen key={step} />
    </KioskShell>
  );
}
