import { useKiosk } from "./context/KioskContext.jsx";
import KioskShell from "./components/KioskShell.jsx";
import Welcome from "./screens/Welcome.jsx";
import Scan from "./screens/Scan.jsx";
import Agent from "./screens/Agent.jsx";
import Consult from "./screens/Consult.jsx";
import Done from "./screens/Done.jsx";

const screens = {
  WELCOME: Welcome,
  SCAN: Scan,
  AGENT: Agent,
  CONSULT: Consult,
  DONE: Done,
};

export default function App() {
  const { step } = useKiosk();
  const Screen = screens[step] || Welcome;
  return (
    <KioskShell>
      <Screen key={step} />
    </KioskShell>
  );
}
