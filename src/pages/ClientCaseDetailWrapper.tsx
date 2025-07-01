
import AppLayout from "../components/layout/app-layout";
import ClientCaseDetailPage from "./ClientCaseDetailPage";


export default function ClientCaseDetailWrapper() {
 
  // Logged in: show case detail inside AppLayout
  return (
    <div className="p-4 sm:p-20">
      <ClientCaseDetailPage/>
    </div>
  );
}
