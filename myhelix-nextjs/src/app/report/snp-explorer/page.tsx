
import { readFileSync } from "fs";
import { join } from "path";
import SciencePanel from "@/components/SNPExplorer";

export const dynamic = "force-static";

export const metadata = {
  title: "The Science Behind the Panel | MyHelix",
  description:
    "Explore the scientific research behind the genetic variants included in the MyHelix panel.",
};

export default function SciencePage() {
  const filePath = join(
    process.cwd(),
    "public",
    "data",
    "panel_v2.json"
  );

  const variants = JSON.parse(
    readFileSync(filePath, "utf-8")
  );

  return <SciencePanel variants={variants} />;
}
