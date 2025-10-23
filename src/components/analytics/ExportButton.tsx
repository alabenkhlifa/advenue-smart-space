import { exportCampaignToCSV } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  campaignId: string;
  campaignName: string;
}

export const ExportButton = ({ campaignId, campaignName }: ExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const csvData = exportCampaignToCSV(campaignId, campaignName);

      // Create a blob and download
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Create filename with campaign name and date
      const date = new Date().toISOString().split("T")[0];
      const filename = `${campaignName.replace(/[^a-z0-9]/gi, "_")}_analytics_${date}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Exported",
        description: `Analytics report downloaded as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export analytics report. Please try again.",
      });
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Export Report
    </Button>
  );
};
