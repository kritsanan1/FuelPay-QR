import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings, Home, BarChart3 } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-4 right-4 z-50 flex space-x-2">
      {location !== "/" && (
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="w-4 h-4 mr-1" />
            หน้าหลัก
          </Button>
        </Link>
      )}
      {location !== "/admin" && (
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-1" />
            Admin
          </Button>
        </Link>
      )}
    </nav>
  );
}